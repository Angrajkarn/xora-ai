
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, PenLine, Lightbulb, BrainCircuit, Code } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { PromptSuggestionOutput } from '@/ai/flows/prompt-suggester-flow';
import { Skeleton } from '../ui/skeleton';

interface WelcomeCardProps {
    userName: string;
    onPromptClick: (prompt: string, attachment?: any) => void;
    suggestions: PromptSuggestionOutput['suggestions'] | null;
    isLoading: boolean;
}

export const WelcomeCard = ({ userName, onPromptClick, suggestions, isLoading }: WelcomeCardProps) => {
    
    if (isLoading || !suggestions) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <Skeleton className="w-16 h-16 rounded-full mb-6" />
                 <Skeleton className="h-10 w-80 mb-2" />
                 <Skeleton className="h-5 w-96 mb-8" />
                <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                         <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            className="flex flex-col items-center justify-center h-full text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="p-4 bg-primary/10 rounded-full border border-primary/20 mb-6">
                <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tight mb-2">Hello, {userName}. I'm Xora.</h1>
            <p className="max-w-xl text-muted-foreground mb-8">
                Your AI Ecosystem. How can I help you today?
                <br />
                Select a suggestion below, or type a message to start.
            </p>
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((p, i) => {
                    const IconComponent = (LucideIcons as any)[p.icon] || Sparkles;
                    return (
                        <motion.button 
                            key={i}
                            onClick={() => onPromptClick(p.text, null)}
                            className="p-4 text-left rounded-lg bg-card/50 hover:bg-muted transition-all flex items-start gap-4 border border-border/50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                        >
                            <IconComponent className="mr-1 mt-1 h-5 w-5 text-primary/80 flex-shrink-0" />
                            <span className="font-medium">{p.text}</span>
                        </motion.button>
                    )
                })}
            </div>
        </motion.div>
    );
}
