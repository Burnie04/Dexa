import os
import json
import base64
import zipfile
import io
import requests
import numpy as np 
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from google import genai
from google.genai import types
from dotenv import load_dotenv
import yfinance as yf
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from ddgs import DDGS # ✨ NEW LIBRARY IMPORT
from bs4 import BeautifulSoup
from datetime import datetime, timezone

from models import db, User, Chat, Message, chat_participants

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-key-goes-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:%40%40diT2004@localhost:5432/dexa_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)

with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# --- CLIENTS ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID") 
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
sp = None
if SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET:
    try:
        sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET))
    except: pass

# --- TOOLS ---

def get_real_lyrics(query):
    """
    Robust Lyrics Fetcher using DDGS.
    """
    try:
        # Search for "Song Name lyrics"
        with DDGS() as ddgs:
            # Try getting 2 results in case the first is a bad link
            results = list(ddgs.text(f"{query} lyrics genius", max_results=2))
        
        if not results: return None
        
        # Try fetching the first valid URL
        for res in results:
            url = res['href']
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
                response = requests.get(url, headers=headers, timeout=5)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Genius Scraper
                    if "genius.com" in url:
                        lyrics_divs = soup.find_all("div", attrs={"data-lyrics-container": "true"})
                        if lyrics_divs:
                            text = "\n".join([div.get_text(separator="\n") for div in lyrics_divs])
                            return f"SOURCE: Genius\n\n{text[:3000]}"
                    
                    # AZLyrics Scraper
                    elif "azlyrics.com" in url:
                        divs = soup.find_all('div', attrs={'class': None})
                        for div in divs:
                            if len(div.find_all('br')) > 10:
                                return f"SOURCE: AZLyrics\n\n{div.get_text(separator='\n').strip()[:3000]}"
            except:
                continue # Try next result if this one fails

        return None
        
    except Exception as e:
        print(f"Lyrics Search Error: {e}")
        return None

def process_zip_file(file_bytes):
    try:
        context_str = "USER UPLOADED A ZIP FILE. CONTENTS:\n"
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            for filename in z.namelist():
                if filename.endswith(('.py', '.js', '.txt', '.md', '.json', '.html', '.css', '.csv')):
                    try:
                        with z.open(filename) as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            context_str += f"\n--- FILE: {filename} ---\n{content[:5000]}\n"
                    except: pass
        return context_str
    except Exception as e:
        return f"Error reading zip: {str(e)}"

def search_spotify(query):
    if not sp: return None
    try:
        results = sp.search(q=query, limit=1, type='track')
        items = results['tracks']['items']
        if items:
            track = items[0]
            return {"spotify_id": track['id'], "name": track['name'], "artist": track['artists'][0]['name']}
    except: pass
    return None

def get_weather_data(user_text):
    try:
        clean_text = user_text.lower()
        triggers = ["what is the", "what's the", "weather", "temperature", "forecast", " in ", " at ", " for ", "like", "prediction", "?"]
        for t in triggers:
            clean_text = clean_text.replace(t, " ")
        location = clean_text.strip()
        if len(location) < 2: location = "Delhi"
        url = f"https://wttr.in/{location}?format=Condition:+%C+%t,+Humidity:+%h"
        r = requests.get(url)
        if r.status_code == 200 and "Unknown location" not in r.text:
            return f"REPORT FOR {location.upper()}: {r.text.strip()}"
        return f"Could not find weather for '{location}'."
    except: return "Weather service error."

def analyze_stock_technical(user_text):
    try:
        words = user_text.replace("?", "").replace(",", "").split()
        ignore = ["what", "is", "the", "price", "of", "today", "live", "prediction", "for", "stock", "market", "analysis", "share", "buy", "sell"]
        candidates = [w for w in words if w.lower() not in ignore]
        if not candidates: return None
        target = candidates[-1] 
        ticker_map = {"gold": "GC=F", "silver": "SI=F", "crude": "CL=F", "oil": "CL=F", "bitcoin": "BTC-USD", "nifty": "^NSEI", "sensex": "^BSESN"}
        ticker_symbol = ticker_map.get(target.lower())
        if not ticker_symbol:
            temp_symbol = f"{target}.NS"
            if not yf.Ticker(temp_symbol).history(period="5d").empty: ticker_symbol = temp_symbol
            elif not yf.Ticker(target).history(period="5d").empty: ticker_symbol = target
        if not ticker_symbol: return None

        stock = yf.Ticker(ticker_symbol)
        hist = stock.history(period="3mo")
        if hist.empty: return None

        current_price = hist['Close'].iloc[-1]
        price_display = f"${round(current_price, 2)}"
        
        if ".NS" not in ticker_symbol and ticker_symbol not in ["^NSEI", "^BSESN"]:
            try:
                usdinr = yf.Ticker("INR=X").history(period="1d")['Close'].iloc[-1]
                price_inr = current_price * usdinr
                if target.lower() == "gold":
                    price_10g = (price_inr / 31.1035) * 10 
                    price_display = f"₹{round(price_10g, 2)} (per 10g approx) / ${round(current_price, 2)} (Global oz)"
                else:
                    price_display = f"₹{round(price_inr, 2)} / ${round(current_price, 2)}"
            except: pass
        else:
            price_display = f"₹{round(current_price, 2)}"

        sma_50 = hist['Close'].rolling(window=50).mean().iloc[-1]
        daily_returns = hist['Close'].pct_change().dropna()
        volatility = daily_returns.std() * 100 
        trend = "BULLISH (Upward)" if current_price > sma_50 else "BEARISH (Downward)"
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs)).iloc[-1]

        return f"LIVE DATA FOR {target.upper()} ({ticker_symbol}):\n- Price: {price_display}\n- Trend: {trend}\n- RSI: {round(rsi, 2)}\n- Volatility: {round(volatility, 2)}%"
    except Exception as e: return f"Analysis Error: {str(e)}"

# --- ROUTES ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first(): return jsonify({"error": "Taken"}), 400
    hashed = generate_password_hash(data['password'], method='scrypt')
    user = User(username=data['username'], password=hashed)
    db.session.add(user); db.session.commit()
    return jsonify({"message": "User created!"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password, data['password']):
        login_user(user)
        return jsonify({"message": "Logged in", "username": user.username})
    return jsonify({"error": "Invalid"}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout(): logout_user(); return jsonify({"message": "Logged out"})

@app.route('/api/me', methods=['GET'])
def check_session():
    if current_user.is_authenticated: return jsonify({"authenticated": True, "username": current_user.username})
    return jsonify({"authenticated": False}), 401

@app.route('/api/chats', methods=['GET'])
@login_required
def get_chats():
    my_chats = Chat.query.filter((Chat.owner_id == current_user.id) | (Chat.participants.any(id=current_user.id))).order_by(Chat.created_at.desc()).all()
    return jsonify([{"id": c.id, "title": c.title, "shared": (c.owner_id != current_user.id), "owner": c.owner.username} for c in my_chats])

@app.route('/api/chats', methods=['POST'])
@login_required
def create_chat():
    new_chat = Chat(owner_id=current_user.id, title="New Conversation")
    db.session.add(new_chat); db.session.commit()
    return jsonify({"id": new_chat.id, "title": new_chat.title})

@app.route('/api/chats/<int:chat_id>/share', methods=['POST'])
@login_required
def get_share_code(chat_id):
    chat = db.session.get(Chat, chat_id)
    if not chat or (chat.owner_id != current_user.id): return jsonify({"error": "Unauthorized"}), 403
    return jsonify({"share_code": chat.share_code})

@app.route('/api/join', methods=['POST'])
@login_required
def join_chat():
    code = request.json.get('share_code')
    chat = Chat.query.filter_by(share_code=code).first()
    if not chat: return jsonify({"error": "Invalid Code"}), 404
    if current_user != chat.owner and current_user not in chat.participants:
        chat.participants.append(current_user)
        db.session.commit()
    return jsonify({"message": "Joined!", "chat_id": chat.id})

@app.route('/api/chats/<int:chat_id>', methods=['GET'])
@login_required
def get_messages(chat_id):
    chat = db.session.get(Chat, chat_id)
    has_access = (chat.owner_id == current_user.id) or (current_user in chat.participants)
    if not chat or not has_access: return jsonify({"error": "Unauthorized"}), 403
    msgs = [{"sender": m.sender, "text": m.text, "mood": m.mood, "spotify_embed_id": m.spotify_embed_id, "file": m.file_attachment} for m in chat.messages]
    return jsonify({"title": chat.title, "messages": msgs, "share_code": chat.share_code})

@app.route('/api/chats/<int:chat_id>/message', methods=['POST'])
@login_required
def send_message(chat_id):
    chat = db.session.get(Chat, chat_id)
    has_access = (chat.owner_id == current_user.id) or (current_user in chat.participants)
    if not chat or not has_access: return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    user_text = data.get('message', '')
    file_data = data.get('file_data', None)
    mime_type = data.get('mime_type', None)
    file_name = data.get('file_name', None)

    zip_content = ""
    if file_data and mime_type == 'application/zip':
        file_bytes = base64.b64decode(file_data.split("base64,")[1])
        zip_content = process_zip_file(file_bytes)
        user_text += f"\n[SYSTEM: ZIP EXTRACTED]\n{zip_content}"

    user_msg = Message(chat_id=chat.id, sender=current_user.username, text=user_text if not zip_content else f"Uploaded {file_name}", file_attachment=file_name)
    db.session.add(user_msg)

    tool_context = ""
    lower = user_text.lower()
    
    # Financial Analysis
    if any(w in lower for w in ["price", "gold", "silver", "stock", "market", "analysis", "predict", "buy", "sell"]):
        analysis = analyze_stock_technical(user_text)
        if analysis: tool_context += f"\n{analysis}"

    # Weather
    if "weather" in lower or "temperature" in lower:
        tool_context += f"\n[WEATHER DATA]: {get_weather_data(user_text)}"
        
    # Lyrics Trigger (with fallback logic)
    if "lyrics" in lower:
        search_term = user_text.replace("lyrics", "").strip()
        lyrics_data = get_real_lyrics(search_term)
        if lyrics_data:
            tool_context += f"\n[REAL LYRICS FOUND]:\n{lyrics_data}"
        else:
            # ✅ FALLBACK: Explicitly tell AI to use memory if search fails
            tool_context += "\n[SYSTEM]: Internet lyrics search failed. PLEASE RECITE LYRICS FROM YOUR INTERNAL MEMORY ACCURATELY."

    system_instruction = f"""
    You are Dexa.
    - LYRICS EXPERT: If [REAL LYRICS FOUND] is present, use it. IF NOT, recite the exact lyrics from your training data. Do not say "I can't find it".
    - FINANCIAL ANALYST: Use the LIVE DATA provided. 
    - WEATHER: Use report provided.
    - DJ: Set 'spotify_search' if asked to play.
    
    CONTEXT:
    {tool_context}
    
    RESPONSE JSON: {{ "response": "...", "mood": "happy", "spotify_search": null }}
    """

    try:
        contents = [user_text]
        if file_data and mime_type.startswith('image/'):
             contents.append(types.Part.from_bytes(data=base64.b64decode(file_data.split(",")[1]), mime_type=mime_type))

        response = client.models.generate_content(
            model='gemini-2.0-flash', contents=contents,
            config={'system_instruction': system_instruction, 'response_mime_type': 'application/json'}
        )
        ai_data = json.loads(response.text)

        spotify_id = None
        if ai_data.get('spotify_search'):
            track = search_spotify(ai_data['spotify_search'])
            if track: 
                spotify_id = track['spotify_id']
                ai_data['response'] += f" 🎵 Playing {track['name']}..."

        bot_msg = Message(chat_id=chat.id, sender='Dexa', text=ai_data['response'], mood=ai_data.get('mood', 'neutral'), spotify_embed_id=spotify_id)
        db.session.add(bot_msg)
        db.session.commit()
        
        ai_data['spotify_embed_id'] = spotify_id
        return jsonify(ai_data)

    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}", "mood": "serious"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)