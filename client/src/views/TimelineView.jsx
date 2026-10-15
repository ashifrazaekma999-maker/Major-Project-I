import React, { useState, useEffect } from 'react';

export default function TimelineView({ defaultCaseId = '', defaultPersonId = '' }) {
  const [caseId, setCaseId] = useState(defaultCaseId);
  const [personId, setPersonId] = useState(defaultPersonId);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [caseId, personId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ caseId, personId, limit: 40 });
      const res = await fetch(`/api/intelligence/timeline?${q}`);
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
          <span>INTELLIGENCE INVESTIGATION</span>
          <span>•</span>
          <span>TEMPORAL INCIDENT STREAM</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          CHRONOLOGICAL INVESTIGATION TIMELINE
        </h1>
      </div>

      {/* Filter bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">FILTER BY CASE:</span>
          <input
            type="text"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value.toUpperCase())}
            placeholder="e.g. C00228 (or blank for all)"
            className="bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded-lg outline-none"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">FILTER BY PERSON:</span>
          <input
            type="text"
            value={personId}
            onChange={(e) => setPersonId(e.target.value.toUpperCase())}
            placeholder="e.g. P0732"
            className="bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded-lg outline-none"
          />
        </div>
        <button
          onClick={() => { setCaseId(''); setPersonId(''); }}
          className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
        >
          Clear Filters
        </button>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l-2 border-cyan-500/30 ml-4 pl-6 space-y-6">
        {loading ? (
          <div className="text-xs font-mono text-cyan-400">Loading temporal incident logs...</div>
        ) : events.length === 0 ? (
          <div className="text-xs font-mono text-slate-500">No events found for this filter.</div>
        ) : (
          events.map((ev, idx) => (
            <div key={idx} className="relative group">
              {/* Bullet node */}
              <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-cyan-400 group-hover:scale-125 transition"></div>

              <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl space-y-2 transition shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white">{ev.event_type}</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-cyan-400 px-2 py-0.5 rounded">
                      Case #{ev.case_id}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      ev.ai_signal === 'Fact' ? 'bg-cyan-950 border-cyan-700 text-cyan-300' : 'bg-purple-950 border-purple-700 text-purple-300'
                    }`}>
                      {ev.ai_signal}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-semibold">
                    ⏱️ {ev.datetime}
                  </span>
                </div>

                <div className="text-xs text-slate-300">
                  <strong className="text-cyan-400 font-mono">{ev.person_label || ev.person_id}</strong> engaged via{' '}
                  <span className="text-amber-300 font-mono">{ev.relationship_type}</span>.
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
                  <span>Source: {ev.source_type}</span>
                  <span>Evidence Tag: {ev.evidence_ref}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
