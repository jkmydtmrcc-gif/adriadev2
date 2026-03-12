const PDFDocument = require('pdfkit');

function generateInvoicePDF(invoice, client, settings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const s = settings || {};
    const inv = invoice || {};
    const c = client || {};

    if (s.logo_base64) {
      try {
        const base64Data = s.logo_base64.includes(',') ? s.logo_base64.split(',')[1] : s.logo_base64;
        const logoBuffer = Buffer.from(base64Data, 'base64');
        doc.image(logoBuffer, 50, 45, { width: 80 });
      } catch (e) {
        // skip logo
      }
    }

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(s.agency_name || 'Adria Dev', 150, 50);
    doc
      .fontSize(9)
      .font('Helvetica')
      .text([s.address, s.city].filter(Boolean).join(', '), 150, 75)
      .text('OIB: ' + (s.oib || ''), 150, 88)
      .text('IBAN: ' + (s.iban || ''), 150, 101)
      .text([s.email, s.phone].filter(Boolean).join(' | '), 150, 114);

    doc.moveTo(50, 135).lineTo(545, 135).stroke('#7C6AF7');

    const docType = inv.type === 'ponuda' ? 'PONUDA' : 'RAČUN';
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#7C6AF7').text(docType, 50, 150);

    doc
      .fontSize(11)
      .fillColor('#000000')
      .font('Helvetica')
      .text('Broj: ' + (inv.invoice_number || ''), 50, 178)
      .text('Datum: ' + new Date(inv.issue_date).toLocaleDateString('hr-HR'), 50, 193);
    if (inv.due_date) {
      doc.text('Rok plaćanja: ' + new Date(inv.due_date).toLocaleDateString('hr-HR'), 50, 208);
    }

    doc.fontSize(10).font('Helvetica-Bold').text('KLIJENT:', 350, 150);
    doc
      .font('Helvetica')
      .text(c.name || '', 350, 165)
      .text(c.address || '', 350, 180)
      .text(c.city || '', 350, 195);
    if (c.oib) doc.text('OIB: ' + c.oib, 350, 210);

    let y = 260;
    doc.fillColor('#7C6AF7').rect(50, y, 495, 25).fill();
    doc
      .fillColor('#ffffff')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('OPIS USLUGE', 60, y + 7)
      .text('KOL.', 330, y + 7)
      .text('CIJENA', 380, y + 7)
      .text('UKUPNO', 460, y + 7);

    y += 30;

    const items = JSON.parse(inv.items_json || '[]');
    doc.fillColor('#000000').font('Helvetica').fontSize(10);

    items.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.fillColor('#F8F8FF').rect(50, y - 3, 495, 22).fill();
      }
      doc
        .fillColor('#000000')
        .text(String(item.description || '').slice(0, 50), 60, y)
        .text(String(item.quantity || 1), 338, y)
        .text(Number(item.price || 0).toFixed(2) + ' €', 375, y)
        .text((Number(item.quantity || 1) * Number(item.price || 0)).toFixed(2) + ' €', 455, y);
      y += 22;
    });

    y += 15;
    doc.moveTo(350, y).lineTo(545, y).stroke('#cccccc');
    y += 10;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Iznos bez PDV-a:', 350, y)
      .text(Number(inv.subtotal || 0).toFixed(2) + ' €', 470, y);
    y += 18;

    if (inv.tax_rate > 0) {
      doc
        .text('PDV (' + inv.tax_rate + '%):', 350, y)
        .text(Number(inv.tax_amount || 0).toFixed(2) + ' €', 470, y);
      y += 18;
    }

    if (inv.tax_rate === 0) {
      doc
        .fontSize(9)
        .fillColor('#666666')
        .text('Nije u sustavu PDV-a (čl. 90. Zakona o PDV-u)', 350, y);
      y += 18;
    }

    doc.moveTo(350, y).lineTo(545, y).stroke('#7C6AF7');
    y += 8;

    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#7C6AF7')
      .text('UKUPNO ZA PLATITI:', 350, y)
      .text(Number(inv.total || 0).toFixed(2) + ' €', 455, y);

    y += 50;
    doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold').text('Plaćanje:', 50, y);
    doc
      .font('Helvetica')
      .text('IBAN: ' + (s.iban || ''), 50, y + 15)
      .text('Banka: ' + (s.bank || ''), 50, y + 30)
      .text('Poziv na broj: ' + (inv.invoice_number || ''), 50, y + 45);

    if (s.footer_note) {
      doc.fontSize(9).fillColor('#888888').text(s.footer_note, 50, 730, { align: 'center', width: 495 });
    }

    doc.end();
  });
}

module.exports = { generateInvoicePDF };
