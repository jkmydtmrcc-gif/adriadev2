function initDB(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      city TEXT,
      industry TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      has_website INTEGER DEFAULT 0,
      website_quality INTEGER DEFAULT 0,
      is_mobile_friendly INTEGER DEFAULT 0,
      has_ssl INTEGER DEFAULT 0,
      google_rating REAL DEFAULT 0,
      google_reviews INTEGER DEFAULT 0,
      google_place_id TEXT UNIQUE,
      score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new',
      email_subject TEXT,
      email_body TEXT,
      whatsapp_body TEXT,
      sent_from_domain TEXT,
      sent_at TEXT,
      opened INTEGER DEFAULT 0,
      replied INTEGER DEFAULT 0,
      notes TEXT,
      follow_up_1_sent_at TEXT,
      follow_up_2_sent_at TEXT,
      follow_up_count INTEGER DEFAULT 0,
      whatsapp_sent INTEGER DEFAULT 0,
      archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT,
      email TEXT NOT NULL,
      smtp_host TEXT,
      smtp_port INTEGER DEFAULT 587,
      smtp_user TEXT,
      smtp_pass TEXT,
      daily_limit INTEGER DEFAULT 50,
      sent_today INTEGER DEFAULT 0,
      last_reset TEXT,
      is_active INTEGER DEFAULT 1,
      total_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS autopilot_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT,
      status TEXT DEFAULT 'running',
      leads_found INTEGER DEFAULT 0,
      messages_generated INTEGER DEFAULT 0,
      emails_sent INTEGER DEFAULT 0,
      targets_json TEXT,
      ai_decision_json TEXT,
      log TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS scraped_combos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT,
      industry TEXT,
      scraped_at TEXT DEFAULT (datetime('now')),
      leads_found INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS weekly_learnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      best_industries TEXT,
      best_cities TEXT,
      avg_score_of_replied REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      oib TEXT,
      notes TEXT,
      lead_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT DEFAULT 'ponuda',
      invoice_number TEXT UNIQUE,
      client_id INTEGER NOT NULL,
      status TEXT DEFAULT 'draft',
      issue_date TEXT DEFAULT (datetime('now')),
      due_date TEXT,
      items_json TEXT,
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      notes TEXT,
      converted_from INTEGER,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS agency_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_name TEXT DEFAULT 'Adria Dev',
      owner_name TEXT,
      oib TEXT,
      address TEXT,
      city TEXT,
      iban TEXT,
      bank TEXT,
      email TEXT,
      phone TEXT,
      logo_base64 TEXT,
      pdv_obveznik INTEGER DEFAULT 0,
      invoice_prefix_offer TEXT DEFAULT 'P',
      invoice_prefix_invoice TEXT DEFAULT 'R',
      footer_note TEXT DEFAULT 'Hvala na povjerenju!'
    );

    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_google_place_id ON leads(google_place_id);
    CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
    CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
  `);
}

function getNextInvoiceNumber(db, type) {
  const prefix = type === 'ponuda' ? 'P' : 'R';
  const last = db.prepare(`
    SELECT invoice_number FROM invoices
    WHERE type = ? ORDER BY id DESC LIMIT 1
  `).get(type);

  if (!last) return prefix + '-001';

  const parts = last.invoice_number.split('-');
  const lastNum = parseInt(parts[1] || '0', 10);
  const nextNum = String(lastNum + 1).padStart(3, '0');
  return prefix + '-' + nextNum;
}

module.exports = { initDB, getNextInvoiceNumber };
