import express from 'express';
import { store } from '../dataStore.js';

const router = express.Router();

router.get('/anomalies', (req, res) => {
  const { minScore = 0.7, limit = 50, page = 1 } = req.query;
  const threshold = parseFloat(minScore) || 0.7;

  const anomalies = store.records
    .filter(r => (parseFloat(r.anomaly_score) || 0) >= threshold)
    .map(r => {
      const score = parseFloat(r.anomaly_score) || 0;
      let reason = 'Unusual frequency deviation detected in operational logs';
      if (parseFloat(r.transaction_amount) > 10000) {
        reason = `High-value financial volume spike (₹${parseFloat(r.transaction_amount).toLocaleString()})`;
      } else if (r.event_type?.includes('CCTV') || r.event_type?.includes('Vehicle')) {
        reason = `Transit cluster anomaly (${r.relationship_type})`;
      } else if (r.event_type?.includes('Communication')) {
        reason = `Abnormal burst in communication metadata with untrusted nodes`;
      }

      return {
        record_id: r.record_id,
        case_id: r.case_id,
        person_id: r.person_id,
        person_label: r.person_label,
        anomaly_score: score,
        risk_level: score >= 0.85 ? 'HIGH_PRIORITY' : 'ELEVATED_WATCH',
        reason,
        event_type: r.event_type,
        event_datetime: r.event_datetime,
        source_type: r.source_type,
        evidence_ref: r.evidence_ref,
        review_status: score > 0.9 ? 'PENDING_FORENSIC_TRIAGE' : 'AUTOMATED_FLAG'
      };
    })
    .sort((a, b) => b.anomaly_score - a.anomaly_score);

  const startIndex = (page - 1) * limit;
  const paginated = anomalies.slice(startIndex, startIndex + parseInt(limit));

  const distribution = [
    { range: '0.0 - 0.2', count: 0 },
    { range: '0.2 - 0.4', count: 0 },
    { range: '0.4 - 0.6', count: 0 },
    { range: '0.6 - 0.8', count: 0 },
    { range: '0.8 - 1.0', count: 0 }
  ];

  store.records.slice(0, 2000).forEach(r => {
    const sc = parseFloat(r.anomaly_score) || 0;
    if (sc < 0.2) distribution[0].count++;
    else if (sc < 0.4) distribution[1].count++;
    else if (sc < 0.6) distribution[2].count++;
    else if (sc < 0.8) distribution[3].count++;
    else distribution[4].count++;
  });

  res.json({
    success: true,
    totalAnomalies: anomalies.length,
    threshold,
    page: parseInt(page),
    distribution,
    items: paginated
  });
});

export default router;
