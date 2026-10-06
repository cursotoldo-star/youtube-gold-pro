const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function startServer() {
  serverProcess = spawn(process.execPath, [path.join(__dirname, 'src/server.js')], {
    env: {
      ...process.env,
      WEB_AUTH_DISABLED: 'true'
    },
    stdio: 'inherit'
  });

  serverProcess.on('error', (error) => {
    console.error('Erro ao iniciar o servidor:', error);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 960,
    minWidth: 1150,
    minHeight: 780,
    backgroundColor: '#0b1020',
    title: 'YouTube Gold Pro',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL('http://localhost:3000');
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  setTimeout(createWindow, 1500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
});
