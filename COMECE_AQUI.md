# YouTube Gold Pro - Guia Rápido

## Opção 1: Clicar e Abrir (Recomendado)

### Windows
1. Clique duas vezes em: `start-youtube-gold-pro.bat`
2. Pronto! O app abre automaticamente no navegador.

### Linux/macOS
1. Abra o terminal na pasta do projeto
2. Execute: `chmod +x start-youtube-gold-pro.sh && ./start-youtube-gold-pro.sh`
3. Pronto! O app abre automaticamente.

## Opção 2: Terminal (Se quiser mais controle)

```bash
npm install   # Apenas na primeira vez
npm start     # Inicia o servidor
```

Depois abra: http://localhost:3000

## Login
- Usuário: `admin`
- Senha: `admin123`

## Funcionalidades

### Automação YouTube
- Pesquisa vídeos por termo
- Abre vídeos aleatoriamente
- Simula comportamento humano
- Gera relatórios em JSON/CSV

### Coleta de Leads
- Google
- Instagram  
- Google Maps
- Exporta em JSON/CSV

### Relatórios
- Sucesso/Falha das sessões
- Dados dos leads coletados
- Logs completos

## Para Parar o App

- Feche a aba do navegador
- Ou pressione `Ctrl + C` no terminal

## Problemas?

Se a porta 3000 está ocupada:
```bash
npm start -- --port 3001
```

Para mais detalhes, veja o repositório:
https://github.com/cursotoldo-star/youtube-gold-pro
