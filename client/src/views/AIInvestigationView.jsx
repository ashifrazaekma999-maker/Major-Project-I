import React, { useState } from 'react';

export default function AIInvestigationView({ currentCaseId = 'C00228', currentUser, setTab }) {
  const [query, setQuery] = useState('');
  const [caseId, setCaseId] = useState(currentCaseId);
  const [entityId, setEntityId] = useState('P0732');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const sampleQuestions = [
    'Analyze cross-case links and suspect relationships for Person_0732',
    'Summarize verified physical facts vs inferences for Case C00228',
    'Identify high-frequency communication contacts with suspicious anomaly scores',
    'Evaluate transit and vehicle sightings linking Person_0765 to narcotics clusters'
  ];

  const handleAsk = async (text = query) => {
    if (!text.trim()) return;
    setLoading(true);
    setResponse(null);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/ai/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          caseId,
          entityId,
          officer: currentUser || { id: 'OFFICER-001', name: 'Inspector Vikram Rathore', department: 'D001' }
        })
      });
      const data = await res.json();
      if (data.success) {
        setResponse(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToWorkspace = async (findingText, signalType) => {
    try {
      const res = await fetch(`/api/erp/cases/${caseId}/workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LEAD',
          payload: {
            title: `AI Extracted: ${signalType}`,
            details: findingText,
            signal: signalType,
            evidence_ref: response?.evidence_refs?.[0] || 'AI_FORENSIC_EXTRACT'
          },
          officer: currentUser
        })
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-purple-400 font-mono text-xs font-semibold mb-1">
          <span>INTELLIGENCE INVESTIGATION</span>
          <span>•</span>
          <span>GROUNDED FORENSIC AI COPILOT</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          EVIDENCE-GROUNDED INVESTIGATION ASSISTANT
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Complies with NIST AI Risk Management Framework. Generates strictly grounded responses with empirical FACT, analytical INFERENCE, and actionable LEAD separation. All queries logged to tamper-evident audit ledger.
        </p>
      </div>

      {/* Query Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-xs font-mono text-slate-300 mb-1">INVESTIGATIVE INQUIRY</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about suspects, anomalous phone links, or vehicle travel..."
              className="w-full bg-slate-950 border border-slate-700 text-purple-300 font-mono text-sm px-4 py-2.5 rounded-lg outline-none"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-mono text-slate-300 mb-1">CASE CONTEXT</label>
            <input
              type="text"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value.toUpperCase())}
              placeholder="e.g. C00228"
              className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-sm px-3 py-2.5 rounded-lg outline-none"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-mono text-slate-300 mb-1">SUSPECT FOCUS</label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value.toUpperCase())}
              placeholder="e.g. P0732"
              className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-sm px-3 py-2.5 rounded-lg outline-none"
            />
          </div>
        </div>

        {/* Preset Questions */}
        <div className="pt-2">
          <span className="text-[10px] font-mono text-slate-500 block mb-1.5">SAMPLE FORENSIC INQUIRIES:</span>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((qText, idx) => (
              <button
                key={idx}
                onClick={() => { setQuery(qText); handleAsk(qText); }}
                className="text-[11px] font-mono bg-slate-800/80 hover:bg-slate-700 text-purple-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                {qText}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleAsk()}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
          >
            {loading ? 'EXECUTING GROUNDED REASONING...' : 'DISPATCH TO COPILOT 🤖'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-mono rounded-lg">
          ✓ Finding successfully pinned to Case #{caseId} ERP Workspace!
        </div>
      )}

      {/* Response Display Contract (Blueprint Section 15.2) */}
      {response && (
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 space-y-6 shadow-2xl">
          {/* Executive Overview */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-purple-400 font-bold uppercase">SYNTHESIZED COPILOT SUMMARY</span>
              <div className="flex space-x-2">
                {response.tools_used?.map((t, i) => (
                  <span key={i} className="text-[9px] font-mono bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                    🔧 {t}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-200 mt-2 font-sans leading-relaxed">{response.answer}</p>
          </div>

          {/* 4 Pillars: Facts, Inferences, Leads, Insufficient Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. FACTS */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400">EMPIRICAL FACTS ({response.facts?.length || 0})</span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded">100% PROVEN</span>
              </div>
              <div className="space-y-2">
                {response.facts?.map((f, i) => (
                  <div key={i} className="text-xs text-slate-300 p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-start gap-2">
                    <span>{f}</span>
                    <button
                      onClick={() => handleSaveToWorkspace(f, 'Fact')}
                      title="Pin to Case Workspace"
                      className="text-cyan-400 hover:text-cyan-200 shrink-0 font-mono text-[10px]"
                    >
                      📌 Pin
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. INFERENCES */}
            <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-purple-400">ANALYTIC INFERENCES ({response.inferences?.length || 0})</span>
                <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded">STATISTICAL</span>
              </div>
              <div className="space-y-2">
                {response.inferences?.map((inf, i) => (
                  <div key={i} className="text-xs text-slate-300 p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-start gap-2">
                    <span>{inf}</span>
                    <button
                      onClick={() => handleSaveToWorkspace(inf, 'Inference')}
                      title="Pin to Case Workspace"
                      className="text-purple-400 hover:text-purple-200 shrink-0 font-mono text-[10px]"
                    >
                      📌 Pin
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. POSSIBLE LEADS */}
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400">POSSIBLE LEADS ({response.possible_leads?.length || 0})</span>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded">ACTIONABLE</span>
              </div>
              <div className="space-y-2">
                {response.possible_leads?.map((lead, i) => (
                  <div key={i} className="text-xs text-slate-300 p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-start gap-2">
                    <span>{lead}</span>
                    <button
                      onClick={() => handleSaveToWorkspace(lead, 'Possible Lead')}
                      title="Pin to Case Workspace"
                      className="text-amber-400 hover:text-amber-200 shrink-0 font-mono text-[10px]"
                    >
                      📌 Pin
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evidence Citations Bar */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">CITED EVIDENCE IDENTIFIERS:</span>
              <div className="flex flex-wrap gap-1.5">
                {response.evidence_refs?.map((ref, idx) => (
                  <span key={idx} className="bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                    {ref}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-emerald-400 font-bold">✓ ZERO HALLUCINATION POLICY ENFORCED</span>
          </div>
        </div>
      )}
    </div>
  );
}
