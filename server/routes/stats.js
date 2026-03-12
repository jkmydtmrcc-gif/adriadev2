const express = require('express');
const { getLimitForDomain, getDomainAgeDays } = require('../services/limits');

module.exports = function (db) {
  const router = express.Router();

  router.get('/dashboard', (req, res) => {
    try {
      const totalLeads = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
      const contacted = db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'contacted'").get().c;
      const replied = db.prepare('SELECT COUNT(*) as c FROM leads WHERE replied = 1').get().c;
      const messageReady = db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'message_ready'").get().c;
      const followUpPending = db
        .prepare(
          `SELECT COUNT(*) as c FROM leads 
           WHERE status = 'contacted' AND replied = 0 AND archived = 0 
           AND (follow_up_count < 2) AND (sent_at < datetime('now', '-7 days') OR follow_up_1_sent_at < datetime('now', '-7 days'))`
        )
        .get().c;

      const accounts = db.prepare('SELECT * FROM email_accounts WHERE is_active = 1').all();
      const accountsWithLimits = accounts.map((a) => ({
        ...a,
        limitToday: getLimitForDomain(a.created_at),
        domainAgeDays: getDomainAgeDays(a.created_at),
      }));

      const lastRun = db
        .prepare('SELECT * FROM autopilot_runs ORDER BY started_at DESC LIMIT 1')
        .get();

      res.json({
        totalLeads,
        contacted,
        replied,
        messageReady,
        followUpPending,
        accounts: accountsWithLimits,
        lastRun,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/analytics', (req, res) => {
    try {
      const byStatus = db
        .prepare(
          `SELECT status, COUNT(*) as count FROM leads GROUP BY status`
        )
        .all();
      const byIndustry = db
        .prepare(
          `SELECT industry, COUNT(*) as count FROM leads WHERE industry IS NOT NULL GROUP BY industry ORDER BY count DESC LIMIT 10`
        )
        .all();
      const byCity = db
        .prepare(
          `SELECT city, COUNT(*) as count FROM leads WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 10`
        )
        .all();
      const runsLast30 = db
        .prepare(
          `SELECT date(started_at) as day, SUM(leads_found) as leads, SUM(emails_sent) as emails 
           FROM autopilot_runs WHERE started_at > datetime('now', '-30 days') AND status = 'completed'
           GROUP BY date(started_at) ORDER BY day`
        )
        .all();
      res.json({ byStatus, byIndustry, byCity, runsLast30 });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
