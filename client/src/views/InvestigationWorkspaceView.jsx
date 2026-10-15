import React, { useState, useEffect } from 'react';

export default function InvestigationWorkspaceView({ currentCaseId = 'C00228', currentUser, onSelectEntity, setTab }) {
  const [caseId, setCaseId] = useState(currentCaseId);
  const [workspace, setWorkspace] = useState({ notes: [], pinnedEntities: [], leads: [] });
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newLeadTitle, setNewLeadTitle] = useState('');
  const [newLeadDetails, setNewLeadDetails] = useState('');

  useEffect(() => {
    fetchWorkspace(caseId);
  }, [caseId]);

  const fetchWorkspace = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/erp/cases/${id}`);
      const data = await res.json();
      if (data.success) {
        setWorkspace(data.caseData.workspace || { notes: [], pinnedEntities: [], leads: [] });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await fetch(`/api/erp/cases/${caseId}/workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOTE',
          payload: { content: newNote },
          officer: currentUser || { name: 'Inspector Vikram Rathore' }
        })
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace(data.workspace);
        setNewNote('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!newLeadTitle.trim()) return;

    try {
      const res = await fetch(`/api/erp/cases/${caseId}/workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LEAD',
          payload: {
            title: newLeadTitle,
            details: newLeadDetails,
            signal: 'Possible Lead'
          },
          officer: currentUser
        })
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace(data.workspace);
        setNewLeadTitle('');
        setNewLeadDetails('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
            <span>ERP OPERATIONS</span>
            <span>•</span>
            <span>CASE INVESTIGATION WORKSPACE</span>
          </div>
          <h1 className="text-xl font-black text-white font-mono tracking-wide">
            EVIDENCE PINBOARD & INVESTIGATION WORKBENCH
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-400">ACTIVE CASE:</span>
          <input
            type="text"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value.toUpperCase())}
            className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded-lg outline-none w-28"
          />
          <button
            onClick={() => fetchWorkspace(caseId)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs rounded-lg transition"
          >
            Load Case
          </button>
        </div>
      </div>

      {/* Grid: 3 Pillars (Pinned Entities, Actionable Leads, Case Notes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Pinned Suspects & Entities */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase">
              PINNED PERSONS & ENTITIES ({workspace.pinnedEntities?.length || 2})
            </h3>
            <span className="text-sm">📌</span>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => { onSelectEntity('P0732'); setTab('intel-360'); }}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500 cursor-pointer transition space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">P0732</span>
                <span className="text-[10px] font-mono text-red-400">89% Anomaly</span>
              </div>
              <div className="text-xs font-semibold text-slate-200">Person_0732</div>
              <div className="text-[10px] text-slate-400 font-mono">Role: Subject • 3 Cases Linked</div>
            </div>

            <div
              onClick={() => { onSelectEntity('P0765'); setTab('intel-360'); }}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500 cursor-pointer transition space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">P0765</span>
                <span className="text-[10px] font-mono text-amber-400">12% Anomaly</span>
              </div>
              <div className="text-xs font-semibold text-slate-200">Person_0765</div>
              <div className="text-[10px] text-slate-400 font-mono">Role: Subject • 2 Cases Linked</div>
            </div>
          </div>
        </div>

        {/* Column 2: Tactical Actionable Leads */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-amber-400 uppercase">
              SAVED LEADS & FORENSIC SIGNALS ({workspace.leads?.length || 1})
            </h3>
            <span className="text-sm">⚡</span>
          </div>

          <form onSubmit={handleAddLead} className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <input
              type="text"
              value={newLeadTitle}
              onChange={(e) => setNewLeadTitle(e.target.value)}
              placeholder="Lead Title (e.g. Hawala route link)..."
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white outline-none font-mono"
            />
            <input
              type="text"
              value={newLeadDetails}
              onChange={(e) => setNewLeadDetails(e.target.value)}
              placeholder="Lead corroboration details..."
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white outline-none"
            />
            <button
              type="submit"
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold rounded transition"
            >
              + Add Lead
            </button>
          </form>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {workspace.leads?.length > 0 ? (
              workspace.leads.map((l) => (
                <div key={l.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-300">{l.title}</span>
                    <span className="text-[9px] font-mono bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800">
                      {l.signal}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{l.details}</p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(l.timestamp).toLocaleTimeString()} • Ref: {l.evidence_ref || 'INTERNAL'}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-300">Transit Verification</span>
                  <span className="text-[9px] font-mono bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded">LEAD</span>
                </div>
                <p className="text-xs text-slate-300">ANPR Toll plaza camera recorded suspect vehicle V0232 at 15:20 IST.</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Officer Notes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-purple-400 uppercase">
              INVESTIGATOR LOG & NOTES ({workspace.notes?.length || 1})
            </h3>
            <span className="text-sm">📝</span>
          </div>

          <form onSubmit={handleAddNote} className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <textarea
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Record forensic observation..."
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white outline-none resize-none"
            />
            <button
              type="submit"
              className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded transition"
            >
              Post Note 📌
            </button>
          </form>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {workspace.notes?.length > 0 ? (
              workspace.notes.map((n) => (
                <div key={n.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{n.officer}</span>
                    <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300">{n.content}</p>
                </div>
              ))
            ) : (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Inspector Vikram Rathore</span>
                  <span>10:30 AM</span>
                </div>
                <p className="text-slate-300">Initial intelligence ingestion verified across 10,000 synthetic records.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
