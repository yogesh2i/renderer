// const { chromium } = require('playwright');
// const fs = require('fs');
// const path = require('path');
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffmpeg = require('fluent-ffmpeg');

// ffmpeg.setFfmpegPath(ffmpegPath);

// async function captureScreenshotsToVideo(url, duration = 10, fps = 5, outputDir = './screenshots', videoOut = './output.mp4') {
//   const browser = await chromium.launch();
// const context = await browser.newContext({
//   viewport: { width: 1080, height: 1920 }
// });
// const page = await context.newPage();
//  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
//   // Prepare output directory
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

//   const totalFrames = duration * fps;
//   const interval = 1000 / fps;
//   const screenshotPaths = [];

//   for (let i = 0; i < totalFrames; i++) {
//     const imgPath = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
//     await page.screenshot({ path: imgPath });
//     screenshotPaths.push(imgPath);
//     await page.waitForTimeout(interval);
//   }

//   await browser.close();

//   // Use FFmpeg to create video from images
//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(path.join(outputDir, 'frame_%04d.png'))
//       .inputFPS(fps)
//       .outputOptions(['-r 5', '-c:v libx264', '-pix_fmt yuv420p'])
//       .output(videoOut)
//       .on('end', () => resolve(videoOut))
//       .on('error', reject)
//       .run();
//   });
// }

// // Usage
// captureScreenshotsToVideo('https://project-stock-market-analysis-animation-824.magicpatterns.app/', 10, 5, './screenshots', './output.mp4')
//   .then(videoPath => console.log('Video created at:', videoPath))
//   .catch(console.error);
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

function sanitizeUrl(url) {
  // Remove protocol, replace non-alphanumeric with underscores
  return url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_');
}

async function captureScreenshotsToVideo(url, duration = 10, fps = 5, outputDir = './screenshots', publicDir = './public') {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 }
  });

  const page = await context.newPage();

  console.log("Navigating the page");
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Prepare output directory
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const totalFrames = duration * fps;
  const interval = 100;
  console.log("Taking screenshots...")
  for (let i = 0; i < totalFrames; i++) {
    const imgPath = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: imgPath });
    await page.waitForTimeout(interval);
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
  'https://project-ai-workforce-progress-animation-882.magicpatterns.app/',
  10, // duration in seconds
  60,  // fps
  './screenshots',
  './public'
)
  .then(videoPath => console.log('Video created at:', videoPath))
  .catch(console.error);