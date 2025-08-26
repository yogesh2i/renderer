import { openBrowser, renderMedia, selectComposition } from '@remotion/renderer';
import {prefetch} from 'remotion';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
export const POST = async (request: NextRequest) => {
  try {
    const { 
      url, 
      compositionId, 
      fps, 
      durationInSeconds,
      slowMotionFactor = 0.25 
    } = await request.json();
    
    if (!url || !compositionId) {
      return NextResponse.json({ error: 'URL and compositionId required' }, { status: 400 });
    }

    
    const captureFps = Math.round(fps * slowMotionFactor); 
    const outputFps = fps; // Output at requested fps
    const captureFrames = Math.round(captureFps * durationInSeconds); 
    
    // Prepare input props for Remotion composition
    const inputProps = { 
      url, 
      fps: captureFps,  
      durationInFrames: captureFrames, // More frames to capture content
      loadTimeoutMs: 0
    };

    const bundleInfoPath = path.join(process.cwd(), 'bundle-info.json');
    if (!fs.existsSync(bundleInfoPath)) {
      throw new Error('Bundle not found. Please run "npm run bundle" first.');
    }

    const bundleInfo = JSON.parse(fs.readFileSync(bundleInfoPath, 'utf8'));
    const bundleLocation = bundleInfo.bundleLocation;

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    const timestamp = Date.now();
    const filename = `${compositionId}-${timestamp}.mp4`;
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
      inputProps,
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
      actualFps: outputFps,
      capturedFrames: captureFrames,
      slowMotionFactor,
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