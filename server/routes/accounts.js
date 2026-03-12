const express = require('express');
const nodemailer = require('nodemailer');

module.exports = function (db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const accounts = db.prepare('SELECT id, label, email, daily_limit, sent_today, last_reset, is_active, total_sent, created_at FROM email_accounts ORDER BY id').all();
      res.json(accounts);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const {
        label,
        email,
        smtp_host,
        smtp_port = 587,
        smtp_user,
        smtp_pass,
        daily_limit = 50,
      } = req.body;
      if (!email || !smtp_host || !smtp_user || !smtp_pass) {
        return res.status(400).json({ error: 'email, smtp_host, smtp_user, smtp_pass required' });
      }
      const result = db
        .prepare(
          `INSERT INTO email_accounts (label, email, smtp_host, smtp_port, smtp_user, smtp_pass, daily_limit)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(label || email, email, smtp_host, smtp_port, smtp_user, smtp_pass, daily_limit);
      const account = db.prepare('SELECT * FROM email_accounts WHERE id = ?').get(result.lastInsertRowid);
      res.json(account);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const allowed = ['label', 'email', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'daily_limit', 'is_active'];
      const updates = {};
      for (const k of allowed) {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      }
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ error: 'No fields' });
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      const values = [...keys.map((k) => updates[k]), id];
      db.prepare(`UPDATE email_accounts SET ${setClause} WHERE id = ?`).run(...values);
      const account = db.prepare('SELECT * FROM email_accounts WHERE id = ?').get(id);
      res.json(account);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/:id/test', async (req, res) => {
    try {
      const acc = db.prepare('SELECT * FROM email_accounts WHERE id = ?').get(req.params.id);
      if (!acc) return res.status(404).json({ error: 'Account not found' });
      const transporter = nodemailer.createTransport({
        host: acc.smtp_host,
        port: acc.smtp_port,
        secure: acc.smtp_port === 465,
        auth: { user: acc.smtp_user, pass: acc.smtp_pass },
      });
      await transporter.verify();
      res.json({ ok: true, message: 'Veza uspješna' });
    } catch (e) {
      res.status(400).json({ ok: false, error: e.message });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM email_accounts WHERE id = ?').run(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
