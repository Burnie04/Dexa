import React, { useState } from 'react';

// Pass isDarkMode prop to handle theming
function Auth({ onLogin, isDarkMode }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/api/register' : '/api/login';
    setError('');

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include' 
      });
      
      const data = await res.json();
      if (res.ok) {
        if (isRegister) {
            setIsRegister(false); 
            setError("Account created! You can now login.");
        } else {
            onLogin(data.username);
        }
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError("Server error: Is the Python backend running?");
    }
  };

  // Dynamic Theme Classes
  const theme = isDarkMode ? {
    bg: "bg-gray-950",
    text: "text-white",
    cardBg: "bg-white/5 border-white/10",
    inputBg: "bg-black/50 border-gray-700/50 text-white placeholder-gray-500",
    headingGradient: "from-white to-gray-400",
    subText: "text-gray-400"
  } : {
    bg: "bg-gray-100",
    text: "text-gray-900",
    cardBg: "bg-white/80 border-gray-200 shadow-xl",
    inputBg: "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
    headingGradient: "from-gray-900 to-gray-600",
    subText: "text-gray-600"
  };


  return (
    <div className={`min-h-screen w-full flex items-center justify-center ${theme.bg} relative overflow-hidden ${theme.text} font-sans transition-colors duration-500`}>
      
      {/* Softer Background Glow Effects */}
      <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${isDarkMode ? 'bg-cyan-900/20' : 'bg-cyan-200/40'}`}></div>
      <div className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${isDarkMode ? 'bg-teal-900/20' : 'bg-teal-200/40'}`}></div>

      <div className={`relative z-10 backdrop-blur-xl border p-10 rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 ${theme.cardBg}`}>
        
        <div className="flex flex-col items-center mb-8">
            {/* Soothing Cyan Icon */}
            <div className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-teal-600 rounded-xl mb-4 shadow-lg shadow-cyan-500/30"></div>
            <h2 className={`text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b ${theme.headingGradient}`}>
            {isRegister ? "Join Dexa" : "Welcome Back"}
            </h2>
            <p className={`${theme.subText} mt-2 text-sm`}>
                {isRegister ? "Create your AI workspace" : "Sign in to continue"}
            </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`${theme.subText} block text-xs font-bold uppercase tracking-wider mb-2 ml-1`}>Username</label>
            <input 
              type="text" 
              className={`w-full border p-4 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner ${theme.inputBg}`}
              placeholder="Enter username"
              value={username} onChange={e => setUsername(e.target.value)}
            />
          </div>
          
          <div>
            <label className={`${theme.subText} block text-xs font-bold uppercase tracking-wider mb-2 ml-1`}>Password</label>
            <input 
              type="password" 
              className={`w-full border p-4 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner ${theme.inputBg}`}
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          {/* Soothing Cyan Button */}
          <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded-xl font-bold transition-all shadow-lg shadow-cyan-600/30 hover:shadow-cyan-600/50 hover:-translate-y-1">
            {isRegister ? "Create Account" : "Enter Dexa"}
          </button>
        </form>

        <div className={`mt-8 text-center pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
          <p className={`${theme.subText} text-sm`}>
            {isRegister ? "Already have an account?" : "New to Dexa?"}
            <button 
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="ml-2 text-cyan-600 hover:text-cyan-500 font-bold hover:underline transition-colors"
            >
              {isRegister ? "Login" : "Register"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Auth;