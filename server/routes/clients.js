const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const list = db.prepare('SELECT * FROM clients ORDER BY name').all();
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { name, email, phone, address, city, oib, notes, lead_id } = req.body;
      if (!name) return res.status(400).json({ error: 'name required' });
      db.prepare(
        `INSERT INTO clients (name, email, phone, address, city, oib, notes, lead_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        name,
        email || null,
        phone || null,
        address || null,
        city || null,
        oib || null,
        notes || null,
        lead_id || null
      );
      const id = db.prepare('SELECT last_insert_rowid() as id').get().id;
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
      res.json(client);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const allowed = ['name', 'email', 'phone', 'address', 'city', 'oib', 'notes'];
      const updates = {};
      for (const k of allowed) {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      }
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ error: 'No fields' });
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      const values = [...keys.map((k) => updates[k]), id];
      db.prepare(`UPDATE clients SET ${setClause} WHERE id = ?`).run(...values);
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
      res.json(client);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
      if (!client) return res.status(404).json({ error: 'Not found' });
      res.json(client);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
