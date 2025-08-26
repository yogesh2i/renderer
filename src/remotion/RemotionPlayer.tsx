// 'use client'
// import { Player} from '@remotion/player'
// import React from 'react'

// interface RemotionPlayerProps {
//   container: React.FC;
//     url: string;
// }

// export default function RemotionPlayer({container,url}: RemotionPlayerProps) {
   
//   return (
 

//     <Player
//         component={container}
//         // inputProps={{url}}
//         durationInFrames={60}
//         fps={30}
//         compositionHeight={720}
//         compositionWidth={1280}
//         style={{ width: '100%', height: '100%', borderRadius: 12 }}
//         autoPlay
//         controls
//     />
     
      
//   )
// }
'use client'
import { Player } from '@remotion/player'
import React from 'react'

interface RemotionPlayerProps {
  component: React.FC<any>;
  inputProps?: any;
  durationInFrames?: number;
  fps?: number;
}

export default function RemotionPlayer({
  component,
  inputProps,
  durationInFrames = 300, // 10 seconds default
  fps = 30
}: RemotionPlayerProps) {
   
  return (
    <Player
      component={component}
      inputProps={inputProps}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionHeight={720}
      compositionWidth={1280}
      style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: 12,
        maxWidth: 800,
        maxHeight: 450
      }}
      autoPlay={true}
      controls
      loop
    />
  )
}