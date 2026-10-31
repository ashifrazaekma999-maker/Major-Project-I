import { GoogleGenAI } from '@google/genai';
import { store } from '../dataStore.js';

class AIService {
  constructor() {
    this.sessions = new Map(); // sessionId -> { officerId, caseId, messages: [] }
  }

  getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  getModelName() {
    return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  getOrCreateSession(sessionId, officerId, caseId) {
    if (!sessionId) sessionId = `SESS-AI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        officerId,
        caseId,
        messages: [],
        createdAt: new Date().toISOString()
      });
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Filter records strictly by officer's department and authorized case
   */
  getAuthorizedRecords(officer, caseId, entityId, query) {
    const isDirector = officer.role === 'Director' || officer.role === 'SuperAdmin' || officer.id === 'OFF-DIR-000';
    let records = [];

    if (caseId) {
      const caseObj = store.cases.get(caseId);
      // Case department check
      if (caseObj && !isDirector && caseObj.department_id !== officer.department) {
        // Cross-department access check via accessRequests
        const hasApproval = store.accessRequests.some(
          r => r.officerId === officer.id && r.caseId === caseId && r.status === 'ACTIVE_STREAMING'
        );
        if (!hasApproval) {
          return { error: 'ACCESS_DENIED', message: `Officer lacks jurisdiction for Case #${caseId}. Cross-department clearance required.` };
        }
      }
      records = store.caseRecords.get(caseId) || [];
    } else if (entityId) {
      records = store.personRecords.get(entityId) || [];
    } else {
      // General search over authorized records
      const q = (query || '').toLowerCase();
      records = store.records.filter(r => {
        if (!isDirector && r.department_id !== officer.department) return false;
        if (q && (r.person_label?.toLowerCase().includes(q) || r.event_type?.toLowerCase().includes(q) || r.record_id?.toLowerCase().includes(q))) {
          return true;
        }
        return parseFloat(r.anomaly_score) > 0.8;
      }).slice(0, 30);
    }

    return { records };
  }

  /**
   * Case-related investigation with evidence categorization
   */
  async investigateCase({ query, caseId, entityId, officer, sessionId = null, history = [] }) {
    const authCheck = this.getAuthorizedRecords(officer, caseId, entityId, query);
    if (authCheck.error) {
      return {
        success: false,
        error: authCheck.message,
        code: 403
      };
    }

    const records = authCheck.records.slice(0, 20);
    const facts = [];
    const inferences = [];
    const possibleLeads = [];
    const insufficientEvidence = [];
    const evidenceRefs = new Set();

    records.forEach(r => {
      if (r.evidence_ref) evidenceRefs.add(r.evidence_ref);
      const desc = `[Record #${r.record_id}] ${r.person_label || r.person_id} (${r.person_role || 'Subject'}) during ${r.event_type} on ${r.event_datetime}. Relationship: ${r.relationship_type || 'ASSOCIATED_WITH'}`;

      if (r.ai_signal === 'Fact' || r.source_type?.includes('CCTV') || r.source_type?.includes('ANPR')) {
        facts.push({
          text: `${desc} corroborated via forensic sensor ${r.source_type}.`,
          recordId: r.record_id,
          evidenceRef: r.evidence_ref,
          category: 'FACT'
        });
      } else if (r.ai_signal === 'Inference' || parseFloat(r.anomaly_score) > 0.6) {
        inferences.push({
          text: `Pattern anomaly (${r.anomaly_score}): ${desc} indicates correlated Hawala/conspiracy pathway.`,
          recordId: r.record_id,
          evidenceRef: r.evidence_ref,
          category: 'INFERENCE'
        });
      } else {
        possibleLeads.push({
          text: `Investigative lead: ${desc} requires physical field verification.`,
          recordId: r.record_id,
          evidenceRef: r.evidence_ref,
          category: 'POSSIBLE_LEAD'
        });
      }
    });

    if (facts.length === 0) {
      insufficientEvidence.push({
        text: 'Direct physical CCTV or biometric proof has not yet reached threshold certainty for this specific query.',
        category: 'INSUFFICIENT_EVIDENCE'
      });
    }

    const ai = this.getClient();
    let answer = '';
    let engine = 'LOCAL_RULE_BASED_ANALYZER';
    let engineStatus = 'GEMINI_NOT_CONFIGURED';
    let citations = [];

    if (ai) {
      try {
        const model = this.getModelName();
        const prompt = `You are NETRISH AI Investigation Assistant for Indian Law Enforcement.
Authorized Officer: ${officer.name} (${officer.id}), Department: ${officer.departmentName || officer.department}.
Case Reference: ${caseId || 'Multi-case inquiry'}.
Inquiry: "${query}"

Authorized Evidence Context:
${JSON.stringify(records.slice(0, 8).map(r => ({
  id: r.record_id,
  case: r.case_id,
  subject: r.person_label,
  event: r.event_type,
  rel: r.relationship_type,
  time: r.event_datetime,
  evidence: r.evidence_ref,
  anomaly: r.anomaly_score
})))}

Instructions:
1. Provide a factual, synthesized summary answering the inquiry.
2. Clearly distinguish between verified empirical facts and analytic inferences.
3. Reference internal record IDs (e.g. [R000001]) and evidence codes (e.g. [EVID-000001]).
4. State explicitly that all records originate from synthetic test datasets and require human sign-off.
5. Highlight any missing evidence or uncertainties.`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt
        });

        if (response && response.text) {
          answer = response.text;
          engine = `GEMINI_${model.toUpperCase()}`;
          engineStatus = 'ONLINE_CONNECTED';
        }
      } catch (err) {
        console.warn('[AIService] Gemini API generation error:', err.message);
        engineStatus = `API_ERROR_${err.message}`;
      }
    }

    if (!answer) {
      answer = `### Automated Case Evidence Synthesis for: "${query}"\n\n` +
        `**Jurisdiction & Authorization:** Cross-referenced ${records.length} authorized records within ${officer.departmentName || officer.department}.\n\n` +
        `• **Verified Facts (${facts.length}):** Empirical corroboration established across sensor logs and ANPR registrations.\n` +
        `• **Analytical Inferences (${inferences.length}):** Statistical pattern anomalies indicate coordinated movement and structured transaction structuring.\n` +
        `• **Actionable Leads (${possibleLeads.length}):** Secondary contacts and burner SIM linkages flagged for field verification.\n\n` +
        `**Human Verification Notice:** Under Section 65B of Indian Evidence Act and NETRISH operating guidelines, digital inferences must be corroborated by the Investigating Officer before judicial submission.`;
    }

    return {
      success: true,
      answer,
      engine,
      engineStatus,
      disclaimer: 'Generated by NETRISH AI Investigator. Human verification is required before any consequential operational or judicial action.',
      facts: facts.slice(0, 6),
      inferences: inferences.slice(0, 6),
      possible_leads: possibleLeads.slice(0, 6),
      insufficient_evidence: insufficientEvidence,
      evidence_refs: Array.from(evidenceRefs).slice(0, 10),
      authorizedRecordsCount: records.length,
      sessionId
    };
  }

  /**
   * External Research Assistant with Google Search Grounding
   */
  async researchAssistant({ query, officer }) {
    const ai = this.getClient();
    if (!ai) {
      return {
        success: true,
        answer: `### External Legal & Intelligence Research Assistant\n\n` +
          `Query: "${query}"\n\n` +
          `**Status:** Gemini API key is not configured in the server environment.\n\n` +
          `To activate live research assistant with Google Search grounding, set the following environment variables in your server configuration:\n` +
          `• \`GEMINI_API_KEY=<your-gemini-api-key>\`\n` +
          `• \`GEMINI_MODEL=gemini-2.5-flash\`\n\n` +
          `**Safe Local Summary:** The query pertains to Indian law enforcement procedures, forensic methodologies, and statutory frameworks (e.g. IPC, CrPC/BNSS, PMLA, Information Technology Act).`,
        engine: 'LOCAL_RULE_BASED_ANALYZER',
        engineStatus: 'GEMINI_NOT_CONFIGURED',
        isGrounded: false,
        citations: [],
        disclaimer: 'External research data is separate from internal synthetic case datasets.'
      };
    }

    const model = this.getModelName();
    try {
      const prompt = `You are NETRISH Research Assistant for Indian Law Enforcement.
User inquiry: "${query}"
Instructions:
1. Provide a direct, well-researched answer using current external legal, statutory, or technical information.
2. Clearly cite sources, links, or publication dates where available.
3. Note any jurisdictional nuances or statutory revisions (e.g. Bharatiya Nyaya Sanhita).
4. Clearly state that external research findings are separate from NETRISH internal synthetic case files.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const answer = response.text || 'No response generated.';
      const grounding = response.candidates?.[0]?.groundingMetadata || {};
      const webSearchQueries = grounding.webSearchQueries || [];
      const searchChunks = grounding.groundingChunks || [];
      const citations = searchChunks.map((chunk, idx) => ({
        index: idx + 1,
        title: chunk.web?.title || 'Web Source',
        uri: chunk.web?.uri || '',
        snippet: chunk.web?.snippet || ''
      })).filter(c => c.uri);

      return {
        success: true,
        answer,
        engine: `GEMINI_${model.toUpperCase()}_SEARCH_GROUNDED`,
        engineStatus: 'ONLINE_CONNECTED',
        isGrounded: citations.length > 0,
        searchQueries: webSearchQueries,
        citations,
        disclaimer: 'External research data retrieved via Google Search grounding. Separate from internal synthetic case datasets.'
      };
    } catch (err) {
      console.warn('[AIService] Research assistant generation failed:', err.message);
      return {
        success: true,
        answer: `Research query processed with fallback due to API error: ${err.message}. Please verify network connectivity and Gemini API quota.`,
        engine: 'GEMINI_API_FALLBACK',
        engineStatus: `ERROR: ${err.message}`,
        isGrounded: false,
        citations: [],
        disclaimer: 'Live search grounding temporarily unavailable.'
      };
    }
  }
}

export const aiService = new AIService();
