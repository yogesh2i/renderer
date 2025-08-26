'use client';
import React, { useState } from 'react';
import { useVideoDownload } from '@/hooks/useVideoDownload';
import RemotionPlayer from '@/remotion/RemotionPlayer';
import { IframeContainer } from '@/remotion/IframeContainer';

interface VideoConfig {
  url: string;
  fps: number;
  durationInSeconds: number;
}

export const VideoRenderInterface = () => {
  const { downloadVideo, manualDownload, isRendering, downloadUrl, filename, error } = useVideoDownload();
  
  const [config, setConfig] = useState<VideoConfig>({
    url: '',
    fps: 30,
    durationInSeconds: 10
  });
  
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

  const handleInputChange = (field: keyof VideoConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreview = () => {
    if (config.url) {
      setPreviewUrl(config.url);
      setShowPreview(true);
    }
  };

  const handleRender = async () => {
    setRenderedVideoUrl(null);
    if (!config.url) {
      alert('Please enter a URL');
      return;
    }

    try {
      const result = await downloadVideo(config.url, 'iframe-container', config.durationInSeconds);
      if (result.success) {
        setRenderedVideoUrl(result.url);
      }
    } catch (error) {
      console.error('Render failed:', error);
    }
  };

  const resetForm = () => {
    setConfig({ url: '', fps: 30, durationInSeconds: 10 });
    setShowPreview(false);
    setPreviewUrl('');
    setRenderedVideoUrl(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6  rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8">Website to Video Converter</h1>
      
      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* URL Input */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium  mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={config.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* FPS Input */}
        <div>
          <label className="block text-sm font-medium  mb-2">
            FPS (Frames per Second)
          </label>
          <input
          title='FPS'
            type="number"
            min="5"
            max="600"
            value={config.fps}
            onChange={(e) => handleInputChange('fps', parseInt(e.target.value) || 30)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs  mt-1">Recommended: 24-30</p>
        </div>

        {/* Duration Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Duration (Seconds)
          </label>
          <input
          title='Duration'
            type="number"
            min="1"
            max="120"
            value={config.durationInSeconds}
            onChange={(e) => handleInputChange('durationInSeconds', parseInt(e.target.value) || 10)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs mt-1">5-120 seconds</p>
        </div>

        {/* Calculated Frames */}
        <div>
          <label className="block text-sm font-medium  mb-2">
            Total Frames
          </label>
          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
            {config.fps * config.durationInSeconds}
          </div>
          <p className="text-xs  mt-1">Auto-calculated</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={handlePreview}
          disabled={!config.url}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Preview Website
        </button>
        
        <button
          onClick={handleRender}
          disabled={!config.url || isRendering}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isRendering ? 'Rendering...' : 'Render Video'}
        </button>

        <button
          onClick={resetForm}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Rendering Progress */}
      {isRendering && (
        <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            Rendering your video... This may take a few minutes.
          </div>
        </div>
      )}

      {/* Preview Section */}
      {showPreview && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Website Preview</h2>
          <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '500px' }}>
            <RemotionPlayer
              container={IframeContainer}
              url={previewUrl}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This is how your website will look in the video. Settings: {config.fps} FPS, {config.durationInSeconds}s duration
          </p>
        </div>
      )}

      {/* Rendered Video Section */}
      {renderedVideoUrl && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Rendered Video</h2>
          <div className="bg-black rounded-lg overflow-hidden mb-4">
            <video
              src={renderedVideoUrl}
              controls
              className="w-full"
              style={{ maxHeight: '500px' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={manualDownload}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Download Video
            </button>
            
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                <strong>File:</strong> {filename}<br />
                <strong>Settings:</strong> {config.fps} FPS, {config.durationInSeconds}s, {config.fps * config.durationInSeconds} frames
              </p>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};