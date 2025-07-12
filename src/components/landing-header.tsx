
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

export const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderAuthButton = () => {
    if (isLoading) {
      return <Skeleton className="h-10 w-28" />;
    }
    if (user) {
      return (
        <Button asChild>
          <Link href="/dashboard">Dashboard <ArrowRight className="ml-2"/></Link>
        </Button>
      );
    }
    return (
      <Button asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    );
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled ? 'border-b border-border/50 bg-background/80 backdrop-blur-lg' : 'bg-transparent'
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary" />
          <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-headline">Xora</span>
              <span className="text-sm text-muted-foreground hidden sm:block">Your AI Ecosystem</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</Link>
          <Link href="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
          <Link href="/api" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">API</Link>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Docs</a>
        </nav>
        <div className="flex items-center gap-2">
           {renderAuthButton()}
        </div>
      </div>
    </header>
  );
};
