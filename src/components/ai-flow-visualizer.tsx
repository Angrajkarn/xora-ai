
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileInput, Fingerprint, BrainCircuit, Bot, Moon, Wind, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';

const nodes = [
  { id: 'prompt', label: '1. Prompt Input', icon: FileInput, position: 'top-1/2 left-[5%] -translate-y-1/2', content: `How do I write a great blog post?` },
  { id: 'router', label: '2. Smart Router', icon: Fingerprint, position: 'top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2', content: 'Analyzing prompt...' },
  { id: 'gemini', label: 'Gemini', icon: BrainCircuit, position: 'top-[15%] left-2/3 -translate-x-1/2', color: 'text-blue-400' },
  { id: 'chatgpt', label: 'ChatGPT', icon: Bot, position: 'top-[38%] left-2/3 -translate-x-1/2', color: 'text-green-400' },
  { id: 'claude', label: 'Claude', icon: Moon, position: 'top-[62%] left-2/3 -translate-x-1/2', color: 'text-purple-400' },
  { id: 'mistral', label: 'Mistral', icon: Wind, position: 'top-[85%] left-2/3 -translate-x-1/2', color: 'text-orange-400' },
  { id: 'response', label: '3. Unified Response', icon: Sparkles, position: 'top-1/2 right-[5%] -translate-y-1/2', content: `• Start with a strong hook.\n• Use clear headings.\n• Conclude with a CTA.` },
];

const edges = [
  { from: 'prompt', to: 'router', delay: 0.5 },
  { from: 'router', to: 'gemini', delay: 1 },
  { from: 'router', to: 'chatgpt', delay: 1.2 },
  { from: 'router', to: 'claude', delay: 1.4 },
  { from: 'router', to: 'mistral', delay: 1.6 },
  { from: 'gemini', to: 'response', delay: 2 },
  { from: 'chatgpt', to: 'response', delay: 2.2 },
  { from: 'claude', to: 'response', delay: 2.4 },
  { from: 'mistral', to: 'response', delay: 2.6 },
];

const Node = ({ id, label, icon: Icon, position, content, color }: { id: string, label: string, icon: React.ElementType, position: string, content?: string, color?: string }) => (
  <motion.div
    id={id}
    className={`absolute z-10 ${position}`}
    variants={{
      hidden: { opacity: 0, scale: 0.5 },
      visible: { opacity: 1, scale: 1 },
    }}
    whileHover={{ scale: 1.05, zIndex: 20, transition: { duration: 0.2 } }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <Card className={cn("flex flex-col items-center justify-center p-3 sm:p-4 gap-2 w-36 sm:w-44 text-center glassmorphic hover:border-primary/50 transition-colors", color)}>
      <div className={cn("bg-primary/10 p-2 rounded-lg border border-primary/20", color && "bg-current/10 border-current/20")}>
        <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6 text-primary", color && "text-current")} />
      </div>
      <p className="text-xs sm:text-sm font-medium font-headline">{label}</p>
      {content && <p className="text-[10px] text-muted-foreground whitespace-pre-wrap">{content}</p>}
    </Card>
  </motion.div>
);

const AnimatedLine = ({ from, to, delay }: { from?: {x: number, y: number}, to?: {x: number, y: number}, delay: number }) => {
  if (!from || !to) return null;

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 0.8, ease: 'easeInOut', delay } },
  };

  const pulseVariants = {
    hidden: { pathLength: 0, pathOffset: 1, opacity: 0},
    visible: { 
        pathLength: 0.1, 
        pathOffset: [1, 0], 
        opacity: [0, 1, 1, 0],
        transition: { duration: 1.5, ease: 'linear', delay: delay + 0.5, repeat: Infinity, repeatDelay: 2 } 
    }
  }
  
  const fromX = from.x;
  const fromY = from.y;
  const toX = to.x;
  const toY = to.y;

  const d = `M ${fromX} ${fromY} C ${fromX + (toX - fromX) * 0.4} ${fromY}, ${fromX + (toX - fromX) * 0.6} ${toY}, ${toX} ${toY}`;

  return (
    <>
        <motion.path
            d={d}
            stroke="hsl(var(--primary) / 0.2)"
            strokeWidth="2"
            fill="none"
            variants={pathVariants}
        />
        <motion.path
            d={d}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            variants={pulseVariants}
            style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary)))' }}
        />
    </>
  );
};

export const AIFlowVisualizer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number, y: number }>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const calculatePositions = useCallback(() => {
    if (containerRef.current) {
        const positions: Record<string, { x: number, y: number }> = {};
        const containerRect = containerRef.current.getBoundingClientRect();

        nodes.forEach(node => {
            const el = document.getElementById(node.id);
            if (el) {
            const rect = el.getBoundingClientRect();
            positions[node.id] = {
                x: rect.left + rect.width / 2 - containerRect.left,
                y: rect.top + rect.height / 2 - containerRect.top,
            };
            }
        });
        setNodePositions(positions);
    }
  }, []);
  
  useEffect(() => {
    if (isClient && isInView) {
        // A small delay to ensure DOM is fully painted before measuring
        const timeoutId = setTimeout(() => {
            calculatePositions();
            window.addEventListener('resize', calculatePositions);
        }, 100); 

        return () => {
            window.removeEventListener('resize', calculatePositions);
            clearTimeout(timeoutId);
        };
    }
  }, [isClient, isInView, calculatePositions]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className="relative w-full max-w-6xl mx-auto h-[550px] sm:h-[650px]"
    >
      <div className="absolute inset-0 bg-transparent bg-[linear-gradient(to_right,hsl(var(--border)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_20%,transparent_100%)]"></div>
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        <motion.g variants={containerVariants}>
          {isClient && edges.map((edge, i) => (
            <AnimatedLine key={i} from={nodePositions[edge.from]} to={nodePositions[edge.to]} delay={edge.delay} />
          ))}
        </motion.g>
      </svg>
      {nodes.map(node => (
        <Node key={node.id} {...node} />
      ))}
    </motion.div>
  );
};
