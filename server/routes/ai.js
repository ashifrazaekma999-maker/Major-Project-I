import express from 'express';
import { store } from '../dataStore.js';
import { authenticateOfficer } from './auth.js';
import { aiService } from '../services/aiService.js';

const router = express.Router();

/**
 * GET /api/ai/status
 * Check if live Gemini API is configured
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    configured: aiService.isConfigured(),
    model: aiService.getModelName(),
    provider: 'Google Gen AI SDK (@google/genai)',
    statusText: aiService.isConfigured() ? 'Online & Configured' : 'Gemini Not Configured (Local Fallback Active)'
  });
});

/**
 * POST /api/ai/investigate
 * Executes AI investigation over authorized records with truthful attribution
 */
router.post('/investigate', async (req, res) => {
  const officer = authenticateOfficer(req);
  if (!officer) {
    return res.status(401).json({
      success: false,
      message: 'HTTP 401 Unauthorized: Valid officer authentication token required.'
    });
  }

  const { query = '', caseId, entityId, sessionId } = req.body;

  if (!query.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide an investigation inquiry.' });
  }

  try {
    const result = await aiService.investigateCase({
      query,
      caseId,
      entityId,
      officer,
      sessionId
    });

    if (result.code === 403) {
      return res.status(403).json(result);
    }

    store.logAudit('AI_QUERY_EXECUTED', officer, {
      query,
      caseId,
      entityId,
      engine: result.engine,
      engineStatus: result.engineStatus
    });

    res.json(result);
  } catch (err) {
    console.error('[AIRouter] Investigation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ai/research
 * External research assistant with Google Search grounding
 */
router.post('/research', async (req, res) => {
  const officer = authenticateOfficer(req);
  if (!officer) {
    return res.status(401).json({
      success: false,
      message: 'HTTP 401 Unauthorized: Valid officer authentication token required.'
    });
  }

  const { query = '' } = req.body;
  if (!query.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide a research query.' });
  }

  try {
    const result = await aiService.researchAssistant({ query, officer });

    store.logAudit('AI_RESEARCH_EXECUTED', officer, {
      query,
      engine: result.engine,
      isGrounded: result.isGrounded,
      citationsCount: result.citations?.length || 0
    });

    res.json(result);
  } catch (err) {
    console.error('[AIRouter] Research error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ai/chat
 * Multi-turn investigation assistant with case grounding
 */
router.post('/chat', async (req, res) => {
  const officer = authenticateOfficer(req);
  if (!officer) {
    return res.status(401).json({
      success: false,
      message: 'HTTP 401 Unauthorized: Valid officer authentication token required.'
    });
  }

  const { message = '', caseId = 'C00228', isResearch = false, sessionId } = req.body;
  if (!message.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide a message.' });
  }

  if (isResearch) {
    const researchResult = await aiService.researchAssistant({ query: message, officer });
    return res.json({
      success: true,
      reply: researchResult.answer,
      caseId: null,
      engine: researchResult.engine,
      engineStatus: researchResult.engineStatus,
      citations: researchResult.citations,
      isGrounded: researchResult.isGrounded,
      disclaimer: researchResult.disclaimer,
      timestamp: new Date().toISOString()
    });
  }

  // Check department access
  const caseObj = store.cases.get(caseId);
  const isDirector = officer.role === 'Director' || officer.role === 'SuperAdmin' || officer.id === 'OFF-DIR-000';
  if (caseObj && !isDirector && caseObj.department_id !== officer.department) {
    const hasApproval = store.accessRequests.some(
      r => r.officerId === officer.id && r.caseId === caseId && r.status === 'ACTIVE_STREAMING'
    );
    if (!hasApproval) {
      return res.status(403).json({
        success: false,
        message: `HTTP 403 Forbidden: Officer lacks jurisdiction for Case #${caseId}. Cross-department clearance required.`
      });
    }
  }

  const investigation = await aiService.investigateCase({
    query: message,
    caseId,
    officer,
    sessionId
  });

  res.json({
    success: true,
    reply: investigation.answer,
    caseId,
    engine: investigation.engine,
    engineStatus: investigation.engineStatus,
    facts: investigation.facts,
    inferences: investigation.inferences,
    possible_leads: investigation.possible_leads,
    disclaimer: investigation.disclaimer,
    timestamp: new Date().toISOString()
  });
});

export default router;
