import React from 'react';
// import { SimpleAnimation } from '@/components/SimpleAnimation';
import RemotionPlayer from '@/remotion/RemotionPlayer';
import { DownloadButton } from '@/components/DownloadButton';
import { IframeContainer } from '@/remotion/IframeContainer';
import { RemotionSyncedAnimation } from '@/components/RemotionAnimation';
import { VideoRenderInterface } from '@/components/VideoRendererInterface';

export default function Home() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center p-4 gap-6">
     <VideoRenderInterface/>
    </div>
  );
}
