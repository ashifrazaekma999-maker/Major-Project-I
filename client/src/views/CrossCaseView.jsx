import React, { useState, useEffect } from 'react';

export default function CrossCaseView({ defaultCase1 = 'C00228', defaultCase2 = 'C00553', onSelectCase }) {
  const [case1, setCase1] = useState(defaultCase1);
  const [case2, setCase2] = useState(defaultCase2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleCompare();
  }, []);

  const handleCompare = async () => {
    if (!case1.trim() || !case2.trim()) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ case1: case1.trim(), case2: case2.trim() });
      const res = await fetch(`/api/intelligence/cross-case?${q}`);
      const data = await res.json();
      if (data.success) setResult(data.analysis);
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
          <span>CROSS-JURISDICTION COMPARATIVE ANALYSIS</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          CROSS-CASE OVERLAP & CONVERGENCE MATRIX
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Automates the detection of shared suspect syndicates, burner phones, getaway vehicles, and front organizations across independent jurisdictional cases.
        </p>
      </div>

      {/* Case Selectors */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">CASE DOSSIER A</label>
            <input
              type="text"
              value={case1}
              onChange={(e) => setCase1(e.target.value.toUpperCase())}
              placeholder="e.g. C00228"
              className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-sm px-3.5 py-2.5 rounded-lg outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">CASE DOSSIER B</label>
            <input
              type="text"
              value={case2}
              onChange={(e) => setCase2(e.target.value.toUpperCase())}
              placeholder="e.g. C00553"
              className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-sm px-3.5 py-2.5 rounded-lg outline-none"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-500">SAMPLE PAIRS:</span>
            <button
              onClick={() => { setCase1('C00228'); setCase2('C00553'); }}
              className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded border border-slate-700"
            >
              C00228 vs C00553
            </button>
            <button
              onClick={() => { setCase1('C00488'); setCase2('C00950'); }}
              className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded border border-slate-700"
            >
              C00488 vs C00950
            </button>
          </div>

          <button
            onClick={handleCompare}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
          >
            {loading ? 'COMPARING OPERATIONAL VECTORS...' : 'ANALYZE CONVERGENCE ⚡'}
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Score Bar */}
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">JURISDICTIONAL CONVERGENCE INDEX</div>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-3xl font-black text-cyan-400 font-mono">
                  {result.correlationScore}%
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  {result.correlationScore > 50 ? 'HIGH OPERATIONAL SYNERGY' : 'DISTRIBUTED ASSOCIATION'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 max-w-xl">{result.summary}</p>
            </div>

            <div className="flex items-center space-x-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-center font-mono">
                <div className="text-[10px] text-slate-500">CASE A</div>
                <div className="text-sm font-bold text-white">{result.case1?.id}</div>
                <div className="text-[10px] text-cyan-400">{result.case1?.dept}</div>
              </div>
              <span className="text-slate-600 font-mono text-lg">⟷</span>
              <div className="text-center font-mono">
                <div className="text-[10px] text-slate-500">CASE B</div>
                <div className="text-sm font-bold text-white">{result.case2?.id}</div>
                <div className="text-[10px] text-cyan-400">{result.case2?.dept}</div>
              </div>
            </div>
          </div>

          {/* Overlap Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Persons */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">SHARED PERSONS</span>
                <span className="text-sm font-mono font-bold text-cyan-400">{result.overlap?.persons?.length || 0}</span>
              </div>
              <div className="space-y-1">
                {result.overlap?.persons?.map(p => (
                  <div key={p.id} className="text-xs bg-slate-950 p-1.5 rounded border border-slate-800 text-slate-300 font-mono">
                    👤 {p.label || p.id}
                  </div>
                ))}
              </div>
            </div>

            {/* Phones */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">SHARED PHONES</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{result.overlap?.phones?.length || 0}</span>
              </div>
              <div className="space-y-1">
                {result.overlap?.phones?.map(ph => (
                  <div key={ph} className="text-xs bg-slate-950 p-1.5 rounded border border-slate-800 text-emerald-300 font-mono">
                    📞 {ph}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicles */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">SHARED VEHICLES</span>
                <span className="text-sm font-mono font-bold text-amber-400">{result.overlap?.vehicles?.length || 0}</span>
              </div>
              <div className="space-y-1">
                {result.overlap?.vehicles?.map(v => (
                  <div key={v} className="text-xs bg-slate-950 p-1.5 rounded border border-slate-800 text-amber-300 font-mono">
                    🚗 {v}
                  </div>
                ))}
              </div>
            </div>

            {/* Organizations */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-slate-400">SHARED ORGS</span>
                <span className="text-sm font-mono font-bold text-purple-400">{result.overlap?.organizations?.length || 0}</span>
              </div>
              <div className="space-y-1">
                {result.overlap?.organizations?.map(og => (
                  <div key={og} className="text-xs bg-slate-950 p-1.5 rounded border border-slate-800 text-purple-300 font-mono">
                    🏢 {og}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
