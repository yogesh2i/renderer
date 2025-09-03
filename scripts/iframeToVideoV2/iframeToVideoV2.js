
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('crypto');

// Import new modular components
const { createConfig } = require('./config');
const Logger = require('./logger');
const BrowserManager = require('./browserManager');
const VideoProcessor = require('./videoProcessor');
const {
  sanitizeUrl,
  generateUniqueId,
  validateUrls,
  ensureDirectory,
  removeDirectory
} = require('./utils');

ffmpeg.setFfmpegPath(ffmpegPath);

// ===== OLD SINGLE URL CODE (COMMENTED OUT - PRESERVED) =====
/*

async function captureScreenshotsToVideo(url, duration, fps, outputDir = './screenshots', publicDir = './public') {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-remote-fonts', // Chromium flag to block all remote fonts
      '--font-render-hinting=none'
    ]
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const loadingPage = await context.newPage();
  const page = await context.newPage();


   const client = await context.newCDPSession(page);


  console.log("Navigating the page");
  
  await loadingPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 1200000 });

  // Set virtual time policy to 'pause'
  await client.send('Emulation.setVirtualTimePolicy', {
    policy: 'pause',
    waitForNavigation: true
  });

  // Prepare output directory
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const totalFrames = duration * fps;
  

  console.log("Taking screenshots...")
  for (let i = 0; i < totalFrames; i++) {
  await page.evaluate(() => {
  return new Promise(resolve => requestAnimationFrame(resolve));
});
await page.evaluate(() => {
  window.dispatchEvent(new Event('resize'));
});
// console.log("hi")
  await client.send('Emulation.setVirtualTimePolicy', {
    policy: 'advance',
    budget: Math.round(1000 / fps),
    maxVirtualTimeTaskStarvationCount: 1000,
  });
  await page.evaluate(() => {
  window.dispatchEvent(new Event('resize'));
});
  await page.evaluate(() => {
  document.body.style.outline = '1px solid transparent';
});
// console.log("bye")
    const imgPath = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: imgPath, timeout: 90000 });
  }

  await browser.close();
 
  // Generate output filename
  const baseName = sanitizeUrl(url);
  const videoOut = path.join(publicDir, `${baseName}.mp4`);
  console.log("Creating video");
  
  // Use FFmpeg to create video from images
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(outputDir, 'frame_%04d.png'))
      .inputFPS(fps)
      .outputOptions(['-c:v libx264', '-pix_fmt yuv420p'])
      .output(videoOut)
      .on('end', () => resolve(videoOut))
      .on('error', reject)
      .run();
  });

  // Delete screenshots after video creation
  fs.readdirSync(outputDir)
    .filter(file => file.endsWith('.png'))
    .forEach(file => fs.unlinkSync(path.join(outputDir, file)));
  console.log("Completed.");
  return videoOut;
}

// Usage
captureScreenshotsToVideo(
  "https://project-career-crossroads-animation-344.magicpatterns.app/",
  10, // duration in seconds
  30,    // fps
  './screenshots',
  './public'
)
  .then(videoPath => console.log('Video created at:', videoPath))
  .catch(console.error);
*/

// ===== NEW PRODUCTION-READY MODULAR CODE =====

/**
 * Production-ready batch video processor
 * Industry-standard architecture with proper error handling, logging, and modularity
 */
class BatchVideoProcessor {
  constructor(userConfig = {}) {
    this.config = createConfig(userConfig);
    this.logger = new Logger({
      level: this.config.logging.level,
      enableTimestamps: this.config.logging.enableTimestamps,
      enableColors: this.config.logging.enableColors
    });
    this.browserManager = new BrowserManager(this.config, this.logger);
    this.videoProcessor = new VideoProcessor(this.config, this.logger);
    this.isProcessing = false;
  }

  /**
   * Validates input parameters
   * @param {Array<string>} urls - URLs to process
   * @param {Object} options - Processing options
   * @returns {Object} Validation result
   */
  validateInput(urls, options = {}) {
    // Validate URLs
    const urlValidation = validateUrls(urls);
    if (!urlValidation.valid) {
      return urlValidation;
    }

    // Validate options
    const { duration, fps } = options;
    
    if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
      return { valid: false, error: 'Duration must be a positive number' };
    }
    
    if (fps !== undefined && (typeof fps !== 'number' || fps <= 0)) {
      return { valid: false, error: 'FPS must be a positive number' };
    }

    return { valid: true };
  }

  /**
   * Processes a single URL to video
   * @param {string} url - URL to process
   * @param {number} urlIndex - URL index
   * @param {Object} options - Processing options
   * @param {BrowserContext} context - Shared browser context
   * @returns {Promise<Object>} Processing result
   */
  async processSingleUrl(url, urlIndex, options, context) {
    const { duration, fps, projectOutputDir, projectPublicDir } = options;
    
    this.logger.urlStart(urlIndex, url);
    
    // Generate unique paths for this URL
    const urlId = generateUniqueId();
    const sanitizedUrl = sanitizeUrl(url);
    const screenshotDir = path.join(projectOutputDir, `url_${urlIndex}_${urlId}`);
    const tempVideoDir = path.join(projectPublicDir, `temp_${urlId}`);

    try {
      // Create two-page pattern: loading page + screenshot page
      const { loadingPage, screenshotPage, client } = await this.browserManager.createTwoPagePattern(context, url);

      try {
        // Process URL to video using screenshot page (loading page already did the heavy lifting)
        const result = await this.videoProcessor.processUrl({
          url,
          urlIndex,
          duration,
          fps,
          page: screenshotPage,  // Use screenshot page instead of single page
          client,
          screenshotDir,
          tempVideoDir,
          finalVideoDir: projectPublicDir,
          sanitizedUrl
        });

        return result;

      } finally {
        // Close both pages
        await screenshotPage.close();
        await loadingPage.close();
      }

    } catch (error) {
      // Cleanup on error
      await this.videoProcessor.cleanup(screenshotDir, tempVideoDir);
      throw error;
    }
  }

  /**
   * Processes multiple URLs in batch
   * @param {Array<string>} urls - URLs to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Batch result
   */
  async processUrlsBatch(urls, options = {}) {
    // Prevent concurrent processing
    if (this.isProcessing) {
      throw new Error('Batch processing is already in progress');
    }

    this.isProcessing = true;

    // Validate input
    const validation = this.validateInput(urls, options);
    if (!validation.valid) {
      this.isProcessing = false;
      throw new Error(`Input validation failed: ${validation.error}`);
    }

    // Extract and validate options
    const {
      projectId = generateUniqueId(),
      duration = this.config.processing.defaultDuration,
      fps = this.config.processing.defaultFps,
      baseOutputDir = this.config.directories.screenshots,
      basePublicDir = this.config.directories.output
    } = options;

    // Create project directories
    const projectOutputDir = path.join(baseOutputDir, `project_${projectId}`);
    const projectPublicDir = path.join(basePublicDir, `project_${projectId}`);

    this.logger.info(`Starting batch processing for project ${projectId} with ${urls.length} URLs`, {
      duration,
      fps,
      outputDir: projectPublicDir
    });

    try {
      // Ensure directories exist
      await ensureDirectory(projectOutputDir);
      await ensureDirectory(projectPublicDir);

      // Create shared browser context
      const context = await this.browserManager.createContext(projectId);

      try {
        // Process all URLs in parallel with fail-fast
        const processingOptions = {
          duration,
          fps,
          projectOutputDir,
          projectPublicDir
        };

        const results = await Promise.all(
          urls.map((url, index) =>
            this.processSingleUrl(url, index, processingOptions, context)
          )
        );

        // Cleanup temp directories
        await removeDirectory(projectOutputDir);

        const batchResult = {
          projectId,
          success: true,
          results,
          outputDir: projectPublicDir,
          summary: {
            totalUrls: urls.length,
            successCount: results.length,
            failureCount: 0
          }
        };

        this.logger.info(`Project ${projectId} completed successfully!`, batchResult.summary);
        return batchResult;

      } finally {
        // Close context
        await this.browserManager.closeContext(projectId);
      }

    } catch (error) {
      // Cleanup on failure
      await removeDirectory(projectOutputDir);
      
      this.logger.error(`Batch processing failed for project ${projectId}: ${error.message}`);
      throw error;

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Closes all browser resources
   * @returns {Promise<void>}
   */
  async close() {
    this.logger.info('Shutting down batch video processor');
    await this.browserManager.close();
  }

  /**
   * Gets processor status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      browser: this.browserManager.getStatus(),
      config: {
        fps: this.config.processing.defaultFps,
        duration: this.config.processing.defaultDuration,
        quality: this.config.video.quality
      }
    };
  }
}

// Global processor instance
let globalProcessor = null;

/**
 * Gets or creates global processor instance
 * @param {Object} config - Configuration options
 * @returns {BatchVideoProcessor} Processor instance
 */
function getProcessor(config = {}) {
  if (!globalProcessor) {
    globalProcessor = new BatchVideoProcessor(config);
  }
  return globalProcessor;
}

/**
 * Main function for batch processing (backwards compatible)
 * @param {Array<string>} urls - URLs to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result
 */
async function processUrlsBatch(urls, options = {}) {
  const processor = getProcessor();
  return await processor.processUrlsBatch(urls, options);
}

/**
 * Closes global browser instance
 * @returns {Promise<void>}
 */
async function closeBrowser() {
  if (globalProcessor) {
    await globalProcessor.close();
    globalProcessor = null;
  }
}

// Legacy functions for backwards compatibility
function generateUniqueId_legacy() {
  return generateUniqueId();
}

// ===== EXAMPLE USAGE =====

// Example usage for batch processing
async function runBatchExample() {
  const urls = [
    "https://project-career-crossroads-animation-344.magicpatterns.app/",
    "https://project-ai-driven-time-progression-animation-346.magicpatterns.app/",
    "https://project-ai-workforce-progress-animation-882.magicpatterns.app/",
  ];
  
  const projectId = 'user1';
  
  try {
    const result = await processUrlsBatch(urls, {
      projectId,
      duration: 10,
      fps: 8,
      baseOutputDir: './screenshots',
      basePublicDir: './public'
    });
    7508183884
    console.log('Batch completed successfully!');
    console.log('Results:', result.results);
    console.log('Output directory:', result.outputDir);
    
  } catch (error) {
    console.error('Batch failed:', error.message);
  } finally {
    await closeBrowser();
  }
}

// Export functions for use in other modules
module.exports = {
  BatchVideoProcessor,
  processUrlsBatch,
  closeBrowser,
  sanitizeUrl,
  getProcessor
};

// Run the batch example if this file is executed directly
if (require.main === module) {
  runBatchExample();
}
