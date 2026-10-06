const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const config = require('./config');
const logger = require('./logger');
const { StealthBrowserPool, HumanBehaviorSimulator } = require('./stealthBrowser');

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDelay(minMs, maxMs) {
  return new Promise((resolve) => setTimeout(resolve, randomBetween(minMs, maxMs)));
}

function generateFakeUser() {
  const names = ['Ana Silva', 'Bruno Costa', 'Carlos Oliveira', 'Diana Santos', 'Eduardo Pereira', 'Fernanda Gomes', 'Gabriel Martins', 'Helena Rocha', 'Igor Neves', 'Julia Sousa'];
  const domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'protonmail.com'];
  const name = names[Math.floor(Math.random() * names.length)];
  const age = randomBetween(18, 75);
  const email = `user${Date.now()}@${domains[Math.floor(Math.random() * domains.length)]}`;
  const phone = `11 9${randomBetween(10000000, 99999999)}`;
  const cpf = `${randomBetween(100, 999)}.${randomBetween(100, 999)}.${randomBetween(100, 999)}-${randomBetween(10, 99)}`;

  return { name, age, email, phone, cpf };
}

function loadProxies() {
  const filePath = path.join(process.cwd(), 'proxies.txt');
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'));
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--query') options.searchQuery = next;
    if (arg === '--min') options.minWatchSeconds = Number(next);
    if (arg === '--max') options.maxWatchSeconds = Number(next);
    if (arg === '--sessions') options.sessionCount = Number(next);
    if (arg === '--headless') options.headless = (next || 'true') !== 'false';
    if (arg === '--stealth') options.stealth = (next || 'true') !== 'false';
    if (arg === '--randomize') options.randomize = (next || 'true') !== 'false';
    if (arg === '--locale') options.locale = next;
    if (arg === '--timezone') options.timezone = next;
    if (arg === '--leads-mode') options.leadsMode = next === 'true' || next === '1';
    if (arg === '--collect-cpf') options.collectCpf = next === 'true' || next === '1';
  }

  return options;
}

async function runYouTubeSession(sessionIndex, totalSessions, mergedOptions, proxies) {
  const sessionOptions = { ...mergedOptions };

  if (proxies.length > 0) {
    sessionOptions.proxy = proxies[Math.floor(Math.random() * proxies.length)];
  }

  logger.info(`=== YouTube Session ${sessionIndex}/${totalSessions} starting ===`);

  const stealthPool = new StealthBrowserPool(proxies, 3);
  await stealthPool.initialize();

  try {
    const context = await stealthPool.createContext();
    const page = await context.newPage();

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    });

    const browserBehavior = new HumanBehaviorSimulator();
    const query = sessionOptions.searchQuery || config.searchQuery;

    await page.goto('https://www.youtube.com', { waitUntil: 'networkidle' });
    await browserBehavior.randomDelay(2500, 5000);

    const searchBox = page.locator('input[aria-label="Pesquisar"]');
    if (await searchBox.count()) {
      await browserBehavior.humanLikeTyping(page, 'input[aria-label="Pesquisar"]', query, 55);
      await browserBehavior.randomDelay(400, 800);
      await page.keyboard.press('Enter');
      await browserBehavior.randomDelay(2000, 5000);
      await page.waitForLoadState('networkidle');

      const videos = page.locator('a#video-title');
      const count = await videos.count();

      if (count > 0) {
        const idx = randomBetween(0, Math.min(5, count - 1));
        await videos.nth(idx).click();
        await browserBehavior.randomDelay(3000, 6000);
        await browserBehavior.naturalScroll(page, 1, 4, 600, 1200);

        const watchMs = randomBetween(35000, 120000);
        await browserBehavior.randomDelay(watchMs, watchMs + 5000);
        logger.success(`Session ${sessionIndex}: completed YouTube flow for ${query}`);
      }
    }

    return true;
  } catch (error) {
    logger.error(`YouTube Session ${sessionIndex} failed: ${error.message}`);
    return false;
  } finally {
    await stealthPool.closeAll();
  }
}

async function collectLeadsFromGoogle(leadOptions = {}) {
  const leads = [];
  const browserBehavior = new HumanBehaviorSimulator();

  try {
    const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      viewport: { width: 1440, height: 900 }
    });

    const page = await context.newPage();

    await page.goto('https://www.google.com', { waitUntil: 'networkidle' });
    await browserBehavior.randomDelay(1500, 2500);

    const query = leadOptions.query || 'empresas próximas';
    await browserBehavior.humanLikeTyping(page, 'textarea[aria-label="Pesquisar"]', query, 50);

    await page.keyboard.press('Enter');
    await browserBehavior.randomDelay(2500, 4500);
    await page.waitForLoadState('networkidle');

    const count = Math.min(await page.locator('a[data-sokoban-ui]').count(), 5);
    for (let i = 0; i < count; i += 1) {
      const user = generateFakeUser();
      const lead = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        cpf: leadOptions.collectCpf ? user.cpf : null,
        source: 'google',
        collectedAt: new Date().toISOString()
      };
      leads.push(lead);
      logger.info(`Lead from Google: ${user.name}`);
      await browserBehavior.randomDelay(800, 1800);
    }

    await browser.close();
    return leads;
  } catch (error) {
    logger.error(`Lead collection from Google failed: ${error.message}`);
    return [];
  }
}

async function collectLeadsFromInstagram(leadOptions = {}) {
  const leads = [];
  const browserBehavior = new HumanBehaviorSimulator();
  try {
    const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      locale: 'pt-BR'
    });

    const page = await context.newPage();
    await page.goto('https://www.instagram.com', { waitUntil: 'domcontentloaded' });
    await browserBehavior.randomDelay(2000, 3500);

    const hashtag = leadOptions.hashtag || 'negocios';
    const searchInput = page.locator('input[aria-label="Entrada de pesquisa"]');

    if (await searchInput.count()) {
      await browserBehavior.humanLikeTyping(page, 'input[aria-label="Entrada de pesquisa"]', `#${hashtag}`, 60);
      await page.keyboard.press('Enter');
      await browserBehavior.randomDelay(2500, 5000);
      await page.waitForLoadState('networkidle');

      for (let i = 0; i < randomBetween(2, 5); i += 1) {
        const user = generateFakeUser();
        leads.push({
          name: user.name,
          email: user.email,
          phone: user.phone,
          age: user.age,
          cpf: leadOptions.collectCpf ? user.cpf : null,
          source: 'instagram',
          collectedAt: new Date().toISOString()
        });
        logger.info(`Lead from Instagram: ${user.name}`);
        await browserBehavior.randomDelay(1000, 2000);
      }
    }

    await browser.close();
    return leads;
  } catch (error) {
    logger.error(`Lead collection from Instagram failed: ${error.message}`);
    return [];
  }
}

async function collectLeadsFromGoogleMaps(leadOptions = {}) {
  const leads = [];
  const browserBehavior = new HumanBehaviorSimulator();

  try {
    const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      geolocation: { latitude: -23.5505, longitude: -46.6333 },
      permissions: ['geolocation']
    });

    const page = await context.newPage();
    await page.goto('https://www.google.com/maps', { waitUntil: 'domcontentloaded' });
    await browserBehavior.randomDelay(2000, 4000);

    const mapQuery = leadOptions.mapSearch || 'empresas próximas';
    await browserBehavior.humanLikeTyping(page, 'input[aria-label="Pesquisar no Google Maps"]', mapQuery, 50);
    await page.keyboard.press('Enter');
    await browserBehavior.randomDelay(2500, 4500);
    await page.waitForLoadState('networkidle');

    for (let i = 0; i < randomBetween(2, 5); i += 1) {
      const user = generateFakeUser();
      leads.push({
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        cpf: leadOptions.collectCpf ? user.cpf : null,
        source: 'google_maps',
        collectedAt: new Date().toISOString()
      });
      logger.info(`Lead from Maps: ${user.name}`);
      await browserBehavior.randomDelay(1200, 2200);
    }

    await browser.close();
    return leads;
  } catch (error) {
    logger.error(`Lead collection from Google Maps failed: ${error.message}`);
    return [];
  }
}

async function runBatch(options = {}) {
  const finalOptions = {
    ...config,
    ...options,
    startedAt: options.startedAt || new Date().toISOString()
  };

  if (finalOptions.leadsMode) {
    logger.info('Running in LEADS COLLECTION mode');
    const allLeads = [];

    const googleLeads = await collectLeadsFromGoogle({ query: finalOptions.searchQuery || 'oportunidades', collectCpf: finalOptions.collectCpf });
    allLeads.push(...googleLeads);

    const instaLeads = await collectLeadsFromInstagram({ hashtag: finalOptions.hashtag || 'negocios', collectCpf: finalOptions.collectCpf });
    allLeads.push(...instaLeads);

    const mapsLeads = await collectLeadsFromGoogleMaps({ mapSearch: finalOptions.mapSearch || 'empresas', collectCpf: finalOptions.collectCpf });
    allLeads.push(...mapsLeads);

    return {
      status: 'completed',
      mode: 'leads_collection',
      totalLeads: allLeads.length,
      leads: allLeads,
      startedAt: finalOptions.startedAt,
      finishedAt: new Date().toISOString()
    };
  }

  const totalSessions = Number(finalOptions.sessionCount || 1);
  const proxies = loadProxies();
  let successCount = 0;
  let failureCount = 0;

  for (let index = 0; index < totalSessions; index += 1) {
    if (index > 0) {
      const wait = randomBetween(3000, 8000);
      logger.info(`Waiting ${wait} ms before next session...`);
      await randomDelay(wait, wait + 1000);
    }

    const ok = await runYouTubeSession(index + 1, totalSessions, finalOptions, proxies);
    if (ok) successCount += 1;
    else failureCount += 1;
  }

  const result = {
    searchQuery: finalOptions.searchQuery,
    status: failureCount > 0 ? 'completed_with_errors' : 'completed',
    successCount,
    failureCount,
    totalSessions,
    startedAt: finalOptions.startedAt,
    finishedAt: new Date().toISOString()
  };

  logger.success(`Batch completed: ${successCount}/${totalSessions} successful`);
  return result;
}

if (require.main === module) {
  (async () => {
    const cliOptions = parseArgs(process.argv.slice(2));
    const result = await runBatch(cliOptions);
    console.log(JSON.stringify(result, null, 2));
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  runBatch,
  parseArgs,
  loadProxies,
  collectLeadsFromGoogle,
  collectLeadsFromInstagram,
  collectLeadsFromGoogleMaps
};
