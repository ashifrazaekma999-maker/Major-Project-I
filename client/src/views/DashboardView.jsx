import React, { useState, useEffect } from 'react';

export default function DashboardView({ setTab, onSelectEntity, onSelectCase }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/erp/overview')
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex items-center space-x-3 text-cyan-400 font-mono text-sm">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span>SYNCHRONIZING TACTICAL DATA GRID...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const statusCounts = data?.statusCounts || {};
  const recentCases = data?.recentCases || [];
  const securityAlerts = data?.securityAlerts || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0b1736] to-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <span>⚡ SMART INDIA HACKATHON 2026</span>
              <span>•</span>
              <span>PROBLEM STATEMENT ID: 26189</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide font-mono">
              NETRISH COMMAND & INTELLIGENCE CENTER
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              AI-Powered Criminal Network Analysis System unifying departmental ERP operations, multi-hop relationship graph discovery, explainable forensic reasoning, and tamper-evident audit security.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setTab('intel-network')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-lg shadow-lg shadow-cyan-600/30 transition flex items-center space-x-2"
            >
              <span>🕸️</span>
              <span>LAUNCH GRAPH</span>
            </button>
            <button
              onClick={() => setTab('intel-ai')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold rounded-lg shadow-lg shadow-purple-600/30 transition flex items-center space-x-2"
            >
              <span>🤖</span>
              <span>AI COPILOT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">REGISTERED CASES</p>
              <h3 className="text-2xl font-black text-white font-mono mt-1">{stats.totalCases?.toLocaleString() || '989'}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-400 text-lg">📁</div>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <span className="text-emerald-400 font-semibold">{statusCounts.Solved || 214} Solved</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{statusCounts.Open || 412} Active</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">TRACKED ENTITIES</p>
              <h3 className="text-2xl font-black text-white font-mono mt-1">{stats.totalEntities?.toLocaleString() || '797'}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-lg">👤</div>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <span className="text-cyan-400">1,199 Phones</span>
            <span>•</span>
            <span className="text-slate-300">500 Vehicles</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">CORPUS RECORDS</p>
              <h3 className="text-2xl font-black text-white font-mono mt-1">{stats.totalRecords?.toLocaleString() || '10,000'}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-400 text-lg">📊</div>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-purple-300 font-mono">
            <span>22 Normalized Schema Fields</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">CROSS-DEPT REQUESTS</p>
              <h3 className="text-2xl font-black text-amber-400 font-mono mt-1">{stats.pendingRequests || 0}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400 text-lg">⏱️</div>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <span className="text-amber-400 font-semibold">Time-bound access gates</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Cases & Tactical Threat Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Cases Feed (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-base">📁</span>
              <h2 className="text-sm font-bold text-white font-mono tracking-wider">PRIORITY CASE DOSSIERS</h2>
            </div>
            <button
              onClick={() => setTab('erp-cases')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
            >
              View All 989 Cases →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentCases.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  if (onSelectCase) onSelectCase(c.id);
                  setTab('erp-cases');
                }}
                className="bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-cyan-300 text-sm group-hover:text-cyan-400">
                    {c.id}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    c.status === 'Solved' ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' :
                    c.status === 'Under_Investigation' ? 'bg-purple-950/70 border-purple-500/40 text-purple-300' :
                    'bg-amber-950/70 border-amber-500/40 text-amber-300'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{c.title}</h4>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Unit: {c.department}</span>
                  <span>{c.suspectsCount} Suspects</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Security Guardian & Live Alerts (1 Col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-base">🛡️</span>
              <h2 className="text-sm font-bold text-white font-mono tracking-wider">SECURITY GUARDIAN</h2>
            </div>
            <span className="bg-red-950/80 border border-red-500/40 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded-full animate-pulse">
              DEFCON 3
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {securityAlerts.length > 0 ? (
              securityAlerts.map((alert, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-red-950/80 hover:border-red-500/40 p-3 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-red-400 font-bold">{alert.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{alert.details}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No active critical security infractions detected.
              </div>
            )}
          </div>

          <button
            onClick={() => setTab('erp-audit')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold rounded-lg transition text-center"
          >
            Inspect Tamper-Evident Hash Audit →
          </button>
        </div>
      </div>
    </div>
  );
}
