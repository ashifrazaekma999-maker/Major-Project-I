import React, { useState, useEffect } from 'react';

export default function CasesView({ onSelectCase, onSelectEntity, setTab, selectedCaseId }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Active case dossier details modal
  const [activeCaseDossier, setActiveCaseDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchCases();
  }, [search, statusFilter, departmentFilter, page]);

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseDossier(selectedCaseId);
    }
  }, [selectedCaseId]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        status: statusFilter,
        department: departmentFilter,
        page,
        limit: 15
      });
      const res = await fetch(`/api/erp/cases?${q}`);
      const data = await res.json();
      if (data.success) {
        setCases(data.cases);
        setTotal(data.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDossier = async (caseId) => {
    setDossierLoading(true);
    try {
      const res = await fetch(`/api/erp/cases/${caseId}`);
      const data = await res.json();
      if (data.success) {
        setActiveCaseDossier(data.caseData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDossierLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeCaseDossier) return;
    try {
      const res = await fetch(`/api/erp/cases/${activeCaseDossier.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          officer: { id: 'OFFICER-001', name: 'Inspector Vikram Rathore', department: 'D001' }
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveCaseDossier(prev => ({ ...prev, status: newStatus }));
        fetchCases();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !activeCaseDossier) return;

    try {
      const res = await fetch(`/api/erp/cases/${activeCaseDossier.id}/workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOTE',
          payload: { content: newNote },
          officer: { id: 'OFFICER-001', name: 'Inspector Vikram Rathore' }
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveCaseDossier(prev => ({
          ...prev,
          workspace: data.workspace
        }));
        setNewNote('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
            <span>ERP CONTROL PLANE</span>
            <span>•</span>
            <span>CASE LIFECYCLE MANAGEMENT</span>
          </div>
          <h1 className="text-xl font-black text-white font-mono tracking-wide">
            CRIMINAL INVESTIGATION CASE DIRECTORY
          </h1>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400">Total Cases: <strong className="text-cyan-400">{total}</strong></span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search Case ID (e.g. C00228), department..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="PENDING">Pending</option>
            <option value="SOLVED">Solved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none font-mono"
          >
            <option value="ALL">All Departments</option>
            <option value="D001">D001 - Cyber Crime Cell</option>
            <option value="D002">D002 - Financial Intelligence</option>
            <option value="D003">D003 - Narcotics Control</option>
            <option value="D005">D005 - State Intelligence</option>
            <option value="D010">D010 - Special Task Force</option>
            <option value="D011">D011 - Transit Patrol</option>
            <option value="D012">D012 - Anti-Corruption</option>
            <option value="D019">D019 - Internal Security</option>
            <option value="D020">D020 - Rapid Action Bureau</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#0b1329] text-slate-400 font-mono text-[11px] border-b border-slate-800 uppercase">
              <tr>
                <th className="px-5 py-3.5">Case ID</th>
                <th className="px-5 py-3.5">Title & Jurisdiction</th>
                <th className="px-5 py-3.5">Lifecycle Status</th>
                <th className="px-5 py-3.5">Suspects</th>
                <th className="px-5 py-3.5">Evidence Items</th>
                <th className="px-5 py-3.5">Risk Level</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-mono">
                    Loading cases from secure index...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-mono">
                    No cases matching search criteria.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-cyan-400">
                      {c.id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-200">{c.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.department_name} ({c.department_id})</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                        c.status === 'Solved' ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' :
                        c.status === 'Under_Investigation' ? 'bg-purple-950/70 border-purple-500/40 text-purple-300' :
                        'bg-amber-950/70 border-amber-500/40 text-amber-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {c.persons_count} suspects
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {c.evidence_count} items
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className={`font-semibold ${c.max_anomaly > 0.8 ? 'text-red-400' : c.max_anomaly > 0.5 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {(c.max_anomaly * 100).toFixed(0)}% Risk
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => loadCaseDossier(c.id)}
                        className="px-2.5 py-1 bg-cyan-950 border border-cyan-500/40 hover:bg-cyan-900/60 text-cyan-300 rounded font-mono text-[11px] transition"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Page {page} of {Math.ceil(total / 15) || 1}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 15)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Case Dossier Modal */}
      {activeCaseDossier && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📁</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white font-mono">{activeCaseDossier.id}</h2>
                    <span className="text-xs text-cyan-400 font-mono">• {activeCaseDossier.department_name}</span>
                  </div>
                  <p className="text-xs text-slate-400">{activeCaseDossier.title}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCaseDossier(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Transition & Fast Action Bar */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-mono block mb-1">LIFECYCLE STAGE:</span>
                  <select
                    value={activeCaseDossier.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="bg-slate-950 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold rounded-lg px-3 py-1.5 outline-none"
                  >
                    <option value="REGISTERED">REGISTERED</option>
                    <option value="OPEN">OPEN</option>
                    <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                    <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                    <option value="SOLVED">SOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (onSelectCase) onSelectCase(activeCaseDossier.id);
                      setTab('intel-network');
                    }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-xs font-bold transition flex items-center space-x-2"
                  >
                    <span>🕸️</span>
                    <span>Explore Graph</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onSelectCase) onSelectCase(activeCaseDossier.id);
                      setTab('intel-ai');
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition flex items-center space-x-2"
                  >
                    <span>🤖</span>
                    <span>AI Copilot</span>
                  </button>
                </div>
              </div>

              {/* Linked Suspects */}
              <div>
                <h3 className="text-xs font-mono text-cyan-400 uppercase font-bold mb-3 flex items-center justify-between">
                  <span>LINKED PERSONS & SUSPECTS ({activeCaseDossier.persons?.length || 0})</span>
                  <span className="text-[10px] text-slate-500">CLICK TO VIEW 360° PROFILE</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeCaseDossier.persons?.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (onSelectEntity) onSelectEntity(p.id);
                        setTab('intel-360');
                      }}
                      className="bg-slate-950/70 border border-slate-800 hover:border-cyan-500 p-3 rounded-lg cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{p.id}</span>
                        <span className="text-[10px] font-mono text-amber-400">{p.role}</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1">{p.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-2">
                        Phones: {p.phones?.join(', ') || 'None'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investigation Workspace Notes */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-mono text-cyan-400 uppercase font-bold">
                  CASE INVESTIGATION NOTES ({activeCaseDossier.workspace?.notes?.length || 0})
                </h3>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add secure forensic observation / note..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-bold rounded-lg border border-slate-700 transition"
                  >
                    Post Note
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeCaseDossier.workspace?.notes?.length > 0 ? (
                    activeCaseDossier.workspace.notes.map((note) => (
                      <div key={note.id} className="bg-slate-950 p-2.5 rounded border border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>{note.officer}</span>
                          <span>{new Date(note.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No notes posted yet for this case workspace.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
