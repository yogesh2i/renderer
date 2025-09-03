/**
 * Video Conversion Service
 * Service layer for handling video conversion logic
 */

import path from 'path';
import { promises as fs } from 'fs';

export interface VideoItem {
  media_url: string;
  start_frame: number;
  end_frame: number;
}

export interface ConversionRequest {
  base_url: string;
  videos: VideoItem[];
}

export interface ConversionResponse {
  base_url: string;
  videos: VideoItem[];
  success: boolean;
  metadata: {
    processed_count: number;
    project_id: string;
    processing_time: string;
    base_url: string;
  };
}

export class VideoConversionService {
  private processor: any = null;
  private initialized = false;

  constructor() {
    // Don't initialize in constructor to avoid dynamic imports in Next.js build
  }

  /**
   * Dynamically imports and initializes the video processor
   */
  private initializeProcessor() {
    if (this.processor && this.initialized) return;

    try {
      // Use dynamic import instead of require for Next.js compatibility
      const scriptPath = path.join(process.cwd(), 'scripts', 'iframeToVideoV2', 'iframeToVideoV2.js');
      
      // Check if file exists first
      try {
        require.resolve(scriptPath);
      } catch {
        throw new Error(`Video processor script not found at: ${scriptPath}`);
      }

      // Use eval + require to bypass webpack bundling issues
      const videoModule = eval('require')(scriptPath);
      const { BatchVideoProcessor } = videoModule;
      
      if (!BatchVideoProcessor) {
        throw new Error('BatchVideoProcessor not exported from video script');
      }

      const config = {
        browser: {
          headless: true,
          args: [
            '--disable-remote-fonts',
            '--font-render-hinting=none',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process', // For better Docker compatibility
            '--no-zygote'
          ]
        },
        directories: {
          screenshots: path.join(process.cwd(), 'temp', 'screenshots'),
          output: path.join(process.cwd(), 'public', 'converted-videos'),
          temp: path.join(process.cwd(), 'temp')
        },
        processing: {
          defaultDuration: 10,
          defaultFps: 30,
          maxConcurrentUrls: 4 // Limit concurrent processing
        },
        logging: {
          level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
        }
      };

      this.processor = new BatchVideoProcessor(config);
      this.initialized = true;
      console.log('✅ Video processor initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize video processor:', error);
      throw new Error('Video processor initialization failed');
    }
  }

  /**
   * Ensures required directories exist
   */
  private async ensureDirectories() {
    const dirs = [
      path.join(process.cwd(), 'temp', 'screenshots'),
      path.join(process.cwd(), 'public', 'converted-videos'),
      path.join(process.cwd(), 'temp')
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  /**
   * Calculates video duration from frame range
   */
  private calculateDuration(startFrame: number, endFrame: number, baseFps = 30): number {
    const frameCount = endFrame - startFrame;
    return Math.max(1, Math.ceil(frameCount / baseFps));
  }

  /**
   * Converts URLs to videos in optimized batches
   */
  async convertUrls(request: ConversionRequest, baseUrl: string): Promise<ConversionResponse> {
    // Ensure processor is initialized
    this.initializeProcessor();
    await this.ensureDirectories();
    
    const { base_url, videos } = request;
    const urls = videos.map(v => v.media_url);
    const projectId = `convert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🎬 Starting conversion for ${videos.length} URLs (Project: ${projectId})`);

    try {
      // Process in optimized batches
      const batchSize = Math.min(4, Math.max(1, Math.floor(8 / videos.length))); // Dynamic batch size
      const results: any[] = [];

      for (let i = 0; i < urls.length; i += batchSize) {
        const batchUrls = urls.slice(i, i + batchSize);
        const batchVideos = videos.slice(i, i + batchSize);
        
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)}`);

        // Calculate optimal duration for this batch
        const avgDuration = Math.max(8, Math.round(
          batchVideos.reduce((sum, v) => sum + this.calculateDuration(v.start_frame, v.end_frame), 0) / batchVideos.length
        ));

        const batchResult = await this.processor.processUrlsBatch(batchUrls, {
          projectId: `${projectId}_b${i}`,
          duration: avgDuration,
          fps: 30,
          baseOutputDir: path.join(process.cwd(), 'temp', 'screenshots'),
          basePublicDir: path.join(process.cwd(), 'public', 'converted-videos')
        });

        results.push(...batchResult.results);
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} completed successfully`);
      }

      // Map results back to original format
      const convertedVideos: VideoItem[] = videos.map((video, index) => {
        const result = results[index];
        if (!result || !result.success) {
          throw new Error(`Failed to process video ${index}: ${video.media_url}`);
        }

        // Convert absolute path to URL
        const relativePath = path.relative(
          path.join(process.cwd(), 'public'),
          result.videoPath
        ).replace(/\\/g, '/');

        return {
          ...video,
          media_url: `${baseUrl}/${relativePath}`
        };
      });

      const response: ConversionResponse = {
        base_url,
        videos: convertedVideos,
        success: true,
        metadata: {
          processed_count: results.length,
          project_id: projectId,
          processing_time: new Date().toISOString(),
          base_url: baseUrl
        }
      };

      console.log(`🎉 All conversions completed! Project: ${projectId}`);
      return response;

    } catch (error) {
      console.error(`💥 Conversion failed for project ${projectId}:`, error);
      
      // Attempt cleanup on error
      await this.cleanup();
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Video conversion failed: ${errorMessage}`);
    }
  }

  /**
   * Cleans up resources
   */
  async cleanup(): Promise<void> {
    if (this.processor) {
      try {
        await this.processor.close();
        console.log('🧹 Video processor cleaned up');
      } catch (error) {
        console.warn('⚠️ Cleanup warning:', error);
      } finally {
        this.processor = null;
      }
    }
  }

  /**
   * Gets processor status
   */
  getStatus() {
    return this.processor ? this.processor.getStatus() : {
      isProcessing: false,
      browser: null,
      message: 'Processor not initialized'
    };
  }
}

// Singleton instance for API routes
let serviceInstance: VideoConversionService | null = null;

export function getVideoConversionService(): VideoConversionService {
  if (!serviceInstance) {
    serviceInstance = new VideoConversionService();
  }
  return serviceInstance;
}
