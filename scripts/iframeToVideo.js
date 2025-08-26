/**
 * Modularized iframe to video converter
 * Main orchestration file that uses separate modules for different concerns
 */

// Import modules
const configModule = require('./modules/config');
const BatchProcessor = require('./modules/batchProcessor');
const fileUtilsModule = require('./modules/fileUtils');

/**
 * Main function - orchestrates the conversion process
 */
async function main() {
  const startTime = new Date();
  
  try {
    console.log('🎬 Starting modular iframe to video conversion...');
    
    // Parse input configuration using config module functions
    const { urls, duration, outputDir, inputFile } = configModule.parseInput();
    
    // Setup directories
    configModule.setupDirectories(outputDir);
    
    // Create configuration object
    const config = configModule.createConfig(urls, duration, outputDir);
    config.inputFile = inputFile; // Add input file for API mode detection
    
    console.log(`🚀 Processing ${urls.length} URLs with ${duration}s duration`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`🔄 Max concurrent: ${config.MAX_CONCURRENT}`);
    
    // Format URLs for batch processor (each URL needs duration)
    const formattedUrls = urls.map(url => ({
      url: url,
      duration: duration
    }));
    
    // Initialize batch processor (BatchProcessor is a class)
    const batchProcessor = new BatchProcessor(config);
    
    // Process all URLs
    const { results, errors } = await batchProcessor.processBatch(formattedUrls);
    
    // Generate final report
    const report = batchProcessor.generateReport(results, errors, startTime);
    
    // Write results to file if running from API
    if (inputFile) {
      const path = require('path');
      const outputPath = path.join(path.dirname(inputFile), 'conversion-results.json');
      
      // Format results for API compatibility
      const apiResults = [
        ...results.map(r => ({ 
          ...r, 
          success: true,
          filename: r.videoUrl // API expects 'filename' property
        })),
        ...errors.map(e => ({ ...e, success: false }))
      ];
      
      await fileUtilsModule.writeJSONResults(apiResults, outputPath);
    }
    
    // Final summary
    console.log('\n✅ Script completed successfully');
    console.log(`📊 Final: ${results.length} successful, ${errors.length} failed`);
    
    return report;
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    throw error;
  }
}

/**
 * Entry point - run the main function
 */
main()
  .then((report) => {
    console.log('\n🎉 All conversions completed!');
    console.log(`📈 Success rate: ${report.summary.successful}/${report.summary.total} (${Math.round(report.summary.successful / report.summary.total * 100)}%)`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });

/* 
=== COMMENTED OUT ORIGINAL CODE ===
The following functions have been moved to separate modules:

// recordWebsiteDirect -> modules/recorder.js (Recorder class)
// trimVideoSimple -> modules/videoProcessor.js (VideoProcessor functions)
// waitForVideoFile -> modules/fileUtils.js (FileUtils functions)
// convertUrlDirect -> modules/batchProcessor.js (BatchProcessor class)
// processUrls -> modules/batchProcessor.js (BatchProcessor class)

Original monolithic structure was:
1. Configuration and input parsing (55 lines) -> modules/config.js
2. recordWebsiteDirect function (110 lines) -> modules/recorder.js
3. trimVideoSimple function (60 lines) -> modules/videoProcessor.js
4. waitForVideoFile function (35 lines) -> modules/fileUtils.js
5. convertUrlDirect function (30 lines) -> modules/batchProcessor.js
6. processUrls main loop (70 lines) -> modules/batchProcessor.js

Module Structure:
- config.js: Exports object with functions (parseInput, setupDirectories, createConfig)
- batchProcessor.js: Exports class (BatchProcessor)
- recorder.js: Exports class (Recorder)
- fileUtils.js: Exports object with functions (waitForVideoFile, writeJSONResults, etc.)
- videoProcessor.js: Exports object with functions (processVideo, getVideoDuration, etc.)

Benefits of modularization:
- Single Responsibility Principle: Each module handles one specific concern
- Easier testing: Each module can be unit tested independently
- Better maintenance: Changes to recording logic don't affect video processing
- Reusability: Modules can be used in other scripts
- Clearer dependencies: Import only what you need
- Better error handling: Errors are contained within modules
*/
