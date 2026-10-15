import React, { useState } from 'react';

export default function WhyConnectedView({ defaultSource = 'P0732', defaultTarget = 'P0765', onSelectEntity }) {
  const [source, setSource] = useState(defaultSource);
  const [target, setTarget] = useState(defaultTarget);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrace = async (src = source, tgt = target) => {
    if (!src.trim() || !tgt.trim()) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ source: src.trim(), target: tgt.trim() });
      const res = await fetch(`/api/intelligence/why-connected?${q}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setSample = (s, t) => {
    setSource(s);
    setTarget(t);
    handleTrace(s, t);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
          <span>INTELLIGENCE INVESTIGATION</span>
          <span>•</span>
          <span>EXPLAINABLE GRAPH PATHFINDER</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          "WHY CONNECTED?" EVIDENCE PATH TRACER
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Discovers multi-hop relational pathways between two isolated persons or evidence vectors. Formulates explainable reasoning by strictly distinguishing between empirical FACT, analytical INFERENCE, and actionable LEAD.
        </p>
      </div>

      {/* Input Form & Quick Samples */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">SOURCE ENTITY ID (START)</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value.toUpperCase())}
              placeholder="e.g. P0732"
              className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-sm px-3.5 py-2.5 rounded-lg outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">TARGET ENTITY ID (DESTINATION)</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value.toUpperCase())}
              placeholder="e.g. P0765"
              className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-sm px-3.5 py-2.5 rounded-lg outline-none"
            />
          </div>
        </div>

        {/* Quick Demo Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-500">PROVENANCE DEMO PAIRS:</span>
            <button
              onClick={() => setSample('P0732', 'P0765')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700 transition"
            >
              P0732 ↔ P0765
            </button>
            <button
              onClick={() => setSample('P0732', 'PH00002')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded border border-slate-700 transition"
            >
              P0732 ↔ PH00002
            </button>
            <button
              onClick={() => setSample('P0274', 'P0671')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded border border-slate-700 transition"
            >
              P0274 ↔ P0671
            </button>
          </div>

          <button
            onClick={() => handleTrace()}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
          >
            {loading ? 'TRACING GRAPH PATHWAY...' : 'RESOLVE CONNECTION ⚡'}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {result.connected ? (
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-6 space-y-6">
              {/* Summary Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">CONNECTION ESTABLISHED</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Distance: <strong className="text-cyan-400">{result.hops} Hops</strong> • Shortest Path Traversal
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-3 py-1 rounded-full">
                    EVIDENTIARY AUDITED
                  </span>
                </div>
              </div>

              {/* Visual Chain Progression */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">
                  STEP-BY-STEP RELATIONAL CHAIN:
                </h4>

                <div className="space-y-3">
                  {result.steps?.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2 font-mono text-sm">
                            <span className="text-white font-bold">{step.from}</span>
                            <span className="text-cyan-400">──[{step.relationship}]──▶</span>
                            <span className="text-white font-bold">{step.to}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-1">
                            Case Context: <strong className="text-slate-300">{step.case_id}</strong> • Source: {step.source_type}
                          </div>
                        </div>
                      </div>

                      {/* Evidence & Signal Classification */}
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2.5 py-1 rounded border border-slate-800">
                          Ref: {step.evidence_ref}
                        </span>
                        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border ${
                          step.signal === 'Fact' ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300' :
                          step.signal === 'Inference' ? 'bg-purple-950/80 border-purple-500/50 text-purple-300' :
                          'bg-amber-950/80 border-amber-500/50 text-amber-300'
                        }`}>
                          {step.signal.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rationale Note */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-mono font-bold text-slate-300">LEGAL EVIDENCE NOTE:</div>
                <p>
                  As per criminal forensic guidelines, multi-hop linkages establish investigatory leads. Inferences derived from transaction and transit clusters require corroboration via warrant-authorized physical records prior to judicial filing.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-8 text-center space-y-3">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-sm font-bold text-white font-mono">NO CONNECTED PATHWAY DISCOVERED</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">{result.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
