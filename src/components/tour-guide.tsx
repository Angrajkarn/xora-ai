
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


const tourSteps = [
  {
    step: 1,
    title: 'Welcome to Xora!',
    content: "I'm Sparky, your personal guide. Let's take a quick tour of the platform.",
    position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    path: '/dashboard',
    highlight: null,
    arrow: null,
  },
  {
    step: 2,
    title: 'Navigation Sidebar',
    content: 'This is your mission control. Switch between Chat, Templates, and more from here.',
    position: { top: '25%', left: '280px' },
    highlight: { top: '0px', left: '0px', width: '256px', height: '100vh'},
    arrow: 'left',
    path: '/dashboard',
  },
  {
    step: 3,
    title: 'Quick Search & Actions',
    content: 'Use the search bar (or press ⌘+K) to find anything you need in a flash.',
    position: { top: '80px', right: '280px' },
    highlight: { top: '0px', left: '256px', right: '0px', height: '64px'},
    arrow: 'top-right',
    path: '/dashboard',
  },
   {
    step: 4,
    title: 'AI Chat',
    content: "Now, let's head to the main event. Click on the 'Chat' button in the sidebar.",
    position: { top: '150px', left: '280px' },
    highlight: { top: '132px', left: '8px', width: '240px', height: '40px' },
    arrow: 'left',
    path: '/dashboard',
    waitForNav: '/chat',
  },
  {
    step: 5,
    title: 'The Prompt Input',
    content: 'This is where the magic happens. Type your prompt and let the AI do the work.',
    position: { bottom: '120px', left: '50%', transform: 'translateX(-50%)' },
    highlight: { bottom: '1rem', left: '272px', right: '1rem', height: '70px'},
    arrow: 'bottom',
    path: '/chat',
  },
  {
    step: 6,
    title: 'You are all set!',
    content: "That's the basics! Feel free to explore and create something amazing.",
    position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    path: '/chat',
    highlight: null,
    arrow: null,
  },
];

const TOUR_STORAGE_KEY = 'xora-tour-completed';

export function TourGuide() {
    const [step, setStep] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const isMobile = useIsMobile();

    useEffect(() => {
        if (isMobile) return;
        const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!tourCompleted) {
            setIsOpen(true);
        }
    }, [isMobile]);

    useEffect(() => {
      const currentStepConfig = tourSteps[step];
      if(isOpen && currentStepConfig && currentStepConfig.waitForNav && currentStepConfig.waitForNav === pathname) {
          setStep(s => s + 1);
      }
    }, [pathname, step, isOpen]);


    const closeTour = () => {
        setIsOpen(false);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    };

    const nextStep = () => {
        if (step < tourSteps.length - 1) {
            setStep(s => s + 1);
        } else {
            closeTour();
        }
    };
    
    const currentStepConfig = tourSteps[step];

    if (!isOpen || !currentStepConfig || currentStepConfig.path !== pathname) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                key="tour-backdrop"
                className="fixed inset-0 bg-black/50 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            />
            <div key="tour-content" className="fixed inset-0 z-50 pointer-events-none">
                 <motion.div
                    className="absolute pointer-events-auto"
                    style={currentStepConfig.position}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <div className="relative glassmorphic rounded-lg shadow-2xl w-80">
                        {currentStepConfig.arrow && <div className={cn(
                            "absolute w-4 h-4 bg-card/50 backdrop-blur-lg rotate-45 z-[-1]",
                            {
                                'top-1/2 -left-2 -translate-y-1/2': currentStepConfig.arrow === 'left',
                                'top-1/2 -right-2 -translate-y-1/2': currentStepConfig.arrow === 'right',
                                'left-1/2 -top-2 -translate-x-1/2': currentStepConfig.arrow === 'top',
                                'left-1/2 -bottom-2 -translate-x-1/2': currentStepConfig.arrow === 'bottom',
                                '-top-2 right-4 -translate-x-1/2': currentStepConfig.arrow === 'top-right',
                            }
                        )} />}
                        <div className="p-5 relative">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-primary/20 p-2 rounded-full">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-headline text-lg font-semibold">{currentStepConfig.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {currentStepConfig.content}
                            </p>
                            <div className="flex justify-between items-center">
                                <Button variant="ghost" size="sm" onClick={closeTour}>Skip</Button>
                                <div className="flex items-center gap-2">
                                     <span className="text-xs text-muted-foreground">{currentStepConfig.step} / {tourSteps.length}</span>
                                    <Button size="sm" onClick={nextStep} disabled={!!currentStepConfig.waitForNav}>
                                        {step === tourSteps.length - 1 ? 'Finish' : 'Next'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                {currentStepConfig.highlight && (
                  <motion.div
                    className="absolute border-2 border-primary rounded-lg shadow-[0_0_20px] shadow-primary/50"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.1, duration: 0.3 } }}
                    exit={{ opacity: 0 }}
                    style={currentStepConfig.highlight}
                  >
                  </motion.div>
                )}
            </div>
        </AnimatePresence>
    );
}
