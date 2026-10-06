const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'automation.log');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function write(level, message) {
  ensureLogDir();
  const timestamp = new Date().toISOString();
  const content = `${timestamp} [${level}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, content, 'utf8');
}

function info(message) {
  write('INFO', message);
}

function success(message) {
  write('SUCCESS', message);
}

function error(message) {
  write('ERROR', message);
}

function warn(message) {
  write('WARN', message);
}

module.exports = { info, success, error, warn, write };
