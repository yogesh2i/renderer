/**
 * Configuration module for video processing
 * Centralized configuration management with validation
 */

const path = require('path');

// Default configuration
const DEFAULT_CONFIG = {
  // Browser settings
  browser: {
    headless: true, // Set to false for debugging
    args: [
      '--disable-remote-fonts',
      '--font-render-hinting=none',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  },

  // Context settings
  context: {
    viewport: { width: 1080, height: 1920 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },

  // Navigation settings
  navigation: {
    loadingTimeout: 30000,
    navigationTimeout: 60000,
    networkIdleTimeout: 30000
  },

  // Screenshot settings
  screenshot: {
    type: 'png',
    quality: 90,
    timeout: 90000,
    fullPage: false
  },

  // Video encoding settings
  video: {
    codec: 'libx264',
    pixelFormat: 'yuv420p',
    quality: 'medium' // low, medium, high
  },

  // CDP settings
  cdp: {
    maxVirtualTimeTaskStarvationCount: 1000,
    waitForNavigation: true
  },

  // Directory settings
  directories: {
    screenshots: './screenshots',
    output: './public',
    temp: './temp'
  },

  // Processing settings
  processing: {
    defaultDuration: 10,
    defaultFps: 30,
    maxConcurrentUrls: 8,
    retryAttempts: 2,
    retryDelay: 1000
  },

  // Logging
  logging: {
    level: 'info', // error, warn, info, debug
    enableTimestamps: true,
    enableColors: true
  }
};

/**
 * Validates configuration object
 * @param {Object} config - Configuration to validate
 * @throws {Error} If configuration is invalid
 */
function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration must be an object');
  }

  if (config.processing?.defaultFps && config.processing.defaultFps <= 0) {
    throw new Error('FPS must be greater than 0');
  }

  if (config.processing?.defaultDuration && config.processing.defaultDuration <= 0) {
    throw new Error('Duration must be greater than 0');
  }

  if (config.processing?.maxConcurrentUrls && config.processing.maxConcurrentUrls <= 0) {
    throw new Error('Max concurrent URLs must be greater than 0');
  }
}

/**
 * Merges user configuration with defaults
 * @param {Object} userConfig - User provided configuration
 * @returns {Object} Merged configuration
 */
function createConfig(userConfig = {}) {
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // Deep clone
  
  // Deep merge user config
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  const mergedConfig = deepMerge(config, userConfig);
  validateConfig(mergedConfig);
  
  return mergedConfig;
}

/**
 * Gets video quality settings based on quality level
 * @param {string} quality - Quality level (low, medium, high)
 * @returns {Array} FFmpeg output options
 */
function getVideoQualityOptions(quality = 'medium') {
  const qualityMap = {
    low: ['-crf', '28', '-preset', 'fast'],
    medium: ['-crf', '23', '-preset', 'medium'],
    high: ['-crf', '18', '-preset', 'slow']
  };

  return qualityMap[quality] || qualityMap.medium;
}

module.exports = {
  DEFAULT_CONFIG,
  createConfig,
  validateConfig,
  getVideoQualityOptions
};
