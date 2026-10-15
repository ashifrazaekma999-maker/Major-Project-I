import React, { useState } from 'react';

export default function BiometricSearchView({ onSelectEntity, setTab }) {
  const [modality, setModality] = useState('FACE'); // 'FACE' or 'FINGERPRINT'
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [qualityScore, setQualityScore] = useState(94.2);

  const handleSimulateScan = async () => {
    setScanning(true);
    setResult(null);

    setTimeout(async () => {
      try {
        const res = await fetch('/api/intelligence/biometrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modality,
            probeType: 'DIGITAL_SENSOR_SCAN',
            queryId: ''
          })
        });
        const data = await res.json();
        setResult(data);
      } catch (e) {
        console.error(e);
      } finally {
        setScanning(false);
      }
    }, 1200);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
          <span>INTELLIGENCE INVESTIGATION</span>
          <span>•</span>
          <span>BIOMETRIC RECOGNITION INTERFACE</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          FORENSIC BIOMETRIC CANDIDATE MATCHER
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          National Automated Fingerprint Identification System (NAFIS) and Authorized Facial Probe matcher. Adheres strictly to legal human forensic oversight before judicial submission. Aadhaar/UIDAI excluded by policy scope.
        </p>
      </div>

      {/* Main Scanner Box & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          {/* Modality toggle */}
          <div className="flex border-b border-slate-800 pb-4 gap-4">
            <button
              onClick={() => { setModality('FACE'); setResult(null); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition ${
                modality === 'FACE' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>👤</span>
              <span>FACIAL RECOGNITION PROBE</span>
            </button>
            <button
              onClick={() => { setModality('FINGERPRINT'); setResult(null); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition ${
                modality === 'FINGERPRINT' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🧬</span>
              <span>NAFIS FINGERPRINT SCANNER</span>
            </button>
          </div>

          {/* Scanner Optical Grid Simulation */}
          <div className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-10 flex flex-col items-center justify-center space-y-4 relative overflow-hidden h-72">
            {scanning && (
              <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 space-y-2">
                <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="font-mono text-xs text-cyan-300 font-bold animate-pulse">
                  COMPUTING 512-D FEATURE VECTOR EMBEDDING...
                </div>
              </div>
            )}

            <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center text-4xl shadow-inner shadow-cyan-500/20">
              {modality === 'FACE' ? '👤' : '🧬'}
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-mono text-xs font-bold text-slate-200">
                DRAG & DROP {modality} EVIDENCE SAMPLE OR SELECT PROBE
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Supports ISO/IEC 19794 Forensic Template Standards
              </p>
            </div>

            <button
              onClick={handleSimulateScan}
              disabled={scanning}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg shadow-cyan-600/30 transition"
            >
              START BIOMETRIC SEARCH ⚡
            </button>
          </div>

          {/* Quality check bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">VECTOR QUALITY SCORE: </span>
              <strong className="text-emerald-400">{qualityScore}% (ACCEPTABLE NIST NFIQ-2)</strong>
            </div>
            <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${qualityScore}%` }}></div>
            </div>
          </div>
        </div>

        {/* Results Candidate Roster (1 Col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              MATCH CANDIDATES
            </h3>
            {result && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
                {result.status}
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-3">
              {result.candidates?.map((cand, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{cand.person_id}</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {(cand.confidence * 100).toFixed(1)}% Match
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-semibold">{cand.label}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Role: {cand.role} • Linked Cases: {cand.linkedCases}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono bg-slate-900 p-2 rounded border border-slate-800">
                    ⚠️ {cand.auditNote || 'Human verification required.'}
                  </div>
                  <button
                    onClick={() => {
                      onSelectEntity(cand.person_id);
                      setTab('intel-360');
                    }}
                    className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs rounded transition"
                  >
                    Open Entity 360° Dossier →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-xs text-center p-8">
              No scan active. Initiate biometric probe to cross-reference authorized database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
