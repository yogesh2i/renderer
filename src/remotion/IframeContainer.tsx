// 'use client'
// import { IFrame } from 'remotion';
// import React from 'react';

// export interface IframeContainerProps {
//   url?: string;
//   dynamicSize?: boolean;
// }

// export const IframeContainer: React.FC = ({ url, dynamicSize }: IframeContainerProps) => {


//   return (
//     <IFrame 
//       src={url} 
//       style={{
//         width: '100%',
//         height: '100%',
//       }}
//     />
//   );
// };
'use client'
import { AbsoluteFill, IFrame, prefetch, Sequence } from 'remotion';
import React, { useEffect } from 'react';

export interface IframeContainerProps {
  url?: string;
  dynamicSize?: boolean;
}

export const IframeContainer: React.FC = ({ url, dynamicSize }: IframeContainerProps) => {

  useEffect(()=>{
      if(url){
        prefetch(url);
      }
  },[])
  return (
    <AbsoluteFill>
   <Sequence from={0} durationInFrames={Infinity} premountFor={50}>

    <IFrame 
      src={url} 
      style={{
        width: '100%',
        height: '100%',
      }}
      />
      </Sequence>
      </AbsoluteFill>
  );
};