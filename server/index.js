require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const Database = require('better-sqlite3');
const OpenAI = require('openai');

const { initDB } = require('./database');
const { runAutopilot } = require('./services/autopilotBrain');
const { runFollowUps } = require('./services/followUp');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const dbPath = path.join(__dirname, 'adria-dev.db');
const db = new Database(dbPath);
initDB(db);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const sseClients = new Set();

app.get('/api/autopilot/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

app.use('/api/leads', require('./routes/leads')(db, openai));
app.use('/api/autopilot', require('./routes/autopilot')(db, openai, sseClients));
app.use('/api/accounts', require('./routes/accounts')(db));
app.use('/api/stats', require('./routes/stats')(db));
app.use('/api/invoices', require('./routes/invoices')(db));
app.use('/api/clients', require('./routes/clients')(db));
app.use('/api/settings', require('./routes/settings')(db));

cron.schedule('0 9 * * *', () => {
  if (openai) runAutopilot(db, openai, sseClients);
});

cron.schedule('0 10 * * *', async () => {
  if (openai) runFollowUps(db, openai);
});

cron.schedule('0 0 * * *', () => {
  const today = new Date().toISOString().split('T')[0];
  db.prepare('UPDATE email_accounts SET sent_today = 0, last_reset = ?').run(today);
  console.log('✅ Daily counters reset');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
