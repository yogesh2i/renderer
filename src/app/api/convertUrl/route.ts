/**
 * Next.js 15 API Route for URL to Video Conversion
 * Converts web animation URLs to MP4 videos using batch processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { VideoConversionService } from './videoConversionService';

// Types
interface VideoItem {
  media_url: string;
  start_frame: number;
  end_frame: number;
}

interface RequestBody {
  base_url: string;
  videos: VideoItem[];
}

interface ConversionResult {
  url: string;
  video_path: string;
  status: 'success' | 'error';
  error?: string;
}

// Global processor instance for efficiency
let globalProcessor: VideoConversionService | null = null;

/**
 * Gets or creates the global video processor
 */
async function getProcessor(): Promise<VideoConversionService> {
  if (!globalProcessor) {
    globalProcessor = new VideoConversionService();
  }
  return globalProcessor;
}

/**
 * Validates request body structure
 */
function validateRequestBody(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  if (!body.base_url || typeof body.base_url !== 'string') {
    return { valid: false, error: 'base_url is required and must be a string' };
  }

  if (!Array.isArray(body.videos)) {
    return { valid: false, error: 'videos must be an array' };
  }

  for (let i = 0; i < body.videos.length; i++) {
    const video = body.videos[i];
    if (!video.media_url || typeof video.media_url !== 'string') {
      return { valid: false, error: `videos[${i}].media_url is required and must be a string` };
    }
    if (typeof video.start_frame !== 'number' || video.start_frame < 0) {
      return { valid: false, error: `videos[${i}].start_frame must be a non-negative number` };
    }
    if (typeof video.end_frame !== 'number' || video.end_frame <= video.start_frame) {
      return { valid: false, error: `videos[${i}].end_frame must be greater than start_frame` };
    }
  }

  return { valid: true };
}

/**
 * Calculate duration in seconds based on frame range
 */
function calculateDuration(startFrame: number, endFrame: number, baseFps: number = 30): number {
  return Math.max(1, Math.ceil((endFrame - startFrame) / baseFps));
}

/**
 * Get base URL from request headers
 */
async function getBaseUrl(request: NextRequest): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

/**
 * POST /api/convertUrl - Convert URLs to videos
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting video conversion request...');
    
    const body: RequestBody = await request.json();
    console.log(`📝 Processing request with ${body.videos?.length || 0} videos`);
    
    // Validate request body
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validation.error 
        },
        { status: 400 }
      );
    }

    // Get processor instance
    const processor = await getProcessor();
    const baseUrl = await getBaseUrl(request);
    
    console.log(`🔄 Converting ${body.videos.length} URLs...`);
    
    // Use the service to convert URLs
    const result = await processor.convertUrls(body, baseUrl);
    
    console.log(`✅ Successfully processed ${result.videos.length} videos`);
    
    // Update the response format to include conversion metadata
    const updatedVideos = result.videos.map((video: VideoItem, index: number) => {
      return {
        ...video,
        converted_video_url: video.media_url, // The service already updates media_url
        conversion_status: 'success',
        conversion_error: null
      };
    });

    // Response format matching the expected structure
    const response = {
      success: true,
      base_url: body.base_url,
      videos: updatedVideos,
      metadata: {
        total_videos: body.videos.length,
        successful_conversions: result.videos.length,
        failed_conversions: 0,
        processing_time: new Date().toISOString()
      }
    };

    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('💥 API Error:', error);
    
    // Attempt cleanup on error
    if (globalProcessor) {
      try {
        await globalProcessor.cleanup();
      } catch (cleanupError) {
        console.error('🧹 Cleanup failed:', cleanupError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Processing failed', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/convertUrl - Health check and status
 */
export async function GET() {
  const processor = globalProcessor;
  const status = {
    service: 'Video Conversion API',
    status: 'healthy',
    processor_initialized: !!processor,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
  
  return NextResponse.json(status);
}
