const { chromium } = require('playwright');
const logger = require('./logger');

class StealthBrowserPool {
  constructor(proxyList = [], maxContexts = 5) {
    this.proxyList = proxyList;
    this.maxContexts = maxContexts;
    this.browser = null;
    this.contexts = [];
    this.currentProxyIndex = 0;
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-web-resources',
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages'
      ]
    });

    logger.info(`Browser pool initialized with ${this.maxContexts} max contexts`);
  }

  getNextProxy() {
    if (this.proxyList.length === 0) return null;
    const proxy = this.proxyList[this.currentProxyIndex % this.proxyList.length];
    this.currentProxyIndex += 1;
    return proxy;
  }

  async createContext() {
    if (!this.browser) throw new Error('Browser not initialized');

    const proxy = this.getNextProxy();
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
    ];

    const selectedAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    const contextOptions = {
      userAgent: selectedAgent,
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      viewport: {
        width: 1280 + Math.random() * 200,
        height: 720 + Math.random() * 200
      },
      geolocation: {
        latitude: -23.5505 + (Math.random() - 0.5) * 0.5,
        longitude: -46.6333 + (Math.random() - 0.5) * 0.5
      },
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    };

    if (proxy) {
      contextOptions.proxy = proxy;
      logger.info(`Context created with proxy: ${proxy.server}`);
    }

    const context = await this.browser.newContext(contextOptions);

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', description: '' },
          { name: 'Native Client Executable', description: '' },
          { name: 'Shockwave Flash', description: 'Shockwave Flash 32.0 r0' }
        ]
      });
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en'] });
      window.chrome = { runtime: {} };
    });

    this.contexts.push(context);
    logger.info(`New isolated context created (total: ${this.contexts.length}/${this.maxContexts})`);

    return context;
  }

  async closeContext(context) {
    await context.close();
    const index = this.contexts.indexOf(context);
    if (index > -1) this.contexts.splice(index, 1);
    logger.info(`Context closed (remaining: ${this.contexts.length})`);
  }

  async closeAll() {
    for (const context of this.contexts) {
      await context.close();
    }
    this.contexts = [];

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    logger.info('Browser pool closed');
  }

  getActiveContextCount() {
    return this.contexts.length;
  }
}

class HumanBehaviorSimulator {
  constructor() {
    this.lastActionTime = Date.now();
  }

  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async randomDelay(minMs, maxMs) {
    const delay = this.randomBetween(minMs, maxMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async humanLikeTyping(page, selector, text, baseDelayMs = 50) {
    const element = page.locator(selector);
    await element.click();
    await this.randomDelay(200, 400);

    for (const char of text) {
      await element.type(char);
      const charDelay = baseDelayMs + this.randomBetween(-30, 30);
      await this.randomDelay(charDelay - 15, charDelay + 15);
    }

    this.lastActionTime = Date.now();
  }

  async naturalScroll(page, minScrolls = 2, maxScrolls = 5, minWaitMs = 800, maxWaitMs = 1500) {
    const scrollCount = this.randomBetween(minScrolls, maxScrolls);

    for (let i = 0; i < scrollCount; i += 1) {
      const scrollDistance = this.randomBetween(200, 600);
      await page.evaluate((distance) => window.scrollBy(0, distance), scrollDistance);
      await this.randomDelay(minWaitMs, maxWaitMs);
    }

    this.lastActionTime = Date.now();
  }

  async moveMouse(page) {
    const x = this.randomBetween(100, 1200);
    const y = this.randomBetween(100, 700);
    await page.mouse.move(x, y);
    await this.randomDelay(300, 800);
  }

  async randomWatchTime(minSeconds = 20, maxSeconds = 120) {
    return this.randomBetween(minSeconds * 1000, maxSeconds * 1000);
  }

  async pauseAndRead(minMs = 2000, maxMs = 5000) {
    await this.randomDelay(minMs, maxMs);
  }

  async randomUserInteraction(page, probability = 0.4) {
    if (Math.random() < probability) {
      const actions = [
        () => this.moveMouse(page),
        () => this.naturalScroll(page, 1, 2, 500, 1200)
      ];
      const action = actions[Math.floor(Math.random() * actions.length)];
      await action();
    }
  }
}

module.exports = { StealthBrowserPool, HumanBehaviorSimulator };
