const express = require('express');

module.exports = function (db, openai) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const { status, limit = 100, offset = 0 } = req.query;
      let sql = 'SELECT * FROM leads';
      const params = [];
      if (status) {
        sql += ' WHERE status = ?';
        params.push(status);
      }
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));
      const leads = db.prepare(sql).all(...params);
      const total = db
        .prepare(status ? 'SELECT COUNT(*) as c FROM leads WHERE status = ?' : 'SELECT COUNT(*) as c FROM leads')
        .get(...(status ? [status] : []));
      res.json({ leads, total: total.c });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/whatsapp-queue', (req, res) => {
    try {
      const leads = db
        .prepare(
          `SELECT * FROM leads 
           WHERE phone IS NOT NULL AND phone != '' AND (whatsapp_sent = 0 OR whatsapp_sent IS NULL)
           ORDER BY score DESC`
        )
        .all();
      res.json(leads);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const allowed = [
        'status', 'notes', 'replied', 'opened', 'whatsapp_body', 'whatsapp_sent', 'email_subject', 'email_body'
      ];
      const updates = {};
      for (const k of allowed) {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      }
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      const values = [...keys.map((k) => updates[k]), id];
      db.prepare(`UPDATE leads SET ${setClause} WHERE id = ?`).run(...values);
      const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
      res.json(lead);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/:id/mark-whatsapp-sent', (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('UPDATE leads SET whatsapp_sent = 1 WHERE id = ?').run(id);
      const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
      res.json(lead);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/:id/convert-to-client', (req, res) => {
    try {
      const { id } = req.params;
      const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      const existing = db.prepare('SELECT id FROM clients WHERE lead_id = ?').get(id);
      if (existing) return res.json({ id: existing.id, existing: true });
      const result = db
        .prepare(
          `INSERT INTO clients (name, email, phone, address, city, lead_id) VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
          lead.business_name,
          lead.email || '',
          lead.phone || '',
          lead.address || '',
          lead.city || '',
          id
        );
      res.json({ id: result.lastInsertRowid, existing: false });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
