import React, { useState, useEffect } from 'react';

export default function IntelligenceSearchView({ onSelectEntity, onSelectCase, setTab }) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleSearch();
  }, [filterType]);

  const handleSearch = async (q = query) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ q, type: filterType, limit: 25 });
      const res = await fetch(`/api/intelligence/search?${p}`);
      const data = await res.json();
      if (data.success) setResults(data.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
          <span>INTELLIGENCE INVESTIGATION</span>
          <span>•</span>
          <span>GLOBAL MULTI-MODAL RECONNAISSANCE</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          NATIONAL ENTITY SEARCH ENGINE
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Instantly queries across 10,000+ indexed law enforcement vectors: Suspect Persons, Phone Numbers, Registered Vehicles, Syndicate Organizations, and Case Records.
        </p>
      </div>

      {/* Search Bar & Entity Pills */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-3 bg-slate-950 border border-slate-700 focus-within:border-cyan-400 rounded-xl px-4 py-3 transition">
          <span className="text-slate-400 text-lg">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); handleSearch(e.target.value); }}
            placeholder="Type Name, Suspect ID (P0732), Phone (PH00002), Vehicle (V0232), or Case..."
            className="w-full bg-transparent text-sm text-white font-mono outline-none placeholder:text-slate-500"
          />
          {query && (
            <button onClick={() => { setQuery(''); handleSearch(''); }} className="text-slate-500 hover:text-white text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {[
            { id: 'ALL', label: 'All Vectors (Unified)' },
            { id: 'Person', label: '👤 Persons / Suspects' },
            { id: 'Phone', label: '📞 Phone Numbers' },
            { id: 'Vehicle', label: '🚗 Vehicles' },
            { id: 'Organization', label: '🏢 Organizations' },
            { id: 'Case', label: '📁 Case Records' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg border transition ${
                filterType === f.id
                  ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>DISCOVERED RECORDS ({results.length})</span>
          <span>AUTONOMOUS INDEXED RETRIEVAL</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-cyan-400 font-mono text-xs">
            SCANNING NATIONAL REGISTRY...
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No matching entities found in current records.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => (
              <div
                key={r.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl space-y-3 transition shadow-lg group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                    {r.id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    {r.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{r.label}</h3>
                  {r.role && (
                    <div className="text-[11px] text-amber-400 font-mono mt-0.5">Role: {r.role}</div>
                  )}
                  {r.anomaly !== undefined && (
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Anomaly Score: <span className="text-red-400 font-bold">{(r.anomaly * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  {r.type === 'Person' ? (
                    <>
                      <button
                        onClick={() => { onSelectEntity(r.id); setTab('intel-360'); }}
                        className="flex-1 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-center transition"
                      >
                        360° Dossier
                      </button>
                      <button
                        onClick={() => { onSelectEntity(r.id); setTab('intel-network'); }}
                        className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center transition"
                      >
                        Graph
                      </button>
                    </>
                  ) : r.type === 'Case' ? (
                    <button
                      onClick={() => { if (onSelectCase) onSelectCase(r.id); setTab('erp-cases'); }}
                      className="w-full py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-center transition"
                    >
                      Open Case Dossier
                    </button>
                  ) : (
                    <button
                      onClick={() => { onSelectEntity(r.id); setTab('intel-network'); }}
                      className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center transition"
                    >
                      Trace in Network Graph
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
