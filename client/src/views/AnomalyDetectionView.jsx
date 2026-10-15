import React, { useState, useEffect } from 'react';

export default function AnomalyDetectionView({ onSelectEntity, onSelectCase, setTab }) {
  const [minScore, setMinScore] = useState(0.75);
  const [anomalies, setAnomalies] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnomalies();
  }, [minScore]);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ minScore, limit: 30 });
      const res = await fetch(`/api/analytics/anomalies?${q}`);
      const data = await res.json();
      if (data.success) {
        setAnomalies(data.items);
        setDistribution(data.distribution);
        setTotal(data.totalAnomalies);
      }
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
        <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-semibold mb-1">
          <span>ANALYTICS & MACHINE LEARNING</span>
          <span>•</span>
          <span>BEHAVIORAL OUTLIER TRIAGE</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          ANOMALY DETECTION & PATTERN SURFACING
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Statistical deviation and frequency spike analysis across communication bursts, high-value financial transactions, and vehicle sightings. Labeling strictly reflects <em>"anomalous activity identified for review"</em>.
        </p>
      </div>

      {/* Control Bar & Distribution Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slider Controls (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            ANOMALY SENSITIVITY FILTER
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">THRESHOLD:</span>
              <span className="text-amber-400 font-bold">{minScore} ({Math.round(minScore * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.50 (Broader)</span>
              <span>0.95 (Critical Only)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
            <div className="text-slate-400 text-[10px]">FLAGGED PATTERNS FOR TRIAGE:</div>
            <div className="text-xl font-bold text-amber-400">{total} Incidents</div>
          </div>
        </div>

        {/* Histogram Distribution (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              CORPUS ANOMALY SCORE FREQUENCY SPECTRUM
            </h3>
            <span className="text-[10px] font-mono text-slate-500">2,000 Sample Vectors</span>
          </div>

          <div className="h-36 flex items-end gap-4 pt-4 border-b border-slate-800 pb-2">
            {distribution.map((bin, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono text-slate-400">{bin.count}</span>
                <div
                  className={`w-full rounded-t transition-all ${
                    idx >= 3 ? 'bg-amber-500/80 hover:bg-amber-400' : 'bg-cyan-600/60 hover:bg-cyan-500'
                  }`}
                  style={{ height: `${Math.max(10, Math.min(100, (bin.count / 700) * 100))}%` }}
                ></div>
                <span className="text-[9px] font-mono text-slate-500 truncate">{bin.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalies Triage Ledger */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-mono font-bold text-white uppercase">
            FLAGGED ANOMALOUS INCIDENTS REQUIRING FORENSIC REVIEW
          </h3>
          <span className="text-xs font-mono text-slate-400">Total: {total}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b1329] text-slate-400 text-[11px] border-b border-slate-800 uppercase">
              <tr>
                <th className="px-5 py-3">Score & Priority</th>
                <th className="px-5 py-3">Suspect / Person</th>
                <th className="px-5 py-3">Case ID</th>
                <th className="px-5 py-3">Identified Anomaly Vector</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Triage Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Scanning neural anomaly indices...
                  </td>
                </tr>
              ) : (
                anomalies.map((a) => (
                  <tr key={a.record_id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${a.anomaly_score > 0.85 ? 'text-red-400' : 'text-amber-400'}`}>
                          {(a.anomaly_score * 100).toFixed(1)}%
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border ${
                          a.risk_level === 'HIGH_PRIORITY' ? 'bg-red-950 border-red-800 text-red-300' : 'bg-amber-950 border-amber-800 text-amber-300'
                        }`}>
                          {a.risk_level}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-sans">
                      <div className="font-semibold text-slate-200">{a.person_label || a.person_id}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{a.person_id}</div>
                    </td>
                    <td className="px-5 py-3 text-cyan-300">
                      {a.case_id}
                    </td>
                    <td className="px-5 py-3 font-sans text-slate-300 max-w-sm truncate">
                      {a.reason}
                    </td>
                    <td className="px-5 py-3 text-[11px] text-slate-500">
                      {a.event_datetime}
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          onSelectEntity(a.person_id);
                          setTab('intel-360');
                        }}
                        className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-[10px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
