Dexa AI 🧠
 
A collaborative, multimodal AI assistant that combines **Financial Analysis**, **Real-time Music**, **Live Weather**, and **Coding Capabilities** into a single workspace. Built with **Flask**, **React**, and **Google Gemini 2.0 Flash**.

It hasnt been deployed but can be deployed , It was more of a fun and learning project that gavea me a an inside to how python works and whether or not I would prefer pursuing it in future.

🚀 Key Features

🧠 Multimodal AI: Powered by Google Gemini 2.0 Flash for blazing-fast, context-aware responses.
🤝 Real-Time Collaboration: Share unique room codes to invite friends. Chat, listen to music, and analyze data together in the same room.
📈 Financial Intelligence:
 - Live Indian Stocks (NSE): Real-time INR prices for stocks (e.g., `RELIANCE.NS`).
 - Technical Analysis Engine: Calculates **RSI**, **Volatility**, and **SMA (50-Day)** using `NumPy` to give data-backed market predictions.
 - Commodities: Live tracking for Gold, Silver, and Oil with currency conversion (USD → INR).
   
🎵 Intelligent Music Player:
 - "Play [Song Name]" triggers an embedded **Spotify Player** for everyone in the chat.
 - Lyrics Search : Uses a custom scraper (`ddgs`) to fetch real lyrics from Genius/AZLyrics to prevent AI hallucinations.
 - Smart Weather : Parses complex queries (e.g., "Weather in Chipni") using `wttr.in`.
 - File Understanding : Upload `.zip` project files; Dexa extracts, reads, and explains the code structure inside.

🛠️ Tech Stack

Backend (Python)
- Flask : Micro-framework for handling API routes and WebSocket-like state.
- SQLAlchemy (PostgreSQL) : ORM for robust database management (Users, Chats, Messages).
- Google GenAI SDK : Interface for the Gemini 2.0 model.
- NumPy : Used for high-speed financial math (Standard Deviation, Moving Averages).
- DuckDuckGo Search (`ddgs`) : For real-time lyric fetching without API keys.

Frontend (React)

- Tailwind CSS : For a modern, responsive, dark-mode UI.
- Fetch API : For asynchronous communication with the backend.

⚙️ Installation & Setup

1.  Clone the Repo
    ```bash
    git clone [https://github.com/yourusername/dexa-ai.git](https://github.com/yourusername/dexa-ai.git)
    cd dexa-ai
    ```

2.  Backend Setup
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    
    # Run the server
    python app.py
    ```

3.  Frontend Setup
    ```bash
    cd frontend
    npm install
    npm start
    ```

4.  Environment Variables
    Create a `.env` file in `backend/` with:
    ```env
    GOOGLE_API_KEY=your_gemini_key
    SPOTIFY_CLIENT_ID=your_spotify_id
    SPOTIFY_CLIENT_SECRET=your_spotify_secret
    SECRET_KEY=supersecretkey
    ```

🤝 Contributing 
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

📄 License
[MIT](https://choosealicense.com/licenses/mit/)
