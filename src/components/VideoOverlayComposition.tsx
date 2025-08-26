'use client'
import React, { useEffect } from 'react';
import { Video, AbsoluteFill, Sequence, OffthreadVideo, prefetch } from 'remotion';

interface LayerData {
  url: string;
  start: number;
  duration: number;
  videoUrl?: string | null;
  isConverted?: boolean;
}

interface VideoOverlayCompositionProps {
  layers?: LayerData[];
  baseVideo?: string;
}

// Helper function to calculate frames using your format
const calculateFrames = (
  display: { from: number; to: number },
  fps: number
) => {
  const from = (display.from ) * fps;
  const durationInFrames = (display.to ) * fps - from;
  return { from, durationInFrames };
};

export const VideoOverlayComposition: React.FC<VideoOverlayCompositionProps> = ({ 
  layers,
  baseVideo
}) => {
  const fps = 30;
  

//   const allConverted = layersWithVideos ? layersWithVideos.every((layer: LayerData) => layer.isConverted) : false;
  
//   useEffect(() => {
//     // Prefetch the base video
//     prefetch(defaultData.baseVideo.url);
    
//     // Prefetch video URLs if available, otherwise prefetch original URLs
//     layers.forEach(layer => {
//       if (layer.videoUrl) {
//         prefetch(layer.videoUrl);
//       } else {
//         prefetch(layer.url);
//       }
//     });
//   }, [layers]);
  if(baseVideo){
  return (
    
    <AbsoluteFill>
          <Sequence from={0} durationInFrames={Infinity}>
            <OffthreadVideo
              src={baseVideo.url}
              pauseWhenBuffering={true}
              style={{ 
                width: '100%', 
                height: '100%',
              }}
            />
          </Sequence>
          
          {/* Render all layers - only show when all are converted */}
          {layers.map((layer: LayerData, index: number) => {
            const display = {
              from: layer.start,
              to: (layer.start + layer.duration)
            };
            const { from, durationInFrames } = calculateFrames(display, fps);
            
            return (
              <Sequence 
                key={index}
                from={from} 
                durationInFrames={durationInFrames}
                premountFor={60}
              >
                <Video
                  src={layer.videoUrl!}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Sequence>
            );
          })}
    </AbsoluteFill>
  );
} else{
    return <p>Working on it</p>
}
};
