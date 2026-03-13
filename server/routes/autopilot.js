const express = require('express');
const {
  runAutopilot,
  getDailyPlanSummary,
  getAIDecisionForToday,
} = require('../services/autopilotBrain');

module.exports = function (db, openai, sseClients) {
  const router = express.Router();

  router.get('/daily-plan', (req, res) => {
    try {
      const summary = getDailyPlanSummary(db);
      res.json(summary);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/preview-decision', async (req, res) => {
    try {
      if (!openai) return res.status(503).json({ error: 'OpenAI nije konfiguriran' });
      const decision = await getAIDecisionForToday(db, openai);
      res.json(decision);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
  });

  router.post('/start', async (req, res) => {
    try {
      res.json({ ok: true, message: 'Autopilot pokrenut' });
      setImmediate(() => runAutopilot(db, openai, sseClients));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/runs', (req, res) => {
    try {
      const runs = db
        .prepare(
          'SELECT * FROM autopilot_runs ORDER BY started_at DESC LIMIT 50'
        )
        .all();
      res.json(runs);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/runs/:id', (req, res) => {
    try {
      const run = db.prepare('SELECT * FROM autopilot_runs WHERE id = ?').get(req.params.id);
      if (!run) return res.status(404).json({ error: 'Not found' });
      res.json(run);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
