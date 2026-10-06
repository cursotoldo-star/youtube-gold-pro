const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(process.cwd(), 'reports');

function ensureReportDirectory() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function slugify(value) {
  return String(value || 'report')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'report';
}

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function convertToCsvRows(report) {
  const rows = [['timestamp', 'status', 'query', 'sessions', 'success', 'failed', 'output']];
  rows.push([
    report.finishedAt || report.startedAt || new Date().toISOString(),
    report.status || 'unknown',
    report.searchQuery || '',
    report.sessionCount || 0,
    report.summary?.successCount || 0,
    report.summary?.failureCount || 0,
    report.output || ''
  ]);

  if (Array.isArray(report.logs) && report.logs.length > 0) {
    report.logs.forEach((line) => {
      rows.push([new Date().toISOString(), 'log', '', '', '', '', line]);
    });
  }

  return rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function createRunReport(data = {}) {
  ensureReportDirectory();

  const metadata = {
    id: `run-${Date.now()}`,
    createdAt: new Date().toISOString(),
    startedAt: data.startedAt || null,
    finishedAt: data.finishedAt || null,
    status: data.status || 'unknown',
    searchQuery: data.searchQuery || 'lofi hip hop radio',
    sessionCount: Number(data.sessionCount || 1),
    headless: Boolean(data.headless),
    randomize: Boolean(data.randomize),
    stealth: Boolean(data.stealth),
    output: data.output || 'No output recorded.',
    summary: data.summary || {},
    logs: Array.isArray(data.logs) ? data.logs : []
  };

  const prefix = slugify(metadata.searchQuery || 'report');
  const base = `${prefix}-${getTimestamp()}`;
  const jsonPath = path.join(REPORTS_DIR, `${base}.json`);
  const csvPath = path.join(REPORTS_DIR, `${base}.csv`);

  fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2), 'utf8');
  fs.writeFileSync(csvPath, convertToCsvRows(metadata), 'utf8');

  return { jsonPath, csvPath, metadata };
}

function listReports() {
  ensureReportDirectory();
  const files = fs.readdirSync(REPORTS_DIR);
  return files
    .filter((f) => f.endsWith('.json') || f.endsWith('.csv'))
    .map((f) => {
      const fullPath = path.join(REPORTS_DIR, f);
      const stat = fs.statSync(fullPath);
      return {
        name: f,
        type: f.endsWith('.json') ? 'json' : 'csv',
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        path: fullPath
      };
    })
    .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
}

function getLatestReport() {
  const reports = listReports().filter((file) => file.type === 'json');
  if (!reports.length) return null;
  const latest = reports[0];
  const data = JSON.parse(fs.readFileSync(latest.path, 'utf8'));
  return { ...data, jsonPath: latest.path, csvPath: latest.path.replace(/\.json$/, '.csv') };
}

module.exports = { createRunReport, listReports, getLatestReport, ensureReportDirectory };
