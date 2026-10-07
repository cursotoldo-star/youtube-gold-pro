@echo off
setlocal enabledelayedexpansion

REM Detectar diretório do script
set "SCRIPT_DIR=%~dp0"

REM Mudar para o diretório do script
cd /d "%SCRIPT_DIR%"

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo Instalando dependências...
    call npm install --silent
)

REM Iniciar o servidor
echo Iniciando YouTube Gold Pro...
start "" cmd /c "node src/server.js"

REM Aguardar servidor iniciar
timeout /t 3 /nobreak

REM Abrir navegador
start http://localhost:3000

REM Minimizar esta janela
start /min cmd /c "exit"
