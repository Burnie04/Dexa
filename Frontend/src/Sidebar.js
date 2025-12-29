import React, { useState } from 'react';

function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, onLogout, username, isDarkMode, toggleTheme }) {
  const [joinCode, setJoinCode] = useState('');

  const handleJoin = async () => {
    if (!joinCode) return;
    const res = await fetch('http://localhost:5000/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_code: joinCode }),
        credentials: 'include'
    });
    if (res.ok) {
        alert("Joined chat successfully!");
        setJoinCode('');
        window.location.reload(); 
    } else {
        alert("Invalid Code");
    }
  };

  const theme = isDarkMode ? {
    bg: "bg-gray-900 border-white/5",
    text: "text-white",
    input: "bg-gray-950 border-gray-800 text-white",
    active: "bg-white/10 text-white border-white/5"
  } : {
    bg: "bg-white border-gray-200",
    text: "text-gray-900",
    input: "bg-gray-50 border-gray-200 text-gray-900",
    active: "bg-cyan-50 text-cyan-900 border-cyan-100"
  };

  return (
    <div className={`w-72 ${theme.bg} border-r flex flex-col h-screen transition-colors duration-500`}>
      <div className="p-6">
        <h1 className={`text-2xl font-bold ${theme.text} mb-6 flex items-center gap-2`}>
           <span className="w-3 h-3 rounded-full bg-cyan-500"></span> Dexa AI
        </h1>
        <button onClick={onNewChat} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-cyan-900/20 mb-4">
          <span>+</span> New Chat
        </button>
        
        <div className="flex gap-2">
            <input 
                placeholder="Enter Share Code..." 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${theme.input}`}
            />
            <button onClick={handleJoin} className="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded-lg text-xs">Join</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Conversations</h3>
        {chats.map(chat => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full text-left p-3 rounded-lg text-sm truncate transition-all border ${
              chat.id === currentChatId ? theme.active : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            {chat.shared ? "👥 " : ""}{chat.title}
          </button>
        ))}
      </div>

      <div className={`p-4 border-t ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between text-sm">
          
          {/* ✨ UPDATED: User Avatar Section */}
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-purple-500/30">
                {username ? username[0].toUpperCase() : 'U'}
             </div>
             <span className={`${theme.text} font-medium`}>{username}</span>
          </div>

          <div className="flex gap-2">
            <button onClick={toggleTheme} className="p-2 opacity-50 hover:opacity-100">{isDarkMode ? '☀️' : '🌙'}</button>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-400 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;