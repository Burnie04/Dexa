import React, { useState, useEffect, useRef } from 'react';
import Auth from './Auth';
import Sidebar from './Sidebar';

function App() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [shareCode, setShareCode] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  useEffect(() => {
    fetch('http://localhost:5000/api/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => { setUser(data.username); fetchChats(); })
      .catch(() => setUser(null));
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/chats', { credentials: 'include' });
      setChats(await res.json());
    } catch (err) {}
  };

  const loadChat = async (id) => {
    setCurrentChatId(id);
    setLoading(true);
    setShareCode(null);
    try {
      const res = await fetch(`http://localhost:5000/api/chats/${id}`, { credentials: 'include' });
      const data = await res.json();
      setMessages(data.messages);
      setShareCode(data.share_code);
    } catch (err) {}
    setLoading(false);
  };

  const createNewChat = async () => {
    const res = await fetch('http://localhost:5000/api/chats', { method: 'POST', credentials: 'include' });
    const data = await res.json();
    setChats([data, ...chats]);
    loadChat(data.id);
  };

  const copyShareCode = () => {
    if (shareCode) {
        navigator.clipboard.writeText(shareCode);
        alert(`Share Code Copied: ${shareCode}\n\nSend this to a friend to let them join!`);
    }
  };

  const convertToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const sendMessage = async () => {
    if ((!input.trim() && !selectedFile) || !currentChatId) return;
    
    let fileData = null; 
    let mimeType = null; 
    let fileName = null;
    let displayText = input;

    if (selectedFile) {
        try { 
            fileData = await convertToBase64(selectedFile); 
            mimeType = selectedFile.type; 
            fileName = selectedFile.name;
            displayText += ` [📎 ${selectedFile.name}]`; 
        } catch (e) {}
    }
    
    setMessages(prev => [...prev, { sender: user, text: displayText }]);
    setInput(''); setSelectedFile(null); setLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/chats/${currentChatId}/message`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, file_data: fileData, mime_type: mimeType, file_name: fileName }), 
        credentials: 'include'
      });
      const data = await res.json();
      
      const botMsg = { sender: 'Dexa', text: data.response, mood: data.mood };
      if (data.spotify_embed_id) {
          botMsg.spotify_embed_id = data.spotify_embed_id;
      }
      
      setMessages(prev => [...prev, botMsg]);
      fetchChats();
    } catch (error) {} finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await fetch('http://localhost:5000/api/logout', { method: 'POST', credentials: 'include' });
    setUser(null); setChats([]); setMessages([]); setCurrentChatId(null);
  };

  if (!user) return <Auth onLogin={(u) => { setUser(u); fetchChats(); }} isDarkMode={isDarkMode} />;

  const theme = isDarkMode ? {
    mainBg: "bg-[#0a0a0a]", 
    text: "text-gray-100",
    botBubble: "bg-[#151515] border border-white/5",
    inputBg: "bg-[#151515]/80 backdrop-blur-xl border-white/10",
  } : {
    mainBg: "bg-gray-50",
    text: "text-gray-900",
    botBubble: "bg-white border border-gray-200 shadow-sm",
    inputBg: "bg-white/80 backdrop-blur-xl border-gray-200",
  };

  // HELPER: Check if message is from Bot
  const isBot = (sender) => sender === 'Dexa' || sender === 'bot';

  return (
    <div className={`flex h-screen ${theme.mainBg} ${theme.text} font-sans overflow-hidden transition-colors duration-500`}>
      <Sidebar chats={chats} currentChatId={currentChatId} onSelectChat={loadChat} onNewChat={createNewChat} onLogout={handleLogout} username={user} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
      
      <div className="flex-1 flex flex-col relative h-full">
        {!currentChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fadeIn">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30"><span className="text-4xl">🧠</span></div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Dexa AI</h2>
                <p className="opacity-60">Try: "Gold Price in INR" or "Play some music"</p>
            </div>
        ) : (
            <>
                <div className="absolute top-4 right-4 z-40">
                    <button onClick={copyShareCode} className="bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-500 hover:text-cyan-400 border border-cyan-500/20 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-md transition-all flex items-center gap-2">
                        <span>📤</span> Share Chat
                    </button>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar scroll-smooth">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${!isBot(msg.sender) ? 'items-end' : 'items-start'} animate-slideUp`}>
                      
                      {!isBot(msg.sender) && (
                          <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 mr-2 tracking-wider">{msg.sender}</span>
                      )}

                      <div className={`flex max-w-3xl items-end gap-3 ${!isBot(msg.sender) ? 'flex-row-reverse' : 'flex-row'}`}>
                          
                          {isBot(msg.sender) && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white text-xs font-bold">D</div>
                          )}

                          {!isBot(msg.sender) && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white text-xs font-bold">
                                  {msg.sender ? msg.sender[0].toUpperCase() : 'U'}
                              </div>
                          )}

                          <div className={`p-4 px-6 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                            !isBot(msg.sender) ? 'bg-cyan-600 text-white rounded-br-none' : `${theme.botBubble} rounded-bl-none`
                          }`}>
                            {msg.text}
                          </div>
                      </div>

                      {msg.spotify_embed_id && (
                          <div className="mt-4 ml-11 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-white/10">
                              <iframe title={`Spotify track ${msg.spotify_embed_id}`} style={{borderRadius: "12px", border: "none"}} src={`https://open.spotify.com/embed/track/${msg.spotify_embed_id}?utm_source=generator&theme=0`} width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                          </div>
                      )}
                    </div>
                  ))}
                  <div className="h-32 w-full flex-shrink-0"></div> 
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 z-50">
                    <div className="max-w-4xl mx-auto flex items-end gap-2">
                        <input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files[0])} className="hidden" accept="image/*,application/pdf,application/zip,.zip,.txt,.py,.js"/>
                        <button onClick={() => fileInputRef.current.click()} className={`p-4 rounded-2xl transition-all border border-white/5 ${selectedFile ? 'bg-green-600 text-white' : 'bg-[#151515]/90 text-gray-400 hover:text-white backdrop-blur-md'}`}>
                            {selectedFile ? '📎' : '➕'}
                        </button>
                        <div className="relative flex-1 group">
                            {selectedFile && <div className="absolute -top-10 left-0 bg-black/80 text-green-400 px-3 py-1 rounded-lg text-xs border border-green-500/30 backdrop-blur-md">File: {selectedFile.name}</div>}
                            <input className={`w-full p-4 pl-6 pr-32 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-2xl transition-all ${theme.inputBg}`} placeholder="Message Dexa..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}/>
                            <button onClick={sendMessage} className="absolute right-2 top-2 bottom-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-xl font-semibold transition-transform active:scale-95 shadow-lg shadow-cyan-600/20">Send</button>
                        </div>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}

export default App;