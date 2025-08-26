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
        width={1280}
        height={720}
        fps={30}
        durationInFrames={900}
        id="overlay-frame"
       
      /> 
    </>
  );
};