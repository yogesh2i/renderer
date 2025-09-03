#!/usr/bin/env node
/**
 * CLI wrapper for Video Converter SDK
 * Handles JSON input from file or stdin and outputs JSON result
 */

const VideoConverterSDK = require('./index');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  try {
    const args = process.argv.slice(2);
    let inputJSON;

    console.log('🎬 Video Converter SDK CLI');
    console.log('==========================');

    // Parse input - either from file or stdin
    if (args.length > 0) {
      // Read from file
      const inputFile = args[0];
      console.log(`📄 Reading input from: ${inputFile}`);
      const inputContent = await fs.readFile(inputFile, 'utf-8');
      inputJSON = JSON.parse(inputContent);
    } else {
      // Read from stdin (for GitHub Actions)
      console.log('📄 Reading input from stdin...');
      const chunks = [];
      process.stdin.on('data', chunk => chunks.push(chunk));
      
      await new Promise((resolve) => {
        process.stdin.on('end', resolve);
      });
      
      const inputContent = Buffer.concat(chunks).toString();
      if (!inputContent.trim()) {
        throw new Error('No input provided. Please provide JSON input via file or stdin.');
      }
      inputJSON = JSON.parse(inputContent);
    }

    console.log(`📊 Processing ${inputJSON.videos?.length || 0} videos...`);
    
    // Create SDK instance with GitHub Actions optimized config
    const sdk = new VideoConverterSDK({
      outputDir: './public/converted-videos',
      tempDir: './temp',
      screenshotDir: './temp/screenshots',
      fps: 30,
      duration: 10,
      timeout: 300000, // 5 minutes timeout for CI
      budgetMultiplier: 1,
      baseUrl: inputJSON.base_url || 'http://localhost:3000'
    });

    // Process the conversion
    console.log('🚀 Starting video conversion...');
    const startTime = Date.now();
    
    const result = await sdk.convert(inputJSON);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Conversion completed in ${duration.toFixed(2)}s`);

    // Cleanup SDK resources
    await sdk.cleanup();

    // Output result as JSON
    console.log('📤 Output JSON:');
    console.log(JSON.stringify(result, null, 2));

    // For GitHub Actions, also write to output file
    if (process.env.GITHUB_ACTIONS) {
      const outputFile = process.env.OUTPUT_FILE || './output.json';
      await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
      console.log(`📁 Output saved to: ${outputFile}`);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ CLI Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Output error in JSON format for consistent parsing
    const errorOutput = {
      error: true,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Error Output JSON:');
    console.log(JSON.stringify(errorOutput, null, 2));
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();
