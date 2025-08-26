import { openBrowser, renderMedia, selectComposition } from '@remotion/renderer';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
export const POST = async (request: NextRequest) => {
  try {
   
    const {baseVideo, layers} = await request.json();

    const bundleInfoPath = path.join(process.cwd(), 'bundle-info.json');
    if (!fs.existsSync(bundleInfoPath)) {
      throw new Error('Bundle not found. Please run "npm run bundle" first.');
    }

    const bundleInfo = JSON.parse(fs.readFileSync(bundleInfoPath, 'utf8'));
    const bundleLocation = bundleInfo.bundleLocation;

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'overlay-frame',
      inputProps: {baseVideo,layers}
    });

    const timestamp = Date.now();
    const filename = `${'overlay'}-${timestamp}.mp4`;
    const outputLocation = path.join(process.cwd(), 'public', filename);

    const browser = await openBrowser("chrome", {
      chromiumOptions: {
        disableWebSecurity: true,
        gl: "angle",
        enableMultiProcessOnLinux: true,
        
      },

    });
    const chromiumPath = puppeteer.executablePath();
//     const {waitUntilDone, free} = prefetch(url);
// await waitUntilDone();
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      puppeteerInstance: browser,
      browserExecutable: chromiumPath,
      outputLocation,
      inputProps: {baseVideo,layers},
      timeoutInMilliseconds: 180000,
      concurrency: 1,
      onProgress: ({ progress }) => {
        console.log(`Rendering progress: ${(progress * 100).toFixed(1)}%`);
      },
    });

    await browser.close({ silent: true });
    // free();
    return NextResponse.json({ 
      success: true, 
      downloadUrl: `/${filename}`,
      filename,
      message: 'Video rendered successfully!' 
    });

  } catch (error) {
    console.error('Rendering error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to render video' 
      },
      { status: 500 }
    );
  }
};
