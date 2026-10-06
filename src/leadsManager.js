const fs = require('fs');
const path = require('path');

const LEADS_DIR = path.join(process.cwd(), 'leads');

function ensureLeadsDir() {
  if (!fs.existsSync(LEADS_DIR)) {
    fs.mkdirSync(LEADS_DIR, { recursive: true });
  }
}

function saveLeads(leads, filename = null) {
  ensureLeadsDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = filename || `leads-${timestamp}.json`;
  const filePath = path.join(LEADS_DIR, fileName);

  fs.writeFileSync(filePath, JSON.stringify({ leads }, null, 2), 'utf8');

  const csvPath = filePath.replace(/\.json$/, '.csv');
  fs.writeFileSync(csvPath, convertToCsv(leads), 'utf8');

  return { jsonPath: filePath, csvPath };
}

function convertToCsv(leads) {
  if (!Array.isArray(leads) || leads.length === 0) {
    return 'name,email,phone,age,cpf,source,collectedAt\n';
  }

  const headers = ['name', 'email', 'phone', 'age', 'cpf', 'source', 'collectedAt'];
  const rows = [headers.join(',')];

  leads.forEach((lead) => {
    const row = headers.map((header) => {
      const value = lead[header] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
    rows.push(row);
  });

  return rows.join('\n');
}

function listLeads() {
  ensureLeadsDir();
  const files = fs.readdirSync(LEADS_DIR);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const filePath = path.join(LEADS_DIR, f);
      const stat = fs.statSync(filePath);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        filename: f,
        path: filePath,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        count: Array.isArray(content.leads) ? content.leads.length : 0
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getLatestLeads() {
  const files = listLeads();
  if (!files.length) return null;

  const latest = files[0];
  const content = JSON.parse(fs.readFileSync(latest.path, 'utf8'));
  return {
    ...latest,
    data: Array.isArray(content.leads) ? content.leads : []
  };
}

module.exports = {
  saveLeads,
  convertToCsv,
  listLeads,
  getLatestLeads,
  ensureLeadsDir
};
