const { createTransport } = require('nodemailer');
const { getLimitForDomain } = require('./limits');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAlreadySent(db, email) {
  if (!email) return false;
  const existing = db
    .prepare(
      `SELECT id FROM leads WHERE email = ? AND status IN ('contacted', 'replied') AND sent_at IS NOT NULL`
    )
    .get(email.trim());
  return !!existing;
}

function isAlreadyContacted(db, businessName, city) {
  if (!businessName) return false;
  const existing = db
    .prepare(
      `SELECT id FROM leads WHERE business_name = ? AND city = ? AND status IN ('contacted', 'replied')`
    )
    .get(businessName.trim(), (city || '').trim());
  return !!existing;
}

async function sendSingleEmail(lead, account) {
  try {
    const transporter = createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.smtp_port === 465,
      auth: {
        user: account.smtp_user,
        pass: account.smtp_pass,
      },
    });

    await transporter.sendMail({
      from: `Adria Dev <${account.email}>`,
      to: lead.email,
      subject: lead.email_subject,
      text: lead.email_body,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
        ${(lead.email_body || '').replace(/\n/g, '<br>')}
      </div>`,
    });
    return true;
  } catch (e) {
    console.error(`Email send failed for ${lead.email}:`, e.message);
    return false;
  }
}

async function sendEmailsForToday(db, appendLog, emit) {
  const today = new Date().toISOString().split('T')[0];
  const accounts = db.prepare('SELECT * FROM email_accounts WHERE is_active = 1').all();

  if (accounts.length === 0) {
    appendLog('⚠️ Nema konfiguriranih email accounta!');
    return 0;
  }

  const totalLimit = accounts.reduce((sum, acc) => sum + getLimitForDomain(acc.created_at), 0);
  const totalSentToday =
    db.prepare(`SELECT COUNT(*) as count FROM leads WHERE date(sent_at) = ?`).get(today)?.count ||
    0;
  if (totalSentToday >= totalLimit) {
    appendLog(`⛔ Dnevni limit dostignut (${totalSentToday}/${totalLimit}). Zaustavljam slanje.`);
    return 0;
  }
  appendLog(`📊 Danas poslano: ${totalSentToday}/${totalLimit} — nastavljam...`);

  for (const account of accounts) {
    if (account.last_reset !== today) {
      db.prepare('UPDATE email_accounts SET sent_today = 0, last_reset = ? WHERE id = ?').run(
        today,
        account.id
      );
      account.sent_today = 0;
    }
  }

  const leads = db
    .prepare(
      `SELECT * FROM leads 
    WHERE status = 'message_ready' AND email IS NOT NULL AND email != ''
    ORDER BY score DESC`
    )
    .all();

  let totalSent = 0;
  let accountIndex = 0;

  for (const lead of leads) {
    if (isAlreadySent(db, lead.email) || isAlreadyContacted(db, lead.business_name, lead.city)) {
      db.prepare("UPDATE leads SET status = 'duplicate' WHERE id = ?").run(lead.id);
      continue;
    }

    let accountFound = false;
    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[(accountIndex + i) % accounts.length];
      const freshAcc = db.prepare('SELECT * FROM email_accounts WHERE id = ?').get(acc.id);
      const limit = getLimitForDomain(freshAcc.created_at);

      if (freshAcc.sent_today < limit) {
        const success = await sendSingleEmail(lead, freshAcc);
        if (success) {
          db.prepare(
            'UPDATE email_accounts SET sent_today = sent_today + 1, total_sent = total_sent + 1 WHERE id = ?'
          ).run(freshAcc.id);
          db.prepare(
            `UPDATE leads SET status = 'contacted', sent_from_domain = ?, sent_at = datetime('now') WHERE id = ?`
          ).run(freshAcc.email, lead.id);
          totalSent++;
          accountIndex = (accountIndex + i + 1) % accounts.length;
          accountFound = true;
          if (emit) emit('email_sent', { leadId: lead.id, domain: freshAcc.email, total: totalSent });
          if (totalSentToday + totalSent >= totalLimit) {
            appendLog(`⛔ Dnevni limit dostignut. Zaustavljam.`);
            return totalSent;
          }
          await sleep(30000);
        }
        break;
      }
    }
    if (!accountFound) break;
  }

  return totalSent;
}

module.exports = { sendEmailsForToday, sendSingleEmail };
