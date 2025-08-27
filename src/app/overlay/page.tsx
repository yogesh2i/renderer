'use client'
import React from 'react';
import { useVideoOverlay } from './hooks/useVideoOverlay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import RenderButton from './components/RenderButton';
import VideoPreview from './components/VideoPreview';


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
  const {
    videosWithConverted,
    isConverting,
    conversionError,
    convertUrls,
    isRendering,
    renderedVideoUrl,
    filename,
    renderError,
    handleRender,
  } = useVideoOverlay(defaultData);

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <h2 className="text-2xl font-semibold mb-6">Video Overlay</h2>
      {/* Conversion Status */}
      {isConverting && <LoadingSpinner text="Converting URLs to videos..." />}
      {conversionError && <ErrorAlert error={conversionError} onRetry={convertUrls} />}
      {/* Render Button */}
      <RenderButton isRendering={isRendering} onClick={handleRender} />
      {/* Error Message */}
      {renderError && <ErrorAlert error={renderError} />}
      {/* Rendered Video */}
      {renderedVideoUrl && (
        <VideoPreview
          renderedVideoUrl={renderedVideoUrl}
          filename={filename}
          onCopy={() => {
            navigator.clipboard.writeText(window.location.origin + renderedVideoUrl);
            alert('Video URL copied to clipboard!');
          }}
          
        />
      )}
    </div>
  );
};

export default Page;