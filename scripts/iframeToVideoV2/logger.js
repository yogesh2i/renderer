/**
 * Logger utility for video processing
 * Provides structured logging with different levels and formatting
 */

const util = require('util');

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.enableTimestamps = options.enableTimestamps !== false;
    this.enableColors = options.enableColors !== false;
    this.projectId = options.projectId || null;
    
    // Log levels hierarchy
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Colors for different log levels
    this.colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m', // Gray
      reset: '\x1b[0m'
    };
  }

  /**
   * Formats log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {string} Formatted message
   */
  formatMessage(level, message, meta = {}) {
    let formatted = '';
    
    // Add timestamp
    if (this.enableTimestamps) {
      const timestamp = new Date().toISOString();
      formatted += `[${timestamp}] `;
    }

    // Add project ID if available
    if (this.projectId) {
      formatted += `[${this.projectId}] `;
    }

    // Add level with color
    const levelUpper = level.toUpperCase();
    if (this.enableColors) {
      formatted += `${this.colors[level]}${levelUpper.padEnd(5)}${this.colors.reset} `;
    } else {
      formatted += `${levelUpper.padEnd(5)} `;
    }

    // Add message
    formatted += message;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      formatted += ` ${util.inspect(meta, { colors: this.enableColors, depth: 2 })}`;
    }

    return formatted;
  }

  /**
   * Checks if message should be logged based on current level
   * @param {string} level - Message level
   * @returns {boolean} True if should log
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Logs error messages
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  /**
   * Logs warning messages
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  /**
   * Logs info messages
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  /**
   * Logs debug messages
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  /**
   * Logs URL processing start
   * @param {number} urlIndex - URL index
   * @param {string} url - URL being processed
   */
  urlStart(urlIndex, url) {
    this.info(`Processing URL ${urlIndex}: ${url}`);
  }

  /**
   * Logs URL processing completion
   * @param {number} urlIndex - URL index
   * @param {string} videoPath - Path to generated video
   */
  urlComplete(urlIndex, videoPath) {
    this.info(`Completed URL ${urlIndex}: ${videoPath}`);
  }

  /**
   * Logs URL processing failure
   * @param {number} urlIndex - URL index
   * @param {string} url - URL that failed
   * @param {Error} error - Error that occurred
   */
  urlError(urlIndex, url, error) {
    this.error(`Failed URL ${urlIndex} (${url}): ${error.message}`, { 
      stack: error.stack 
    });
  }

  /**
   * Logs screenshot progress
   * @param {number} urlIndex - URL index
   * @param {number} current - Current frame
   * @param {number} total - Total frames
   */
  screenshotProgress(urlIndex, current, total) {
    if (current % 10 === 0 || current === total) { // Log every 10th frame
      this.debug(`URL ${urlIndex}: Screenshot ${current}/${total}`);
    }
  }

  /**
   * Creates a child logger with additional context
   * @param {Object} context - Additional context
   * @returns {Logger} Child logger
   */
  child(context = {}) {
    const childOptions = {
      level: this.level,
      enableTimestamps: this.enableTimestamps,
      enableColors: this.enableColors,
      projectId: context.projectId || this.projectId
    };
    
    return new Logger(childOptions);
  }
}

module.exports = Logger;
