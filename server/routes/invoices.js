const express = require('express');
const { getNextInvoiceNumber } = require('../database');
const { generateInvoicePDF } = require('../services/pdfGenerator');

module.exports = function (db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const { type } = req.query;
      let sql = 'SELECT i.*, c.name as client_name FROM invoices i JOIN clients c ON i.client_id = c.id';
      const params = [];
      if (type && ['ponuda', 'racun'].includes(type)) {
        sql += ' WHERE i.type = ?';
        params.push(type);
      }
      sql += ' ORDER BY i.created_at DESC';
      const list = db.prepare(sql).all(...params);
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/stats', (req, res) => {
    try {
      const total = db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM invoices WHERE status != 'cancelled'").get().s;
      const paid = db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM invoices WHERE status = 'paid'").get().s;
      const pending = db
        .prepare(
          "SELECT COALESCE(SUM(total), 0) as s FROM invoices WHERE status IN ('sent', 'accepted', 'draft') AND type = 'racun'"
        )
        .get().s;
      res.json({ totalInvoiced: total, totalPaid: paid, pendingPayment: pending });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const {
        type = 'ponuda',
        client_id,
        due_date,
        items_json,
        notes,
      } = req.body;
      if (!client_id) return res.status(400).json({ error: 'client_id required' });
      const items = Array.isArray(items_json) ? items_json : JSON.parse(items_json || '[]');
      let subtotal = 0;
      items.forEach((i) => {
        subtotal += (Number(i.quantity) || 1) * (Number(i.price) || 0);
      });
      const settings = db.prepare('SELECT * FROM agency_settings LIMIT 1').get();
      const taxRate = settings && settings.pdv_obveznik ? 25 : 0;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      const invoiceNumber = getNextInvoiceNumber(db, type);
      const issueDate = new Date().toISOString().split('T')[0];
      const due = due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

      const runResult = db.prepare(
        `INSERT INTO invoices (type, invoice_number, client_id, status, issue_date, due_date, items_json, subtotal, tax_rate, tax_amount, total, notes)
         VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        type,
        invoiceNumber,
        client_id,
        issueDate,
        due,
        JSON.stringify(items),
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes || null
      );
      const id = runResult.lastInsertRowid;
      const inv = db.prepare('SELECT i.*, c.name as client_name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = ?').get(id);
      res.json(inv);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const inv = db.prepare('SELECT i.*, c.name as client_name, c.email as client_email, c.address as client_address, c.city as client_city, c.oib as client_oib FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = ?').get(req.params.id);
      if (!inv) return res.status(404).json({ error: 'Not found' });
      res.json(inv);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const allowed = ['status', 'due_date', 'items_json', 'notes', 'paid_at'];
      const updates = {};
      for (const k of allowed) {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      }
      if (updates.items_json && typeof updates.items_json !== 'string') {
        updates.items_json = JSON.stringify(updates.items_json);
      }
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields' });
      const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
      if (!inv) return res.status(404).json({ error: 'Not found' });
      if (updates.items_json) {
        const items = JSON.parse(updates.items_json);
        let subtotal = 0;
        items.forEach((i) => {
          subtotal += (Number(i.quantity) || 1) * (Number(i.price) || 0);
        });
        const taxAmount = subtotal * (inv.tax_rate / 100);
        updates.subtotal = subtotal;
        updates.tax_amount = taxAmount;
        updates.total = subtotal + taxAmount;
      }
      const keys = Object.keys(updates);
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      const values = [...keys.map((k) => updates[k]), id];
      db.prepare(`UPDATE invoices SET ${setClause} WHERE id = ?`).run(...values);
      const updated = db.prepare('SELECT i.*, c.name as client_name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = ?').get(id);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/:id/convert', (req, res) => {
    try {
      const offer = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
      if (!offer || offer.type !== 'ponuda') return res.status(400).json({ error: 'Nije ponuda' });
      const invoiceNumber = getNextInvoiceNumber(db, 'racun');
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
      const runResult = db.prepare(
        `INSERT INTO invoices (type, invoice_number, client_id, status, issue_date, due_date, items_json, subtotal, tax_rate, tax_amount, total, converted_from)
         VALUES ('racun', ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        invoiceNumber,
        offer.client_id,
        today,
        dueDate,
        offer.items_json,
        offer.subtotal,
        offer.tax_rate,
        offer.tax_amount,
        offer.total,
        offer.id
      );
      const newId = runResult.lastInsertRowid;
      db.prepare("UPDATE invoices SET status = 'accepted' WHERE id = ?").run(offer.id);
      const inv = db.prepare('SELECT i.*, c.name as client_name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = ?').get(newId);
      res.json(inv);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/:id/pdf', async (req, res) => {
    try {
      const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
      if (!inv) return res.status(404).json({ error: 'Not found' });
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(inv.client_id);
      const settings = db.prepare('SELECT * FROM agency_settings LIMIT 1').get();
      const pdf = await generateInvoicePDF(inv, client, settings);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${inv.invoice_number}.pdf"`);
      res.send(pdf);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
