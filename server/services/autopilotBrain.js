const { scrapeGoogleMaps } = require('./googleMaps');
const { generateMessages } = require('./aiGenerator');
const { sendEmailsForToday } = require('./emailSender');
const { getLimitForDomain: getLimitForDomainFn, getDomainAgeDays: getDomainAgeDaysFn } = require('./limits');

const HR_CITIES = [
  { name: 'Zagreb', priority: 10, population: 800000 },
  { name: 'Split', priority: 9, population: 180000 },
  { name: 'Rijeka', priority: 8, population: 130000 },
  { name: 'Osijek', priority: 7, population: 108000 },
  { name: 'Zadar', priority: 6, population: 75000 },
  { name: 'Dubrovnik', priority: 6, population: 42000 },
  { name: 'Slavonski Brod', priority: 5, population: 59000 },
  { name: 'Pula', priority: 5, population: 57000 },
  { name: 'Karlovac', priority: 4, population: 47000 },
  { name: 'Varaždin', priority: 4, population: 46000 },
  { name: 'Šibenik', priority: 4, population: 46000 },
  { name: 'Sisak', priority: 3, population: 48000 },
  { name: 'Bjelovar', priority: 3, population: 40000 },
  { name: 'Vinkovci', priority: 3, population: 35000 },
  { name: 'Vukovar', priority: 3, population: 28000 },
];

const HR_INDUSTRIES = [
  { name: 'apartman najam', query: 'vacation rental', conversionScore: 10 },
  { name: 'restoran', query: 'restaurant', conversionScore: 9 },
  { name: 'frizerski salon', query: 'hair salon', conversionScore: 9 },
  { name: 'kozmetički salon', query: 'beauty salon', conversionScore: 9 },
  { name: 'kafić', query: 'cafe', conversionScore: 8 },
  { name: 'auto servis', query: 'auto repair shop', conversionScore: 8 },
  { name: 'vulkanizer', query: 'tire shop', conversionScore: 8 },
  { name: 'cvjećarnica', query: 'florist', conversionScore: 8 },
  { name: 'pizzeria', query: 'pizza restaurant', conversionScore: 8 },
  { name: 'stomatolog', query: 'dentist', conversionScore: 7 },
  { name: 'veterinar', query: 'veterinarian', conversionScore: 7 },
  { name: 'gym fitness', query: 'gym fitness center', conversionScore: 7 },
  { name: 'pekara', query: 'bakery', conversionScore: 7 },
  { name: 'nekretnine', query: 'real estate agency', conversionScore: 7 },
  { name: 'elektroinstalater', query: 'electrician', conversionScore: 7 },
  { name: 'vodoinstalater', query: 'plumber', conversionScore: 7 },
  { name: 'hotel', query: 'hotel', conversionScore: 6 },
  { name: 'odvjetnik', query: 'law office', conversionScore: 6 },
  { name: 'računovođa', query: 'accounting office', conversionScore: 6 },
  { name: 'građevinska firma', query: 'construction company', conversionScore: 6 },
];

const { WARMING_SCHEDULE } = require('./limits');

const SEASONAL_BOOST = {
  'apartman najam': { months: [3, 4, 5, 6, 7, 8], multiplier: 1.5 },
  restoran: { months: [5, 6, 7, 8, 11, 12], multiplier: 1.3 },
  odvjetnik: { months: [1, 2, 3], multiplier: 1.4 },
  računovođa: { months: [1, 2, 3], multiplier: 1.4 },
  hotel: { months: [4, 5, 6, 7, 8, 9], multiplier: 1.3 },
};

function getDomainAgeDays(createdAt) {
  return getDomainAgeDaysFn(createdAt);
}

function getLimitForDomain(createdAt) {
  return getLimitForDomainFn(createdAt);
}

function getSeasonalBoost(industryName) {
  const month = new Date().getMonth() + 1;
  const boost = SEASONAL_BOOST[industryName];
  if (!boost) return 1.0;
  return boost.months.includes(month) ? boost.multiplier : 1.0;
}

function scoreLeadPotential(lead) {
  let score = 0;
  if (!lead.has_website) {
    score += 7;
  } else {
    if (!lead.is_mobile_friendly) score += 2;
    if (!lead.has_ssl) score += 1;
    if (lead.website_quality <= 3) score += 3;
    else if (lead.website_quality <= 6) score += 1;
  }
  if (lead.google_reviews > 100) score += 1;
  else if (lead.google_reviews > 50) score += 0.5;
  if (lead.google_rating >= 4.5) score += 1;
  if (lead.email) score += 0.5;
  score *= getSeasonalBoost(lead.industry || '');
  return Math.min(Math.round(score * 10) / 10, 10);
}

async function getAIDecisionForToday(db, openai) {
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('hr-HR', { weekday: 'long' });
  const month = today.toLocaleDateString('hr-HR', { month: 'long' });
  const accounts = db.prepare('SELECT * FROM email_accounts WHERE is_active = 1').all();
  const totalLimit = accounts.reduce((sum, acc) => sum + getLimitForDomain(acc.created_at), 0);
  const recentCombos = db
    .prepare(
      `SELECT city, industry, leads_found,
      CAST((julianday('now') - julianday(scraped_at)) AS INTEGER) as days_ago
      FROM scraped_combos ORDER BY scraped_at DESC LIMIT 20`
    )
    .all();
  const repliedLeads = db.prepare('SELECT industry, city, score FROM leads WHERE replied = 1 LIMIT 20').all();
  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  const isWeekend = [0, 6].includes(today.getDay());

  const combosSummary =
    recentCombos.length > 0
      ? recentCombos.map((c) => `${c.city} + ${c.industry} (prije ${c.days_ago} dana)`).join('\n')
      : 'Ništa još - ovo je prvi run';

  const successPatterns =
    repliedLeads.length > 0
      ? repliedLeads.map((l) => `${l.industry} u ${l.city}`).join(', ')
      : 'Još nema odgovora - ovo je početak';

  const prompt = `Ti si iskusni sales strategist za hrvatsku web dev agenciju Adria Dev.
Tvoj zadatak je odlučiti što targetirati DANAS za cold email outreach.

KONTEKST:
- Danas je: ${dayOfWeek}, ${today.toLocaleDateString('hr-HR')}
- Mjesec: ${month}
- ${isWeekend ? 'VIKEND JE - pošalji manje, fokus na pripremu za ponedjeljak' : 'Radni dan - idealno za outreach'}
- Možemo poslati: ${totalLimit} emailova danas ukupno
- Ukupno leadova u bazi: ${totalLeads}

ŠTO SMO VEĆ PROBALI (zadnjih 14 dana):
${combosSummary}

ŠTO JE DO SAD FUNKCIONIRALO:
${successPatterns}

DOSTUPNI GRADOVI: Zagreb(800k), Split(180k), Rijeka(130k), Osijek(108k), Zadar(75k), Dubrovnik(42k), Pula(57k), Varaždin(46k), Šibenik(46k), Slavonski Brod(59k)

DOSTUPNE INDUSTRIJE: apartman najam, restoran, frizerski salon, kozmetički salon, kafić, auto servis, vulkanizer, cvjećarnica, pizzeria, stomatolog, veterinar, gym fitness, pekara, nekretnine, elektroinstalater, vodoinstalater, hotel, odvjetnik, računovođa

PRAVILA:
- Ne ponavljaj grad+industrija combo koji smo radili zadnjih 7 dana
- Zagreb možemo raditi češće (velik grad)
- Sad je ${month} - razmisli što je sezonalno relevantno
- Odaberi točno 3 kombinacije grad+industrija
- Za svaku procijeni šansu konverzije (1-10)

Vrati SAMO validan JSON, ništa drugo:
{
  "reasoning": "2-3 rečenice zašto si odabrao ovo danas",
  "targets": [
    {
      "city": "Zagreb",
      "industry": "apartman najam",
      "industryQuery": "vacation rental",
      "expectedLeads": 50,
      "conversionChance": 8,
      "reasoning": "Zašto baš ovo"
    }
  ],
  "whatsappPriority": "naziv industrije s najvećom šansom",
  "todayTip": "Kratki savjet za danas"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.choices[0].message.content.trim();
  const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(clean);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAutopilot(db, openai, sseClients) {
  const emit = (event, data) => {
    const msg = `data: ${JSON.stringify({ event, ...data })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(msg);
      } catch (e) {
        // client disconnected
      }
    });
  };

  const runResult = db.prepare("INSERT INTO autopilot_runs (status, log) VALUES ('running', '')").run();
  const runId = runResult.lastInsertRowid;

  const appendLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString('hr-HR');
    const line = `[${timestamp}] ${msg}\n`;
    db.prepare('UPDATE autopilot_runs SET log = log || ? WHERE id = ?').run(line, runId);
    emit('log', { message: msg });
    console.log(msg);
  };

  try {
    appendLog('🤖 Autopilot pokrenut...');

    appendLog('🧠 AI analizira situaciju...');
    const decision = await getAIDecisionForToday(db, openai);
    appendLog(`💡 AI odluka: ${decision.reasoning}`);
    db.prepare('UPDATE autopilot_runs SET ai_decision_json = ? WHERE id = ?').run(
      JSON.stringify(decision),
      runId
    );
    db.prepare('UPDATE autopilot_runs SET targets_json = ? WHERE id = ?').run(
      JSON.stringify(decision.targets),
      runId
    );
    emit('ai_decision', { decision });

    let totalLeadsFound = 0;
    const allNewLeads = [];

    for (const target of decision.targets) {
      appendLog(`🔍 Scrapam: ${target.city} + ${target.industry}...`);
      try {
        const leads = await scrapeGoogleMaps(target, db);

        for (const lead of leads) {
          lead.score = scoreLeadPotential(lead);
          try {
            const insertResult = db.prepare(
              `INSERT OR IGNORE INTO leads 
              (business_name, city, industry, address, phone, email, website,
               has_website, website_quality, is_mobile_friendly, has_ssl,
               google_rating, google_reviews, google_place_id, score)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
            ).run(
              lead.business_name,
              lead.city,
              lead.industry,
              lead.address,
              lead.phone,
              lead.email,
              lead.website,
              lead.has_website ? 1 : 0,
              lead.website_quality,
              lead.is_mobile_friendly ? 1 : 0,
              lead.has_ssl ? 1 : 0,
              lead.google_rating,
              lead.google_reviews,
              lead.google_place_id,
              lead.score
            );
            if (insertResult.changes > 0) {
              allNewLeads.push(lead);
              totalLeadsFound++;
              emit('lead_found', { lead, total: totalLeadsFound });
            }
          } catch (e) {
            // skip duplicate
          }
        }

        db.prepare('INSERT INTO scraped_combos (city, industry, leads_found) VALUES (?,?,?)').run(
          target.city,
          target.industry,
          leads.length
        );
        appendLog(`✅ ${target.city} + ${target.industry}: ${leads.length} leadova`);
        await sleep(2000);
      } catch (e) {
        appendLog(`❌ Greška scraping ${target.city}: ${e.message}`);
      }
    }

    db.prepare('UPDATE autopilot_runs SET leads_found = ? WHERE id = ?').run(totalLeadsFound, runId);
    appendLog(`📊 Ukupno novih leadova: ${totalLeadsFound}`);

    appendLog('✍️ Generiram personalizirane poruke...');
    const leadsForMessages = db
      .prepare(
        `SELECT * FROM leads WHERE status = 'new' ORDER BY score DESC LIMIT 200`
      )
      .all();

    let messagesGenerated = 0;
    const batchSize = 5;
    for (let i = 0; i < leadsForMessages.length; i += batchSize) {
      const batch = leadsForMessages.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (lead) => {
          try {
            const messages = await generateMessages(lead, openai);
            db.prepare(
              `UPDATE leads SET 
              email_subject = ?, email_body = ?, whatsapp_body = ?, status = 'message_ready'
              WHERE id = ?`
            ).run(messages.email_subject, messages.email_body, messages.whatsapp_body, lead.id);
            messagesGenerated++;
            emit('message_generated', { leadId: lead.id, total: messagesGenerated });
          } catch (e) {
            db.prepare("UPDATE leads SET status = 'generation_failed' WHERE id = ?").run(lead.id);
          }
        })
      );
      await sleep(1000);
    }

    db.prepare('UPDATE autopilot_runs SET messages_generated = ? WHERE id = ?').run(
      messagesGenerated,
      runId
    );
    appendLog(`✉️ Generirano poruka: ${messagesGenerated}`);

    appendLog('📤 Šaljem emailove...');
    const emailsSent = await sendEmailsForToday(db, appendLog, emit);
    db.prepare('UPDATE autopilot_runs SET emails_sent = ? WHERE id = ?').run(emailsSent, runId);
    appendLog(`🚀 Poslano emailova: ${emailsSent}`);

    db.prepare(
      "UPDATE autopilot_runs SET status = 'completed', finished_at = datetime('now') WHERE id = ?"
    ).run(runId);
    appendLog('✅ Autopilot završen!');
    emit('completed', {
      leadsFound: totalLeadsFound,
      messagesGenerated,
      emailsSent,
    });
  } catch (e) {
    appendLog(`💥 Fatalna greška: ${e.message}`);
    db.prepare(
      "UPDATE autopilot_runs SET status = 'failed', finished_at = datetime('now') WHERE id = ?"
    ).run(runId);
    emit('failed', { error: e.message });
  }
}

module.exports = {
  runAutopilot,
  getLimitForDomain,
  scoreLeadPotential,
  getDomainAgeDays,
  HR_CITIES,
  HR_INDUSTRIES,
  WARMING_SCHEDULE,
};
