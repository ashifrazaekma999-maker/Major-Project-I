import React, { useState, useEffect } from 'react';

export default function Entity360View({ entityId = 'P0732', onSelectEntity, onSelectCase, setTab }) {
  const [activeId, setActiveId] = useState(entityId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveId(entityId);
  }, [entityId]);

  useEffect(() => {
    if (activeId) fetchDossier(activeId);
  }, [activeId]);

  const fetchDossier = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/intelligence/entity/${id}`);
      const json = await res.json();
      if (json.success) setData(json.entity);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
            <span>INTELLIGENCE INVESTIGATION</span>
            <span>•</span>
            <span>UNIFIED 360° DOSSIER</span>
          </div>
          <h1 className="text-xl font-black text-white font-mono tracking-wide">
            SUSPECT & ENTITY PROFILER
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={activeId}
            onChange={(e) => setActiveId(e.target.value.toUpperCase())}
            placeholder="Enter Entity ID (e.g. P0732)"
            className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-3 py-2 rounded-lg outline-none"
          />
          <button
            onClick={() => fetchDossier(activeId)}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded-lg transition"
          >
            Load Dossier
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-cyan-400 font-mono text-xs">
          FETCHING CLASSIFIED DOSSIER...
        </div>
      ) : !data ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Entity not found in intelligence corpus.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start space-x-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-lg">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-mono font-bold text-2xl text-cyan-400">
                    {data.id.slice(0, 3)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-white font-mono">{data.label}</h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400">
                      ID: {data.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Classification Role: <strong className="text-amber-400">{data.role}</strong>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      Linked Cases: {data.cases?.length || 0}
                    </span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      Phones: {data.phones?.length || 0}
                    </span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      Vehicles: {data.vehicles?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Threat Gauge */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">ANOMALY INDEX</div>
                  <div className={`text-2xl font-black font-mono ${data.riskScore > 80 ? 'text-red-400' : 'text-amber-400'}`}>
                    {data.riskScore}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{data.classification}</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-red-500 flex items-center justify-center font-mono text-xs font-bold text-white">
                  ⚠️
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  onSelectEntity(data.id);
                  setTab('intel-network');
                }}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-bold transition flex items-center space-x-1.5"
              >
                <span>🕸️</span>
                <span>Open in Network Graph</span>
              </button>
              <button
                onClick={() => {
                  onSelectEntity(data.id);
                  setTab('intel-why');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-mono font-semibold border border-slate-700 transition flex items-center space-x-1.5"
              >
                <span>⚡</span>
                <span>Trace Connections ("Why Connected?")</span>
              </button>
            </div>
          </div>

          {/* Grid: Identifiers & Direct Relationships */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Linked Identifiers */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-mono text-cyan-400 uppercase font-bold border-b border-slate-800 pb-2">
                VERIFIED IDENTIFIERS & HARDWARE
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] font-mono block">PHONE NUMBERS / IMSI:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {data.phones?.length > 0 ? (
                      data.phones.map(ph => (
                        <span key={ph} className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded font-mono">
                          📞 {ph}
                        </span>
                      ))
                    ) : <span className="text-slate-500">None registered</span>}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-mono block">TRANSIT / VEHICLES:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {data.vehicles?.length > 0 ? (
                      data.vehicles.map(v => (
                        <span key={v} className="bg-amber-950/70 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded font-mono">
                          🚗 {v}
                        </span>
                      ))
                    ) : <span className="text-slate-500">None registered</span>}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-mono block">ASSOCIATED ORGANIZATIONS:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {data.organizations?.length > 0 ? (
                      data.organizations.map(og => (
                        <span key={og} className="bg-purple-950/70 border border-purple-500/40 text-purple-300 px-2.5 py-1 rounded font-mono">
                          🏢 {og}
                        </span>
                      ))
                    ) : <span className="text-slate-500">None registered</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Cases */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-mono text-cyan-400 uppercase font-bold border-b border-slate-800 pb-2">
                LINKED CRIMINAL CASE RECORDS ({data.cases?.length || 0})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {data.cases?.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (onSelectCase) onSelectCase(c.id);
                      setTab('erp-cases');
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-cyan-400">{c.id}</div>
                      <div className="text-[11px] text-slate-300">{c.title}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chronological Incident Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono text-cyan-400 uppercase font-bold border-b border-slate-800 pb-2">
              RECORDED INCIDENT & SIGHTING TIMELINE ({data.events?.length || 0})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.events?.map((ev, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-white">{ev.event_type}</span>
                      <span className="text-[10px] font-mono text-slate-400">Case: {ev.case_id}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        ev.ai_signal === 'Fact' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-purple-950 text-purple-400 border border-purple-800'
                      }`}>
                        {ev.ai_signal}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Source: {ev.source_type} • Evidence: {ev.evidence_ref}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 font-mono shrink-0">
                    {ev.event_datetime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
