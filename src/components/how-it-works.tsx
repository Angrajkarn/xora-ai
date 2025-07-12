
'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Command, MessageSquare, Bot, BrainCircuit, Moon, Sparkles, Copy, Star, Share2 } from 'lucide-react';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const steps = [
  {
    icon: Command,
    title: '1. Summon Your AI',
    description: 'Press `/` or `⌘+K` to open the command palette and access all AI models and actions instantly.',
    content: (
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex items-center gap-2 p-2 px-4 border rounded-full bg-background/50">
          <span className="text-2xl font-light text-muted-foreground">/</span>
          <span className="font-semibold">Summ</span>
          <span className="w-0.5 h-6 bg-primary animate-pulse" />
        </div>
      </div>
    ),
  },
  {
    icon: Sparkles,
    title: '2. Assemble Your Team',
    description: 'Select from a wide range of top-tier AI models, or let our Smart Router pick the best one for your task.',
    content: (
      <div className="grid w-full h-full grid-cols-2 grid-rows-2 gap-4">
        {[
          { name: 'ChatGPT', icon: Bot, color: 'text-green-400' },
          { name: 'Gemini', icon: BrainCircuit, color: 'text-blue-400' },
          { name: 'Claude', icon: Moon, color: 'text-purple-400' },
          { name: 'Smart AI', icon: Sparkles, color: 'text-yellow-400' },
        ].map((model, i) => (
          <motion.div
            key={model.name}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            viewport={{ once: true, amount: 0.5 }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-card/50 glassmorphic",
              i === 3 && "border-2 border-primary"
            )}
          >
            <model.icon className={cn("w-8 h-8", model.color)} />
            <span className="text-sm font-semibold">{model.name}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: MessageSquare,
    title: '3. Witness the Synthesis',
    description: 'Get responses from multiple models simultaneously. Compare outputs side-by-side to find the best one.',
     content: (
      <div className="flex flex-col w-full h-full gap-2">
        <div className="p-3 rounded-lg bg-primary/10">
          <p className="text-xs">"Explain quantum computing in simple terms."</p>
        </div>
        <div className="flex-grow p-3 text-xs rounded-lg glassmorphic">
          <p className="font-bold text-primary">ChatGPT:</p>
          <p className="text-muted-foreground">"Imagine a light switch that can be both on and off at the same time..."</p>
        </div>
        <div className="flex-grow p-3 text-xs rounded-lg glassmorphic">
          <p className="font-bold text-primary">Gemini:</p>
          <p className="text-muted-foreground">"It's like having a library where a book can be on every page simultaneously..."</p>
        </div>
      </div>
    ),
  },
   {
    icon: Star,
    title: '4. Capture Brilliance',
    description: 'Keep your best ideas. Save, star, and organize your conversations into projects and workspaces.',
    content: (
       <div className="flex items-center justify-center w-full h-full gap-4">
        <Button variant="ghost" size="icon" className="w-16 h-16 rounded-full glassmorphic"><Copy className="w-6 h-6" /></Button>
        <Button variant="ghost" size="icon" className="w-20 h-20 rounded-full glassmorphic border-2 border-primary"><Star className="w-8 h-8 text-primary" /></Button>
        <Button variant="ghost" size="icon" className="w-16 h-16 rounded-full glassmorphic"><Share2 className="w-6 h-6" /></Button>
      </div>
    ),
  },
];

const StepCard = ({ step, index }: { step: typeof steps[0], index: number }) => (
  <Card className="relative flex-shrink-0 w-[90vw] md:w-[45vw] lg:w-[30vw] h-[400px] snap-center overflow-hidden glassmorphic shadow-2xl">
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
          <step.icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold font-headline">{step.title}</h3>
        </div>
      </div>
      <p className="mb-6 text-muted-foreground">{step.description}</p>
      <div className="flex-grow w-full h-full p-4 border rounded-lg bg-background/30 border-border/50">
        {step.content}
      </div>
    </div>
  </Card>
);

export function HowItWorks() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: scrollRef });

  const progressWidth = useTransform(scrollXProgress, [0, 1], ['0%', '100%']);

  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
      <div className="container px-4 mx-auto md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">How Xora Works</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
            A seamless workflow to supercharge your productivity. From prompt to perfection in four simple steps.
          </p>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex w-full gap-8 pb-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar"
          >
            {steps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
          </div>
          <div className="w-full h-1 mt-8 rounded-full bg-muted/50">
            <motion.div
              className="h-1 rounded-full bg-primary"
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
