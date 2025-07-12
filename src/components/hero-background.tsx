
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';

const NUM_PATHS_LAYER1 = 15;
const NUM_PATHS_LAYER2 = 20;
const DURATION_LAYER1 = 8;
const DURATION_LAYER2 = 10;

const colors = [
  '#a955f7', // primary
  '#0ddaf7', // chart-2
  '#f04f88', // chart-3
  '#facc15', // chart-4
  '#66f066', // chart-5
  '#00BFFF',
  '#FF69B4',
  '#32CD32',
];

const generatePath = (index: number, numLines: number, radius: number) => {
    const angle = (index / numLines) * 2 * Math.PI + Math.PI / 4;
    const startX = 50 + radius * Math.cos(angle);
    const startY = 50 + radius * Math.sin(angle);
    
    const cp1X = 50 + (radius / 1.5) * Math.cos(angle + 0.3);
    const cp1Y = 50 + (radius / 1.5) * Math.sin(angle + 0.3);
    const cp2X = 50 + (radius / 3) * Math.cos(angle - 0.3);
    const cp2Y = 50 + (radius / 3) * Math.sin(angle - 0.3);
    
    const endX = 50;
    const endY = 50;
  
    return `M ${startX},${startY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;
};

export const HeroBackground = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const layer1Paths = useMemo(() => {
    if(!isClient) return [];
    return Array.from({ length: NUM_PATHS_LAYER1 }).map((_, i) => ({
      d: generatePath(i, NUM_PATHS_LAYER1, 40),
      color: colors[i % colors.length]
    }));
  }, [isClient]);
  
  const layer2Paths = useMemo(() => {
    if(!isClient) return [];
    return Array.from({ length: NUM_PATHS_LAYER2 }).map((_, i) => ({
      d: generatePath(i, NUM_PATHS_LAYER2, 48),
      color: colors[(i + 3) % colors.length] // Offset colors for variety
    }));
  }, [isClient]);

  return (
    <div className="absolute inset-0 -z-10 h-full w-full">
       <div className="absolute inset-0 bg-transparent bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_20%,transparent_100%)]"></div>

        {isClient && (
          <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid slice"
          >
              <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
                  </filter>
              </defs>
              <g opacity="0.4">
                  {/* Layer 2 - Outer, slower */}
                  {layer2Paths.map((path, i) => (
                    <motion.path
                        key={`pulse-l2-${i}`}
                        d={path.d}
                        fill="none"
                        stroke={path.color}
                        strokeWidth="0.6"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, pathOffset: 1 }}
                        animate={{ pathLength: [0, 1, 0], pathOffset: [1, 0, 0] }}
                        transition={{
                            duration: DURATION_LAYER2,
                            delay: i * (DURATION_LAYER2 / layer2Paths.length),
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{ filter: 'url(#glow)' }}
                    />
                  ))}
                  {/* Layer 1 - Inner, faster */}
                  {layer1Paths.map((path, i) => (
                    <motion.path
                        key={`pulse-l1-${i}`}
                        d={path.d}
                        fill="none"
                        stroke={path.color}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, pathOffset: 1 }}
                        animate={{ pathLength: [0, 1, 0], pathOffset: [1, 0, 0] }}
                        transition={{
                            duration: DURATION_LAYER1,
                            delay: i * (DURATION_LAYER1 / layer1Paths.length),
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{ filter: 'url(#glow)' }}
                    />
                  ))}
              </g>

               {/* Central hub */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="3"
                    fill="#a955f7"
                    animate={{
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: DURATION_LAYER1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    filter="url(#glow)"
                />
                <circle cx="50" cy="50" r="1.5" fill="#f9fafb" />
          </svg>
        )}
    </div>
  );
};
