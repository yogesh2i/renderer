/**
 * Video processor module
 * Handles screenshot capture and video generation
 */

const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const Logger = require('./logger');
const { 
  ensureDirectory, 
  removeDirectory, 
  calculateTotalFrames, 
  calculateFrameBudget,
  withTimeout,
  getFileStats
} = require('./utils');
const { getVideoQualityOptions } = require('./config');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

class VideoProcessor {
  constructor(config, logger = new Logger()) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Sets up virtual time control for consistent frame capture
   * @param {CDPSession} client - CDP client
   * @returns {Promise<void>}
   */
  async setupVirtualTime(client) {
    this.logger.debug('Setting up virtual time control');
    
    await client.send('Emulation.setVirtualTimePolicy', {
    //   policy: 'pauseIfNetworkFetchesPending',
    policy: 'pause',
      waitForNavigation: this.config.cdp.waitForNavigation
    });
  }

  /**
   * Advances virtual time by one frame
   * @param {CDPSession} client - CDP client
   * @param {number} fps - Frames per second
   * @returns {Promise<void>}
   */
  async advanceFrame(client, fps) {
    const budget = calculateFrameBudget(fps);
    
    await client.send('Emulation.setVirtualTimePolicy', {
      policy: 'advance',
      budget,
      maxVirtualTimeTaskStarvationCount: this.config.cdp.maxVirtualTimeTaskStarvationCount
    });
  }

  /**
   * Captures a single screenshot
   * @param {Page} page - Playwright page
   * @param {string} imagePath - Path to save screenshot
   * @param {number} frameIndex - Frame index for logging
   * @param {number} urlIndex - URL index for logging
   * @returns {Promise<void>}
   */
  async captureScreenshot(page, imagePath, frameIndex, urlIndex) {
    const screenshotOptions = {
      path: imagePath,
      type: this.config.screenshot.type,
      timeout: this.config.screenshot.timeout,
      fullPage: this.config.screenshot.fullPage
    };

    if (this.config.screenshot.quality && this.config.screenshot.type === 'jpeg') {
      screenshotOptions.quality = this.config.screenshot.quality;
    }

    await withTimeout(
      page.screenshot(screenshotOptions),
      this.config.screenshot.timeout,
      `Screenshot timeout for frame ${frameIndex}`
    );

    this.logger.screenshotProgress(urlIndex, frameIndex + 1, frameIndex + 1);
  }

  /**
   * Captures all screenshots for a URL
   * @param {Page} page - Playwright page
   * @param {CDPSession} client - CDP client
   * @param {string} screenshotDir - Directory to save screenshots
   * @param {number} duration - Video duration in seconds
   * @param {number} fps - Frames per second
   * @param {number} urlIndex - URL index for logging
   * @returns {Promise<Array<string>>} Array of screenshot paths
   */
  async captureScreenshots(page, client, screenshotDir, duration, fps, urlIndex) {
    await this.setupVirtualTime(client);
    
    const totalFrames = calculateTotalFrames(duration, fps);
    const screenshotPaths = [];

    this.logger.info(`Capturing ${totalFrames} screenshots for URL ${urlIndex}`);

    for (let i = 0; i < totalFrames; i++) {
      // Advance time before taking screenshot
      await this.advanceFrame(client, fps);

      // Generate screenshot path
      const imagePath = path.join(screenshotDir, `frame_${String(i).padStart(4, '0')}.png`);
      
      // Capture screenshot
      await this.captureScreenshot(page, imagePath, i, urlIndex);
      screenshotPaths.push(imagePath);
    }

    this.logger.info(`Screenshot capture completed for URL ${urlIndex}`);
    return screenshotPaths;
  }

  /**
   * Generates video from screenshots using FFmpeg
   * @param {string} screenshotDir - Directory containing screenshots
   * @param {string} outputPath - Output video path
   * @param {number} fps - Frames per second
   * @returns {Promise<void>}
   */
  async generateVideo(screenshotDir, outputPath, fps) {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Generating video: ${outputPath}`);
      
      const inputPattern = path.join(screenshotDir, 'frame_%04d.png');
      const qualityOptions = getVideoQualityOptions(this.config.video.quality);
      
      const command = ffmpeg()
        .input(inputPattern)
        .inputFPS(fps)
        .outputOptions([
          '-c:v', this.config.video.codec,
          '-pix_fmt', this.config.video.pixelFormat,
          ...qualityOptions
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          this.logger.debug(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            this.logger.debug(`Video generation progress: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', async () => {
          try {
            const stats = await getFileStats(outputPath);
            this.logger.info(`Video generated successfully: ${outputPath} (${stats.formattedSize})`);
            resolve();
          } catch (error) {
            this.logger.warn(`Could not get video stats: ${error.message}`);
            resolve(); // Don't fail if we can't get stats
          }
        })
        .on('error', (error) => {
          this.logger.error(`FFmpeg error: ${error.message}`);
          reject(error);
        });

      // Add timeout for video generation
      const timeout = setTimeout(() => {
        command.kill('SIGKILL');
        reject(new Error('Video generation timed out'));
      }, 300000); // 5 minute timeout

      command.on('end', () => clearTimeout(timeout));
      command.on('error', () => clearTimeout(timeout));

      command.run();
    });
  }

  /**
   * Processes a single URL to video
   * @param {Object} params - Processing parameters
   * @returns {Promise<Object>} Processing result
   */
  async processUrl({
    url,
    urlIndex,
    duration,
    fps,
    page,
    client,
    screenshotDir,
    tempVideoDir,
    finalVideoDir,
    sanitizedUrl
  }) {
    try {
      // Ensure directories exist
      await ensureDirectory(screenshotDir);
      await ensureDirectory(tempVideoDir);
      await ensureDirectory(finalVideoDir);

      // Capture screenshots
      await this.captureScreenshots(page, client, screenshotDir, duration, fps, urlIndex);

      // Generate video paths
      const tempVideoPath = path.join(tempVideoDir, `${sanitizedUrl}.mp4`);
      const finalVideoPath = path.join(finalVideoDir, `${sanitizedUrl}.mp4`);

      // Generate video
      await this.generateVideo(screenshotDir, tempVideoPath, fps);

      // Atomically move video to final location
      await this.moveVideoToFinalLocation(tempVideoPath, finalVideoPath);

      // Cleanup temporary directories
      await this.cleanup(screenshotDir, tempVideoDir);

      this.logger.urlComplete(urlIndex, finalVideoPath);

      return {
        url,
        index: urlIndex,
        videoPath: finalVideoPath,
        success: true
      };

    } catch (error) {
      // Cleanup on failure
      await this.cleanup(screenshotDir, tempVideoDir);
      
      this.logger.urlError(urlIndex, url, error);
      throw new Error(`URL index ${urlIndex} (${url}) failed: ${error.message}`);
    }
  }

  /**
   * Moves video from temp location to final location atomically
   * @param {string} tempPath - Temporary video path
   * @param {string} finalPath - Final video path
   * @returns {Promise<void>}
   */
  async moveVideoToFinalLocation(tempPath, finalPath) {
    const fs = require('fs').promises;
    
    try {
      await fs.rename(tempPath, finalPath);
      this.logger.debug(`Video moved: ${tempPath} -> ${finalPath}`);
    } catch (error) {
      // If rename fails, try copy and delete
      this.logger.warn(`Rename failed, trying copy: ${error.message}`);
      await fs.copyFile(tempPath, finalPath);
      await fs.unlink(tempPath);
      this.logger.debug(`Video copied and original deleted: ${finalPath}`);
    }
  }

  /**
   * Cleans up temporary directories
   * @param {...string} directories - Directories to clean up
   * @returns {Promise<void>}
   */
  async cleanup(...directories) {
    const cleanupPromises = directories.map(dir => 
      removeDirectory(dir).catch(error => 
        this.logger.warn(`Cleanup failed for ${dir}: ${error.message}`)
      )
    );
    
    await Promise.all(cleanupPromises);
  }
}

module.exports = VideoProcessor;
