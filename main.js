const { app, BrowserWindow, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;
const PORT = 3000;

function getIconPath() {
  const candidate = path.join(__dirname, 'assets', 'icon.png');
  return fs.existsSync(candidate) ? candidate : null;
}

function startServer() {
  return new Promise((resolve) => {
    serverProcess = spawn(process.execPath, [path.join(__dirname, 'src/server.js')], {
      env: {
        ...process.env,
        WEB_AUTH_DISABLED: 'true',
        PORT: PORT
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[SERVER] ${data}`);
      if (data.toString().includes('Web panel started')) {
        setTimeout(() => resolve(), 500);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[SERVER ERROR] ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Erro ao iniciar o servidor:', error);
    });

    setTimeout(() => resolve(), 3000);
  });
}

function createWindow() {
  const iconPath = getIconPath();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 960,
    minWidth: 1150,
    minHeight: 780,
    icon: iconPath || undefined,
    backgroundColor: '#0b1020',
    title: 'YouTube Gold Pro',
    autoHideMenuBar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: true
    }
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.on('crashed', () => {
    mainWindow = null;
    createWindow();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [{ role: 'quit', label: 'Sair' }]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' }
      ]
    },
    {
      label: 'Exibição',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Recarregar (forçado)' },
        { role: 'toggleDevTools', label: 'Ferramentas de Desenvolvimento' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Redefinir Zoom' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'YouTube Gold Pro',
              message: 'YouTube Gold Pro v2.0.0',
              detail: 'Dashboard de Automação YouTube com Coleta de Leads\n\nRepositório: github.com/cursotoldo-star/youtube-gold-pro'
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('ready', async () => {
  console.log('🚀 Iniciando YouTube Gold Pro...');
  await startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
});

process.on('uncaughtException', (error) => {
  console.error('Erro não tratado:', error);
});
