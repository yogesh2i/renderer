// 'use client'
// import React from 'react';
// import { useCurrentFrame, interpolate, useVideoConfig, spring } from 'remotion';

// export const RemotionSyncedAnimation = () => {
//   const frame = useCurrentFrame();
//   const { fps, durationInFrames } = useVideoConfig();
  
//   // Total duration: 60 frames ÷ 10 fps = 6 seconds

//   // Bouncing ball - 2 second cycle, repeats 3 times in 6 seconds
//   const bounceY = interpolate(
//     frame % 20, // 2 seconds = 20 frames at 10fps
//     [0, 10, 20],
//     [0, -200, 0],
//     { extrapolateRight: 'clamp' }
//   );

//   // Rotating square - 3 second cycle, repeats 2 times in 6 seconds  
//   const rotate = interpolate(
//     frame % 30, // 3 seconds = 30 frames at 10fps
//     [0, 30],
//     [0, 360],
//     { extrapolateRight: 'clamp' }
//   );

//   // Sliding text - 4 second cycle, 1.5 times in 6 seconds
//   const slideX = interpolate(
//     frame % 40, // 4 seconds = 40 frames at 10fps
//     [0, 20, 40],
//     [-100, 0, 100],
//     { extrapolateRight: 'clamp' }
//   );

//   // Pulsing circle - 1.5 second cycle, repeats 4 times in 6 seconds
//   const pulseScale = interpolate(
//     frame % 15, // 1.5 seconds = 15 frames at 10fps
//     [0, 7.5, 15],
//     [1, 1.5, 1],
//     { extrapolateRight: 'clamp' }
//   );

//   const pulseOpacity = interpolate(
//     frame % 15,
//     [0, 7.5, 15],
//     [1, 0.5, 1],
//     { extrapolateRight: 'clamp' }
//   );

//   // Background color that changes over full 6 seconds
//   const hue = interpolate(frame, [0, durationInFrames], [0, 360]);

//   return (
//     <div style={{
//       width: '100%',
//       height: '100%',
//       background: `linear-gradient(45deg, hsl(${hue}, 60%, 50%), hsl(${(hue + 180) % 360}, 60%, 60%))`,
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       position: 'relative',
//       overflow: 'hidden'
//     }}>
      
//       {/* Bouncing ball */}
//       <div style={{
//         width: 50,
//         height: 50,
//         background: 'white',
//         borderRadius: '50%',
//         position: 'absolute',
//         top: '10%',
//         left: '10%',
//         transform: `translateY(${bounceY}px)`,
//       }} />

//       {/* Rotating square */}
//       <div style={{
//         width: 80,
//         height: 80,
//         background: 'yellow',
//         position: 'absolute',
//         top: '20%',
//         right: '10%',
//         transform: `rotate(${rotate}deg)`,
//       }} />

//       {/* Sliding text */}
//       <div style={{
//         fontSize: 48,
//         fontWeight: 'bold',
//         color: 'white',
//         textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
//         transform: `translateX(${slideX}vw)`,
//       }}>
//         Hello Remotion!
//       </div>

//       {/* Pulsing circle */}
//       <div style={{
//         width: 100,
//         height: 100,
//         background: 'rgba(255, 255, 255, 0.3)',
//         borderRadius: '50%',
//         position: 'absolute',
//         bottom: '10%',
//         left: '50%',
//         transform: `translateX(-50%) scale(${pulseScale})`,
//         opacity: pulseOpacity,
//       }} />

//       {/* Frame counter */}
//       <div style={{
//         position: 'absolute',
//         top: 20,
//         left: 20,
//         color: 'white',
//         fontSize: 24,
//         fontWeight: 'bold',
//         textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
//       }}>
//         Frame: {frame}/{durationInFrames}
//       </div>
//     </div>
//   );
// };
/**
 * Free Remotion Template Component
 * ---------------------------------
 * This template is free to use in your projects!
 * Credit appreciated but not required.
 *
 * Created by the team at https://www.reactvideoeditor.com
 *
 * Happy coding and building amazing videos! 🎉
 */
/**
 * Free Remotion Template Component
 * ---------------------------------
 * This template is free to use in your projects!
 * Credit appreciated but not required.
 *
 * Created by the team at https://www.reactvideoeditor.com
 *
 * Happy coding and building amazing videos! 🎉
 */

"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const RemotionSyncedAnimation =()=> {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Calculate progress based on frame
  const progress = interpolate(
    frame % 90,
    [0, 90],
    [0, 100],
    {
      extrapolateRight: "clamp",
    }
  );
  
  // Calculate rotation for the loading effect
  const rotation = (frame * 4) % 360;
  
  // Calculate radius and circumference
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Pulse effect
  const pulse = 1 + Math.sin(frame / 10) * 0.05;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "300px",
          height: "300px",
          transform: `scale(${pulse})`,
        }}
      >
        {/* Background circle */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            transform: "rotate(-90deg)",
          }}
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="12"
          />
        </svg>
        
        {/* Progress circle */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            transform: "rotate(-90deg)",
          }}
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
          
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Rotating dots */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <circle
            cx="100"
            cy="20"
            r="8"
            fill="#3b82f6"
          />
        </svg>
        
        {/* Percentage text */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "3rem",
            fontWeight: "bold",
            color: "white",
          }}
        >
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}