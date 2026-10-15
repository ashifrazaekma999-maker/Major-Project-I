import React, { useState, useEffect } from 'react';

export default function Navbar({ currentUser, onLogout, onOpenLogin, activeTheme, toggleTheme }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0b1329]/95 backdrop-blur-md px-6 flex items-center justify-between z-30 sticky top-0 shadow-lg">
      {/* Brand & Emblem */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 p-0.5 shadow-cyan-500/30 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#090d16] rounded-[7px] flex items-center justify-center font-black tracking-widest text-cyan-400 text-sm">
              NET
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-white text-lg font-mono">NETRISH</span>
              <span className="bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest">
                SIH 2026 • PID 26189
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight hidden sm:block">
              National Entity Tracking, Relationship, Investigation & Secure Hub
            </p>
          </div>
        </div>
      </div>

      {/* Center Status Ticker */}
      <div className="hidden lg:flex items-center space-x-6 text-xs font-mono">
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300">DEFENSE GRID:</span>
          <span className="text-emerald-400 font-semibold">ONLINE (SECURE)</span>
        </div>
        <div className="text-slate-400">
          <span className="text-slate-500">TIME:</span>{' '}
          <span className="text-cyan-300 font-semibold">{currentTime.toLocaleTimeString()}</span>{' '}
          <span className="text-slate-600">IST</span>
        </div>
      </div>

      {/* Right Controls & User Info */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Tactical Mode"
          className="p-2 rounded-md bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-slate-700 transition"
        >
          {activeTheme === 'dark' ? '🌙' : '☀️'}
        </button>

        {currentUser ? (
          <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-cyan-500/50 object-cover"
            />
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-200">{currentUser.name}</div>
              <div className="text-[10px] text-cyan-400 font-mono flex items-center space-x-1">
                <span>{currentUser.role}</span>
                <span>•</span>
                <span>{currentUser.department}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="ml-2 text-xs bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 px-2.5 py-1 rounded transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold font-mono tracking-wider px-4 py-2 rounded-lg shadow-md shadow-cyan-600/20 border border-cyan-400/40 transition"
          >
            OFFICER AUTHENTICATION
          </button>
        )}
      </div>
    </header>
  );
}
