const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const logger = require('./logger');
const { runBatch, collectLeadsFromGoogle, collectLeadsFromInstagram, collectLeadsFromGoogleMaps } = require('./index');
const { createRunReport, listReports, getLatestReport } = require('./reportManager');
const { saveLeads, listLeads, getLatestLeads } = require('./leadsManager');

const app = express();
const PORT = Number(process.env.PORT || config.port || 3000);

const authEnabled = process.env.WEB_AUTH_DISABLED !== 'true' && process.env.WEB_AUTH_DISABLED !== '1';
const webUser = process.env.WEB_USER || config.webUser || 'admin';
const webPassword = process.env.WEB_PASSWORD || config.webPassword || 'admin123';

let automationState = {
  running: false,
  status: 'idle',
  output: 'Waiting for start.',
  logs: [],
  startedAt: null,
  finishedAt: null,
  searchQuery: config.searchQuery,
  sessionCount: config.sessionCount || 1,
  report: null,
  leadsCollected: 0
};

const logPath = path.join(process.cwd(), 'logs', 'automation.log');

function ensureLogDir() {
  const dir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readLogTail(limit = 80) {
  ensureLogDir();
  if (!fs.existsSync(logPath)) return [];

  const content = fs.readFileSync(logPath, 'utf8');
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit);
}

function updateLogs() {
  automationState.logs = readLogTail(80);
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

if (authEnabled) {
  app.use(
    basicAuth({
      users: { [webUser]: webPassword },
      challenge: true,
      unauthorizedResponse: 'Unauthorized access'
    })
  );
}

app.get('/api/status', (req, res) => {
  updateLogs();
  res.json({
    running: automationState.running,
    status: automationState.status,
    output: automationState.output,
    logs: automationState.logs,
    startedAt: automationState.startedAt,
    finishedAt: automationState.finishedAt,
    searchQuery: automationState.searchQuery,
    sessionCount: automationState.sessionCount,
    leadsCollected: automationState.leadsCollected
  });
});

app.get('/api/reports', (req, res) => {
  res.json({ ok: true, reports: listReports() });
});

app.get('/api/report/latest', (req, res) => {
  const latest = getLatestReport();
  if (!latest) {
    return res.status(404).json({ ok: false, message: 'No reports generated yet.' });
  }
  return res.json({ ok: true, report: latest });
});

app.get('/api/report/download', (req, res) => {
  const format = (req.query.type || 'json').toLowerCase();
  const latest = getLatestReport();

  if (!latest) {
    return res.status(404).json({ ok: false, message: 'No report available for download.' });
  }

  const filePath = format === 'csv' ? latest.csvPath : latest.jsonPath;
  return res.download(filePath);
});

app.get('/api/leads', (req, res) => {
  res.json({ ok: true, leads: listLeads() });
});

app.get('/api/leads/latest', (req, res) => {
  const latest = getLatestLeads();
  if (!latest) {
    return res.status(404).json({ ok: false, message: 'No leads collected yet.' });
  }
  return res.json({ ok: true, leads: latest });
});

app.get('/api/leads/download', (req, res) => {
  const format = (req.query.type || 'json').toLowerCase();
  const latest = getLatestLeads();

  if (!latest) {
    return res.status(404).json({ ok: false, message: 'No leads available for download.' });
  }

  const filePath = format === 'csv' ? latest.path.replace(/\.json$/, '.csv') : latest.path;
  return res.download(filePath);
});

app.post('/api/start', async (req, res) => {
  if (automationState.running) {
    return res.status(409).json({ ok: false, message: 'Automation is already running.' });
  }

  const body = req.body || {};
  const searchQuery = String(body.searchQuery || config.searchQuery || 'lofi hip hop radio').trim();
  const sessionCount = Number(body.sessionCount || config.sessionCount || 1);
  const headless = body.headless ?? config.headless ?? true;
  const stealth = body.stealth ?? config.stealth ?? true;
  const randomize = body.randomize ?? config.randomize ?? true;

  automationState.running = true;
  automationState.status = 'starting';
  automationState.output = `Starting automation for: ${searchQuery}`;
  automationState.startedAt = new Date().toISOString();
  automationState.finishedAt = null;
  automationState.searchQuery = searchQuery;
  automationState.sessionCount = sessionCount;

  try {
    const summary = await runBatch({
      searchQuery,
      sessionCount,
      headless,
      stealth,
      randomize,
      startedAt: automationState.startedAt
    });

    automationState.status = summary.failureCount > 0 ? 'completed_with_errors' : 'completed';
    automationState.output = `Batch completed: ${summary.successCount} success / ${summary.failureCount} failed`;
    automationState.finishedAt = new Date().toISOString();

    const report = createRunReport({
      searchQuery,
      sessionCount,
      headless,
      stealth,
      randomize,
      startedAt: automationState.startedAt,
      finishedAt: automationState.finishedAt,
      status: automationState.status,
      output: automationState.output,
      summary,
      logs: automationState.logs
    });

    automationState.report = report.metadata;
    updateLogs();

    return res.json({ ok: true, message: 'Automation started successfully.', report: report.metadata });
  } catch (error) {
    automationState.status = 'error';
    automationState.output = error.message;
    logger.error(error.message);
    return res.status(500).json({ ok: false, message: error.message });
  } finally {
    automationState.running = false;
    updateLogs();
  }
});

app.post('/api/leads/collect', async (req, res) => {
  if (automationState.running) {
    return res.status(409).json({ ok: false, message: 'An automation is already running.' });
  }

  const body = req.body || {};
  const sources = body.sources || ['google', 'instagram', 'maps'];
  const collectCpf = body.collectCpf ?? false;
  const searchQuery = body.searchQuery || 'oportunidades de negócio';

  automationState.running = true;
  automationState.status = 'collecting_leads';
  automationState.output = `Starting lead collection from: ${sources.join(', ')}`;
  automationState.startedAt = new Date().toISOString();
  automationState.leadsCollected = 0;

  try {
    const allLeads = [];

    if (sources.includes('google')) {
      logger.info('Collecting from Google...');
      const googleLeads = await collectLeadsFromGoogle({ query: searchQuery, collectCpf });
      allLeads.push(...googleLeads);
      automationState.leadsCollected = allLeads.length;
    }

    if (sources.includes('instagram')) {
      logger.info('Collecting from Instagram...');
      const instaLeads = await collectLeadsFromInstagram({ hashtag: searchQuery, collectCpf });
      allLeads.push(...instaLeads);
      automationState.leadsCollected = allLeads.length;
    }

    if (sources.includes('maps')) {
      logger.info('Collecting from Google Maps...');
      const mapsLeads = await collectLeadsFromGoogleMaps({ mapSearch: searchQuery, collectCpf });
      allLeads.push(...mapsLeads);
      automationState.leadsCollected = allLeads.length;
    }

    automationState.finishedAt = new Date().toISOString();
    automationState.status = 'completed';
    automationState.output = `Lead collection completed: ${allLeads.length} leads collected`;

    const { jsonPath, csvPath } = saveLeads(allLeads);

    updateLogs();

    return res.json({
      ok: true,
      message: `Successfully collected ${allLeads.length} leads`,
      total: allLeads.length,
      leads: allLeads,
      files: { jsonPath, csvPath }
    });
  } catch (error) {
    automationState.status = 'error';
    automationState.output = error.message;
    logger.error(error.message);
    return res.status(500).json({ ok: false, message: error.message });
  } finally {
    automationState.running = false;
    updateLogs();
  }
});

app.post('/api/stop', (req, res) => {
  automationState.running = false;
  automationState.status = 'stopped';
  automationState.output = 'Automation stopped by user.';
  automationState.finishedAt = new Date().toISOString();
  updateLogs();
  res.json({ ok: true, message: 'Stop signal sent' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Web panel started at http://localhost:${PORT}`);
    if (authEnabled) {
      console.log(`Login: ${webUser}/${webPassword}`);
    }
    updateLogs();
  });
}

module.exports = { app, automationState };
