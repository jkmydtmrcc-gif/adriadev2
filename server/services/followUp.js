const { generateFollowUp } = require('./aiGenerator');
const { sendSingleEmail } = require('./emailSender');

async function runFollowUps(db, openai) {
  const today = new Date().toISOString().split('T')[0];
  const agency = db.prepare('SELECT owner_name, phone, email FROM agency_settings LIMIT 1').get() || {};

  const followUp1 = db
    .prepare(
      `SELECT * FROM leads
    WHERE status = 'contacted' AND replied = 0
    AND follow_up_count = 0
    AND sent_at < datetime('now', '-7 days')
    AND archived = 0 LIMIT 50`
    )
    .all();

  for (const lead of followUp1) {
    try {
      const msg = await generateFollowUp(lead, 1, openai, agency);
      if (lead.email) {
        const accounts = db.prepare('SELECT * FROM email_accounts WHERE is_active = 1 LIMIT 1').all();
        if (accounts.length) {
          await sendSingleEmail(
            { ...lead, email_subject: msg.email_subject, email_body: msg.email_body },
            accounts[0]
          );
        }
      }
      if (lead.phone && msg.whatsapp_body) {
        db.prepare('UPDATE leads SET whatsapp_body = ? WHERE id = ?').run(msg.whatsapp_body, lead.id);
      }
      db.prepare(
        'UPDATE leads SET follow_up_count = 1, follow_up_1_sent_at = datetime("now") WHERE id = ?'
      ).run(lead.id);
    } catch (e) {
      console.error('Follow-up 1 failed for lead', lead.id, e.message);
    }
  }

  const followUp2 = db
    .prepare(
      `SELECT * FROM leads
    WHERE status = 'contacted' AND replied = 0
    AND follow_up_count = 1
    AND follow_up_1_sent_at < datetime('now', '-7 days')
    AND archived = 0 LIMIT 30`
    )
    .all();

  for (const lead of followUp2) {
    try {
      const msg = await generateFollowUp(lead, 2, openai, agency);
      if (lead.email) {
        const accounts = db.prepare('SELECT * FROM email_accounts WHERE is_active = 1 LIMIT 1').all();
        if (accounts.length) {
          await sendSingleEmail(
            { ...lead, email_subject: msg.email_subject, email_body: msg.email_body },
            accounts[0]
          );
        }
      }
      if (lead.phone && msg.whatsapp_body) {
        db.prepare('UPDATE leads SET whatsapp_body = ? WHERE id = ?').run(msg.whatsapp_body, lead.id);
      }
      db.prepare(
        'UPDATE leads SET follow_up_count = 2, follow_up_2_sent_at = datetime("now"), archived = 1 WHERE id = ?'
      ).run(lead.id);
    } catch (e) {
      console.error('Follow-up 2 failed for lead', lead.id, e.message);
    }
  }

  return { followUp1: followUp1.length, followUp2: followUp2.length };
}

module.exports = { runFollowUps };
