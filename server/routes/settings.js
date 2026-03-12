const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  router.get('/agency', (req, res) => {
    try {
      const s = db.prepare('SELECT * FROM agency_settings LIMIT 1').get();
      res.json(s || {});
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/agency', (req, res) => {
    try {
      const {
        agency_name,
        owner_name,
        oib,
        address,
        city,
        iban,
        bank,
        email,
        phone,
        logo_base64,
        pdv_obveznik,
        invoice_prefix_offer,
        invoice_prefix_invoice,
        footer_note,
      } = req.body;
      const existing = db.prepare('SELECT id FROM agency_settings LIMIT 1').get();
      if (existing) {
        db.prepare(
          `UPDATE agency_settings SET 
          agency_name=?, owner_name=?, oib=?, address=?, city=?, iban=?, bank=?, email=?, phone=?,
          logo_base64=?, pdv_obveznik=?, invoice_prefix_offer=?, invoice_prefix_invoice=?, footer_note=? WHERE id=?`
        ).run(
          agency_name ?? '',
          owner_name ?? '',
          oib ?? '',
          address ?? '',
          city ?? '',
          iban ?? '',
          bank ?? '',
          email ?? '',
          phone ?? '',
          logo_base64 ?? null,
          pdv_obveznik ? 1 : 0,
          invoice_prefix_offer ?? 'P',
          invoice_prefix_invoice ?? 'R',
          footer_note ?? 'Hvala na povjerenju!',
          existing.id
        );
      } else {
        db.prepare(
          `INSERT INTO agency_settings (agency_name, owner_name, oib, address, city, iban, bank, email, phone, logo_base64, pdv_obveznik, invoice_prefix_offer, invoice_prefix_invoice, footer_note)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        ).run(
          agency_name ?? 'Adria Dev',
          owner_name ?? '',
          oib ?? '',
          address ?? '',
          city ?? '',
          iban ?? '',
          bank ?? '',
          email ?? '',
          phone ?? '',
          logo_base64 ?? null,
          pdv_obveznik ? 1 : 0,
          invoice_prefix_offer ?? 'P',
          invoice_prefix_invoice ?? 'R',
          footer_note ?? 'Hvala na povjerenju!'
        );
      }
      const s = db.prepare('SELECT * FROM agency_settings LIMIT 1').get();
      res.json(s);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
