import React, { useState } from 'react';

export default function SettingsView({ currentUser, activeTheme, toggleTheme }) {
  const [pinCurrent, setPinCurrent] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const handleUpdatePin = (e) => {
    e.preventDefault();
    if (pinNew.length === 4) {
      if (currentUser) currentUser.pin = pinNew;
      setPinSuccess(true);
      setTimeout(() => setPinSuccess(false), 3000);
      setPinCurrent('');
      setPinNew('');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
          <span>SYSTEM CONFIGURATION</span>
          <span>•</span>
          <span>OFFICER CLEARANCE & PREFERENCES</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          SECURITY & TERMINAL SETTINGS
        </h1>
      </div>

      {/* Profile Dossier Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          AUTHENTICATED OFFICER PROFILE
        </h3>

        <div className="flex items-center space-x-5">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt="Officer"
            className="w-16 h-16 rounded-full border-2 border-cyan-400 object-cover"
          />
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">{currentUser?.name || 'Inspector Vikram Rathore'}</h4>
            <div className="text-xs font-mono text-cyan-400">{currentUser?.role || 'Senior Investigator'}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              Badge: <strong className="text-white">{currentUser?.id || 'OFFICER-001'}</strong> • Division: {currentUser?.department || 'D001'}
            </div>
          </div>
        </div>
      </div>

      {/* Security Credentials: PIN update */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          UPDATE 4-DIGIT NETRISH SECURITY PIN
        </h3>

        {pinSuccess && (
          <div className="p-3 bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-mono rounded-lg">
            ✓ Security PIN updated successfully in local session!
          </div>
        )}

        <form onSubmit={handleUpdatePin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">EXISTING PIN</label>
            <input
              type="password"
              maxLength={4}
              value={pinCurrent}
              onChange={(e) => setPinCurrent(e.target.value)}
              placeholder="••••"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">NEW 4-DIGIT PIN</label>
            <input
              type="password"
              maxLength={4}
              value={pinNew}
              onChange={(e) => setPinNew(e.target.value)}
              placeholder="••••"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono outline-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded-lg transition"
            >
              Update Security PIN
            </button>
          </div>
        </form>
      </div>

      {/* Display & Visual Preferences */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          VISUAL THEME & INTERFACE
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">Tactical Theme Mode</div>
            <div className="text-[11px] text-slate-400">Toggle between Dark Tactical Slate and Daylight Blue</div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs rounded-lg border border-slate-700 transition"
          >
            {activeTheme === 'dark' ? '🌙 Dark Tactical Slate' : '☀️ High Contrast Mode'}
          </button>
        </div>
      </div>
    </div>
  );
}
