import React, { useState, useEffect } from 'react';

export default function SecurityGuardianView({ setTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/erp/security-guardian')
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-red-400 font-mono text-xs font-semibold mb-1">
          <span>ERP SECURITY CONTROL</span>
          <span>•</span>
          <span>THREAT MONITOR & INTRUSION DETECTION</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          SECURITY GUARDIAN SHIELD
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Monitors behavioral anomalies, brute-force credential stuffing, suspicious cross-query spikes, and unauthorized export attempts across all terminal nodes.
        </p>
      </div>

      {loading ? (
        <div className="text-xs font-mono text-cyan-400 p-8 text-center">Scanning perimeter security matrix...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Status Alert Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase">PERIMETER THREAT LEVEL</span>
              <div className="text-xl font-black font-mono text-red-400 mt-1">{data.threatLevel}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-2">Active Surveillance Active</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase">HIGH SEVERITY ALERTS</span>
              <div className="text-xl font-black font-mono text-white mt-1">{data.stats.highAlerts}</div>
              <div className="text-[11px] text-red-400 font-mono mt-2">Requires Security Review</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase">TOTAL ANOMALY SIGNALS</span>
              <div className="text-xl font-black font-mono text-cyan-400 mt-1">{data.stats.totalAlerts}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-2">All Logged to Hash Chain</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase">MONITORED WORKSTATIONS</span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-1">{data.stats.monitoredNodes}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-2">100% Policy Enforced</div>
            </div>
          </div>

          {/* Active Incident Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                ACTIVE SECURITY INFRACTIONS & THREAT LOGS
              </h3>
              <button
                onClick={() => setTab('erp-audit')}
                className="text-xs font-mono text-cyan-400 hover:underline"
              >
                Inspect Append-Only Audit Trail →
              </button>
            </div>

            <div className="space-y-3">
              {data.alerts?.map((al, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-red-400">{al.type}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        al.severity === 'HIGH' ? 'bg-red-950 border-red-700 text-red-300' : 'bg-amber-950 border-amber-700 text-amber-300'
                      }`}>
                        {al.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{al.details}</p>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-500 shrink-0">
                    <div>{new Date(al.timestamp).toLocaleTimeString()}</div>
                    <div className="text-slate-600">Incident ID: {al.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
