'use client'
import { Composition } from "remotion";
import { IframeContainer } from "./IframeContainer";
import { VideoOverlayComposition } from "../components/VideoOverlayComposition";

export const RootComponent = () => {
  return (
    <>
      <Composition
        component={IframeContainer}
        width={1280}
        height={720}
       calculateMetadata={({props}) => {
           const fps = typeof props?.fps === 'number' ? props.fps : 30;
           const durationInFrames = typeof props?.durationInFrames === 'number' ? props.durationInFrames : 300;
           return {
             fps,
             durationInFrames: durationInFrames,
           };
       }}
       
        id="iframe-container"
       
      />
      <Composition
        component={VideoOverlayComposition}
        width={1080}
        height={1920}
        id="overlay-frame"
        calculateMetadata={({props}) => {
          const fps = 30;  // Match the fps used in VideoOverlayComposition
          const width = typeof props?.width === 'number' ? props.width : 1080;
          const height = typeof props?.height === 'number' ? props.height : 1920;
          const duration = typeof props?.duration === 'number' ? props.duration : 10;
          const durationInFrames = Math.round(duration * fps);
          
          console.log(`📐 Composition metadata: ${width}x${height}, ${duration}s (${durationInFrames} frames)`);
          
          return {
            fps,
            width,
            height,
            durationInFrames,
          };
        }}
      /> 
    </>
  );
};