import React from 'react';

export default function Sidebar({ currentTab, setTab, pendingRequestsCount = 0 }) {
  const erpItems = [
    { id: 'erp-overview', label: 'Overview', icon: '📊' },
    { id: 'erp-department', label: 'My Department', icon: '🏢' },
    { id: 'erp-cases', label: 'Cases & Records', icon: '📁' },
    { id: 'erp-workspace', label: 'Investigation Workspace', icon: '📌' },
    { id: 'erp-access', label: 'Access Control', icon: '🔑', badge: pendingRequestsCount },
    { id: 'erp-temporary', label: 'Temporary Access', icon: '⏱️' },
    { id: 'erp-security', label: 'Security Guardian', icon: '🛡️' },
    { id: 'erp-audit', label: 'Audit Trail (Hash Chain)', icon: '🔗' },
    { id: 'erp-reports', label: 'Reports & Export', icon: '📄' },
    { id: 'erp-management', label: 'Management Overview', icon: '🏛️' },
  ];

  const intelligenceItems = [
    { id: 'intel-search', label: 'Entity Search', icon: '🔎' },
    { id: 'intel-360', label: 'Entity 360° Dossier', icon: '👤' },
    { id: 'intel-network', label: 'Network Graph (Draggable)', icon: '🕸️' },
    { id: 'intel-why', label: 'Why Connected? (Paths)', icon: '⚡' },
    { id: 'intel-cross', label: 'Cross-Case Analysis', icon: '🔄' },
    { id: 'intel-timeline', label: 'Event Timeline', icon: '⏳' },
    { id: 'intel-map', label: 'Tactical Map', icon: '🗺️' },
    { id: 'intel-biometric', label: 'Biometric Search', icon: '🧬' },
    { id: 'intel-ai', label: 'AI Investigation Copilot', icon: '🤖' },
  ];

  const analyticsItems = [
    { id: 'analytics-anomalies', label: 'Anomaly Detection', icon: '⚠️' },
  ];

  const settingsItems = [
    { id: 'settings', label: 'System & Profile Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#090e1c] flex flex-col h-[calc(100vh-4rem)] overflow-y-auto shrink-0 select-none">
      <div className="p-4 space-y-6">
        {/* Dashboard Shortcut */}
        <div>
          <button
            onClick={() => setTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
              currentTab === 'dashboard'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <span className="text-base">🧭</span>
            <span>Command Dashboard</span>
          </button>
        </div>

        {/* ERP SYSTEM */}
        <div>
          <div className="text-[11px] uppercase font-mono tracking-wider text-cyan-400 font-bold px-3 mb-2 flex items-center justify-between">
            <span>ERP SYSTEM</span>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">CORE</span>
          </div>
          <div className="space-y-1">
            {erpItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition ${
                  currentTab === item.id
                    ? 'bg-slate-800 text-cyan-400 font-semibold border-l-2 border-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="text-sm">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 rounded-full font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* INTELLIGENCE INVESTIGATION */}
        <div>
          <div className="text-[11px] uppercase font-mono tracking-wider text-purple-400 font-bold px-3 mb-2 flex items-center justify-between">
            <span>INTELLIGENCE WORKSPACE</span>
            <span className="text-[9px] bg-purple-950/70 text-purple-300 px-1.5 py-0.5 rounded">INTEL</span>
          </div>
          <div className="space-y-1">
            {intelligenceItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs transition ${
                  currentTab === item.id
                    ? 'bg-slate-800 text-purple-300 font-semibold border-l-2 border-purple-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ANALYTICS */}
        <div>
          <div className="text-[11px] uppercase font-mono tracking-wider text-amber-400 font-bold px-3 mb-2">
            ANALYTICS
          </div>
          <div className="space-y-1">
            {analyticsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs transition ${
                  currentTab === item.id
                    ? 'bg-slate-800 text-amber-400 font-semibold border-l-2 border-amber-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SETTINGS */}
        <div>
          <div className="text-[11px] uppercase font-mono tracking-wider text-slate-500 font-bold px-3 mb-2">
            CONFIGURATION
          </div>
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs transition ${
                  currentTab === item.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-4 border-t border-slate-800/80 bg-[#070b16] text-[10px] text-slate-500 font-mono">
        <div>TEAM NETRISH • 034</div>
        <div className="text-slate-600">SMART INDIA HACKATHON 2026</div>
      </div>
    </aside>
  );
}
