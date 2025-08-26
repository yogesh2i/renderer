'use client';
import { useState } from 'react';

export const useVideoDownload = () => {
  const [isRendering, setIsRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadVideo = async (url: string, compositionId: string, duration: number = 60) => {
    setIsRendering(true);
    setDownloadUrl(null);
    setFilename(null);
    setError(null);

    try {
      const response = await fetch('/api/loopRender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({url, duration, compositionId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDownloadUrl(data.downloadUrl);
        setFilename(data.filename);
        
        return { success: true, url: data.downloadUrl };
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to render video';
      setError(errorMessage);
      console.error('Download error:', error);
      throw new Error(errorMessage);
    } finally {
      setIsRendering(false);
    }
  };

  const manualDownload = () => {
    if (downloadUrl && filename) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return {
    downloadVideo,
    manualDownload,
    isRendering,
    downloadUrl,
    filename,
    error,
  };
};
