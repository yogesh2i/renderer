/**
 * Utility functions for video processing
 * Common helper functions used across the application
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Sanitizes URL for use as filename
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string');
  }
  
  return url
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length
}

/**
 * Generates unique identifier
 * @param {number} length - Length of random part (default: 8)
 * @returns {string} Unique identifier
 */
function generateUniqueId(length = 8) {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
  return `${timestamp}_${randomBytes}`;
}

/**
 * Ensures directory exists, creates if it doesn't
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureDirectory(dirPath) {
  if (!dirPath) {
    throw new Error('Directory path is required');
  }
  
  try {
    await fs.promises.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Safely removes directory and all contents
 * @param {string} dirPath - Directory path to remove
 * @returns {Promise<void>}
 */
async function removeDirectory(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return;
  }
  
  try {
    await fs.promises.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Log warning but don't fail the operation
    console.warn(`Warning: Could not remove directory ${dirPath}:`, error.message);
  }
}

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates array of URLs
 * @param {Array<string>} urls - URLs to validate
 * @returns {Object} Validation result
 */
function validateUrls(urls) {
  if (!Array.isArray(urls)) {
    return { valid: false, error: 'URLs must be an array' };
  }
  
  if (urls.length === 0) {
    return { valid: false, error: 'URLs array cannot be empty' };
  }
  
  const invalidUrls = [];
  urls.forEach((url, index) => {
    if (!isValidUrl(url)) {
      invalidUrls.push({ index, url });
    }
  });
  
  if (invalidUrls.length > 0) {
    return { 
      valid: false, 
      error: `Invalid URLs found`,
      invalidUrls 
    };
  }
  
  return { valid: true };
}

/**
 * Calculates total frames for given duration and FPS
 * @param {number} duration - Duration in seconds
 * @param {number} fps - Frames per second
 * @returns {number} Total frames
 */
function calculateTotalFrames(duration, fps) {
  if (typeof duration !== 'number' || typeof fps !== 'number') {
    throw new Error('Duration and FPS must be numbers');
  }
  
  if (duration <= 0 || fps <= 0) {
    throw new Error('Duration and FPS must be positive numbers');
  }
  
  return Math.ceil(duration * fps);
}

/**
 * Calculates frame budget for CDP advance
 * @param {number} fps - Frames per second
 * @returns {number} Budget in milliseconds
 */
function calculateFrameBudget(fps) {
  if (typeof fps !== 'number' || fps <= 0) {
    throw new Error('FPS must be a positive number');
  }
  
  return Math.round(1000 / fps);
}

/**
 * Creates a retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Function} Function that retries on failure
 */
function withRetry(fn, options = {}) {
  const { maxAttempts = 3, delay = 1000, backoffFactor = 2 } = options;
  
  return async function(...args) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const waitTime = delay * Math.pow(backoffFactor, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };
}

/**
 * Creates a timeout promise that rejects after specified time
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} message - Error message
 * @returns {Promise} Promise that rejects on timeout
 */
function createTimeout(timeoutMs, message = 'Operation timed out') {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeoutMs);
  });
}

/**
 * Races a promise against a timeout
 * @param {Promise} promise - Promise to race
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} message - Timeout error message
 * @returns {Promise} Promise that resolves with result or rejects on timeout
 */
function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    createTimeout(timeoutMs, message)
  ]);
}

/**
 * Formats file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Gets file stats including size
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} File stats
 */
async function getFileStats(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      size: stats.size,
      formattedSize: formatFileSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    throw new Error(`Could not get file stats for ${filePath}: ${error.message}`);
  }
}

module.exports = {
  sanitizeUrl,
  generateUniqueId,
  ensureDirectory,
  removeDirectory,
  isValidUrl,
  validateUrls,
  calculateTotalFrames,
  calculateFrameBudget,
  withRetry,
  withTimeout,
  createTimeout,
  formatFileSize,
  getFileStats
};
