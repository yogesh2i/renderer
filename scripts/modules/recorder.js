const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Website recording logic using Playwright
 */
class Recorder {
  constructor(config) {
    this.config = config;
  }

  /**
   * Record a website directly with pre-loading optimization
   */
  async recordWebsiteDirect(url, duration) {
    let browser = null;
    let context = null;
    
    try {
      console.log(`Recording ${url} for ${duration}s`);
      
      browser = await chromium.launch({ 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--allow-running-insecure-content'
        ]
      });
      
      const timestamp = Date.now();
      const outputDir = this.config.OUTPUT_DIR;
      
      // First load page WITHOUT recording (optimization)
      let context1 = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });

      const loadingPage = await context1.newPage();
      
      console.log('Loading website (no recording)...');
      
      // Navigate and wait for page to load - NOT RECORDED
      await loadingPage.goto(url, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });
      
      // Wait for content to stabilize - NOT RECORDED
      console.log('Waiting for content to load (not recorded)...');
      await loadingPage.waitForTimeout(3000);
      
      // Close loading context
      await context1.close();
      
      // NOW create recording context
      console.log('Starting recording context...');
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: {
          dir: outputDir,
          size: { width: 1280, height: 720 }
        }
      });

      const page = await context.newPage();
      
      // Navigate again (this time with recording) - should be fast since content is cached
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Faster since page was pre-loaded
        timeout: 15000 
      });
      
      // Record ONLY for the specified duration
      console.log(`Recording for exactly ${duration} seconds...`);
      await page.waitForTimeout(duration * 1000);
      
      console.log('Recording completed, finalizing...');
      
      // Get video before closing
      const video = page.video();
      if (!video) {
        throw new Error('Video recording failed');
      }
      
      // Close context to save video
      await context.close();
      context = null;
      
      return { video, timestamp, outputDir };
      
    } catch (error) {
      console.error('Recording error:', error);
      throw new Error(`Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      try {
        if (context) await context.close();
        if (browser) await browser.close();
      } catch (e) {
        console.warn('Cleanup error');
      }
    }
  }
}

module.exports = Recorder;
