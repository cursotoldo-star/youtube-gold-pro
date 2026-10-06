# youtube-gold-pro

Advanced YouTube automation dashboard with human-like browsing, lead collection, and report export.

## Features

- YouTube automation flow with Playwright
- Lead collection from Google, Instagram, and Google Maps
- CSV/JSON report generation
- Simple web dashboard in Express
- Electron desktop wrapper

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dashboard:
   ```bash
   npm start
   ```

3. Open in browser:
   ```bash
   http://localhost:3000
   ```

4. Optional desktop mode:
   ```bash
   npm run app
   ```

## Environment

Copy the example file and adjust values if needed:

```bash
cp .env.example .env
```

## Notes

- The embedded automation is for testing and controlled environments.
- If `WEB_AUTH_DISABLED=true` is set, the dashboard runs without login.
- Reports are saved in the `reports/` folder and leads in the `leads/` folder.

## Scripts

- `npm start` — run the web server
- `npm run dev` — same as start
- `npm run app` — launch Electron desktop app
- `npm test` — run basic syntax checks
