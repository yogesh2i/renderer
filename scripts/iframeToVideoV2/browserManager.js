/**
 * Browser management module
 * Handles browser lifecycle and page management
 */

const { chromium } = require('playwright');
const Logger = require('./logger');
const { withTimeout, withRetry } = require('./utils');

class BrowserManager {
  constructor(config, logger = new Logger()) {
    this.config = config;
    this.logger = logger;
    this.browser = null;
    this.contexts = new Map(); // Track contexts by ID
    this.isShuttingDown = false;
  }

  /**
   * Launches browser if not already running
   * @returns {Promise<Browser>} Browser instance
   */
  async getBrowser() {
    if (!this.browser || this.isShuttingDown) {
      this.logger.debug('Launching new browser instance');
      
      const browserOptions = {
        headless: this.config.browser.headless,
        args: this.config.browser.args
      };

      this.browser = await withTimeout(
        chromium.launch(browserOptions),
        30000,
        'Browser launch timed out'
      );

      this.browser.on('disconnected', () => {
        this.logger.warn('Browser disconnected unexpectedly');
        this.browser = null;
      });

      this.logger.info('Browser launched successfully');
    }

    return this.browser;
  }

  /**
   * Creates a new browser context
   * @param {string} contextId - Unique identifier for context
   * @returns {Promise<BrowserContext>} Browser context
   */
  async createContext(contextId) {
    const browser = await this.getBrowser();
    
    this.logger.debug(`Creating context: ${contextId}`);
    
    const context = await browser.newContext({
      viewport: this.config.context.viewport,
      userAgent: this.config.context.userAgent
    });

    // Set up context event handlers
    context.on('close', () => {
      this.contexts.delete(contextId);
      this.logger.debug(`Context closed: ${contextId}`);
    });

    context.on('page', (page) => {
      this.logger.debug(`New page created in context: ${contextId}`);
    });

    this.contexts.set(contextId, context);
    return context;
  }

  /**
   * Gets existing context or creates new one
   * @param {string} contextId - Context identifier
   * @returns {Promise<BrowserContext>} Browser context
   */
  async getContext(contextId) {
    let context = this.contexts.get(contextId);
    
    if (!context) {
      context = await this.createContext(contextId);
    }
    
    return context;
  }

  /**
   * Creates and sets up a page with CDP session
   * @param {BrowserContext} context - Browser context
   * @returns {Promise<Object>} Page and CDP client
   */
  async createPageWithCDP(context) {
    const page = await context.newPage();
    
    // Set up page error handling
    page.on('pageerror', (error) => {
      this.logger.warn(`Page error: ${error.message}`);
    });

    page.on('console', (message) => {
      if (message.type() === 'error') {
        this.logger.debug(`Console error: ${message.text()}`);
      }
    });

    // Create CDP session
    const client = await context.newCDPSession(page);
    
    return { page, client };
  }

  /**
   * Creates two pages for the loading pattern: one for preloading, one for screenshots
   * @param {BrowserContext} context - Browser context
   * @param {string} url - URL to navigate to
   * @returns {Promise<Object>} Loading page, screenshot page, and CDP client
   */
  async createTwoPagePattern(context, url) {
    this.logger.debug('Creating two-page pattern for resource optimization');
    
    // Step 1: Create loading page for resource preloading
    const loadingPage = await context.newPage();
    
    // Step 2: Navigate loading page with networkidle to ensure all resources load
    this.logger.debug(`Loading page navigating to: ${url} with networkidle`);
    await loadingPage.goto(url, { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    this.logger.debug('Loading page completed - resources cached');
    
    // Step 3: Create screenshot page
    const screenshotPage = await context.newPage();
    
    // Set up error handling for screenshot page
    screenshotPage.on('pageerror', (error) => {
      this.logger.warn(`Screenshot page error: ${error.message}`);
    });

    screenshotPage.on('console', (message) => {
      if (message.type() === 'error') {
        this.logger.debug(`Screenshot page console error: ${message.text()}`);
      }
    });
    
    // Step 4: Navigate screenshot page with domcontentloaded (fast, uses cache)
    this.logger.debug(`Screenshot page navigating to: ${url} with domcontentloaded`);
    await screenshotPage.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 120000 
    });
    this.logger.debug('Screenshot page ready for capture');
    
    // Step 5: Create CDP session for screenshot page
    const client = await context.newCDPSession(screenshotPage);
    
    return { 
      loadingPage, 
      screenshotPage, 
      client 
    };
  }

  /**
   * Navigates page with retry logic
   * @param {Page} page - Playwright page
   * @param {string} url - URL to navigate to
   * @param {Object} options - Navigation options
   * @returns {Promise<void>}
   */
  async navigateWithRetry(page, url, options = {}) {
    const {
      waitUntil = 'domcontentloaded',
      timeout = this.config.navigation.navigationTimeout
    } = options;

    const navigate = async () => {
      this.logger.debug(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil, timeout });
      this.logger.debug(`Navigation completed: ${url}`);
    };

    return await withRetry(navigate, {
      maxAttempts: 2,
      delay: 1000
    })();
  }

  /**
   * Waits for network to be idle
   * @param {Page} page - Playwright page
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForNetworkIdle(page, timeout = this.config.navigation.networkIdleTimeout) {
    try {
      await page.waitForLoadState('networkidle', { timeout });
      this.logger.debug('Network idle achieved');
    } catch (error) {
      this.logger.warn(`Network idle timeout: ${error.message}`);
      // Don't fail, continue with processing
    }
  }

  /**
   * Closes a specific context
   * @param {string} contextId - Context identifier
   * @returns {Promise<void>}
   */
  async closeContext(contextId) {
    const context = this.contexts.get(contextId);
    if (context) {
      await context.close();
      this.contexts.delete(contextId);
      this.logger.debug(`Context closed: ${contextId}`);
    }
  }

  /**
   * Closes all contexts
   * @returns {Promise<void>}
   */
  async closeAllContexts() {
    const contextIds = Array.from(this.contexts.keys());
    
    await Promise.all(
      contextIds.map(contextId => this.closeContext(contextId))
    );
    
    this.logger.debug('All contexts closed');
  }

  /**
   * Closes browser and all contexts
   * @returns {Promise<void>}
   */
  async close() {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.logger.debug('Shutting down browser manager');

    try {
      // Close all contexts first
      await this.closeAllContexts();

      // Close browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.logger.info('Browser closed successfully');
      }
    } catch (error) {
      this.logger.error(`Error during browser shutdown: ${error.message}`);
      throw error;
    } finally {
      this.isShuttingDown = false;
    }
  }

  /**
   * Gets browser status information
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      browserRunning: !!this.browser,
      activeContexts: this.contexts.size,
      contextIds: Array.from(this.contexts.keys()),
      isShuttingDown: this.isShuttingDown
    };
  }
}

module.exports = BrowserManager;
