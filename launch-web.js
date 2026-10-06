const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}`;

function openBrowser(target) {
  const platform = process.platform;
  const commands = {
    darwin: ['open', target],
    win32: ['cmd', '/c', 'start', '', target],
    linux: ['xdg-open', target]
  };

  const cmd = commands[platform];
  if (!cmd) return false;

  const child = spawn(cmd[0], cmd.slice(1), { stdio: 'ignore', detached: true });
  child.unref();
  return true;
}

function waitForServer() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 20000);
    const tryCheck = () => {
      const req = http.get(url, (res) => {
        clearTimeout(timeout);
        resolve(true);
        res.resume();
      });

      req.on('error', () => {
        setTimeout(tryCheck, 1000);
      });
    };
    tryCheck();
  });
}

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, 'src/server.js')], {
    env: { ...process.env, PORT: String(port), WEB_AUTH_DISABLED: 'true' },
    stdio: 'inherit'
  });

  const started = await waitForServer();
  if (started) {
    openBrowser(url);
    console.log(`Opening ${url}`);
  } else {
    console.log('Server not ready in time. Check manually: ' + url);
  }

  process.on('SIGINT', () => {
    server.kill('SIGTERM');
    process.exit(0);
  });
})();
