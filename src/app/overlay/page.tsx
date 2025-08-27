// 'use client'
// import React from 'react';
// import RemotionPlayer from '../../remotion/RemotionPlayer';
// import { VideoOverlayComposition } from '../../components/VideoOverlayComposition';

// const Page: React.FC = () => {
//   return (
//     <div className="w-6xl mx-auto mt-8 p-6">
//       <h2 className="text-2xl font-semibold mb-6">Video Overlay</h2>
      
//       <div className="w-auto h-[500px] bg-black rounded-lg p-4">
//         <RemotionPlayer
//           component={VideoOverlayComposition}
//           durationInFrames={1200} 
//           fps={30}
//         />
//       </div>
//     </div>
//   );
// };

// export default Page;
'use client'
import React, { useState, useEffect } from 'react';
import RemotionPlayer from '../../remotion/RemotionPlayer';
import { VideoOverlayComposition } from '../../components/VideoOverlayComposition';

interface VideoData {
  media_url: string;
  start_frame: number;
  end_frame: number;
  videoUrl?: string | null;
  isConverted?: boolean;
}

const defaultData = {
  base_url: "https://d2ra5fstrqw46p.cloudfront.net/videos/1755001474_6631.mp4",
  videos: [
    {
      media_url: "https://project-career-crossroads-animation-344.magicpatterns.app/",
      start_frame: 139,
      end_frame: 339
    },
    {
      media_url: "https://project-vinod-khosla-interview-component-123.magicpatterns.app/",
      start_frame: 561,
      end_frame: 761
    },
    {
      media_url: "https://project-animated-technological-timeline-215.magicpatterns.app/",
      start_frame: 937,
      end_frame: 1137
    },
    {
      media_url: "https://project-split-screen-evolution-animation-413.magicpatterns.app/",
      start_frame: 1470,
      end_frame: 1670
    },
    {
      media_url: "https://project-vintage-to-smart-tv-transition-animation-278.magicpatterns.app/",
      start_frame: 2019,
      end_frame: 2219
    },
    {
      media_url: "https://project-water-tap-overflow-animation-874.magicpatterns.app/",
      start_frame: 2871,
      end_frame: 3071
    },
    {
      media_url: "https://project-ai-workforce-progress-animation-882.magicpatterns.app/",
      start_frame: 4073,
      end_frame: 4273
    },
    {
      media_url: "https://project-ai-driven-time-progression-animation-346.magicpatterns.app/",
      start_frame: 4824,
      end_frame: 5024
    }
  ]
};

const Page: React.FC = () => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  // URL conversion states
  const [videosWithConverted, setVideosWithConverted] = useState<VideoData[]>([]);
  const [isConverting, setIsConverting] = useState(true);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Convert URLs on component mount
  useEffect(() => {
    convertUrls();
  }, []);

  const convertUrls = async () => {
    setIsConverting(true);
    setConversionError(null);

    try {
      const response = await fetch('/api/iframeToVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: defaultData.videos.map((video) => video.media_url),
          duration: 10
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Conversion successful:', result);
        
        // Update videos with converted video URLs
        const updatedVideos = defaultData.videos.map((video) => {
          // Find matching converted video by original URL
          const convertedVideo = result.results.find((convertedVid: any) => 
            convertedVid.originalUrl === video.media_url
          );
          
          return {
            ...video,
            videoUrl: convertedVideo ? convertedVideo.videoUrl : null,
            isConverted: !!convertedVideo
          };
        });
        
        setVideosWithConverted(updatedVideos);
        
        const allConverted = updatedVideos.every((video) => video.isConverted);
        console.log(`📊 Conversion status: ${allConverted ? 'All converted' : 'Some failed'}`);
        
      } else {
        console.error('❌ Conversion failed:', result.error);
        setConversionError(result.error);
      }
    } catch (error) {
      console.error('❌ API call failed:', error);
      setConversionError('Failed to convert URLs');
    } finally {
      setIsConverting(false);
    }
  };

  const handleRender = async () => {
    setIsRendering(true);
    setRenderError(null);
    console.log(defaultData.base_url);
    console.log(videosWithConverted);
    try {
      const response = await fetch('/api/overlay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseVideo: { url: defaultData.base_url }, 
          layers: videosWithConverted
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRenderedVideoUrl(data.downloadUrl);
        setFilename(data.filename);
      } else {
        setRenderError(data.error || 'Render failed');
      }
    } catch (error) {
      setRenderError('Failed to render video');
      console.error('Render error:', error);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <h2 className="text-2xl font-semibold mb-6">Video Overlay</h2>
      
      {/* Conversion Status */}
      {isConverting && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded">
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span>Converting URLs to videos...</span>
          </div>
        </div>
      )}

      {conversionError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <div className="flex justify-between items-center">
            <div className="flex">
              <span className="text-red-500 mr-3">❌</span>
              <span>Conversion Error: {conversionError}</span>
            </div>
            <button
              onClick={convertUrls}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
     
      {/* Render Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleRender}
          disabled={isRendering}
          className={`px-8 py-4 rounded-lg font-medium text-white text-lg ${
            isRendering 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 transition-colors'
          }`}
        >
          {isRendering ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Rendering Video...</span>
            </div>
          ) : (
            '🎬 Render Final Video'
          )}
        </button>
      </div>

      {/* Error Message */}
      {renderError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                <strong>Render Error:</strong> {renderError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rendered Video */}
      {renderedVideoUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-green-800">✅ Video Rendered Successfully!</h3>
     
            <video 
              src={renderedVideoUrl} 
              controls 
              className="rounded"
            >
              Your browser does not support the video tag.
            </video>
          <div className="flex flex-wrap gap-3">
            <a
              href={renderedVideoUrl}
              download={filename || 'video-overlay.mp4'}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📥 Download {filename}
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + renderedVideoUrl);
                alert('Video URL copied to clipboard!');
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              📋 Copy Full URL
            </button>
            <button
              onClick={() => {
                setRenderedVideoUrl(null);
                setFilename(null);
                setRenderError(null);
              }}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              🔄 Render New
            </button>
          </div>
          
          {/* File info */}
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>File:</strong> {filename}</p>
            <p><strong>Path:</strong> {renderedVideoUrl}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;