
'use client';
import Link from 'next/link';
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
             <Link href="/" className="flex items-center gap-2 mb-4">
                <Sparkles className="h-7 w-7 text-primary" />
                <span className="text-xl font-bold font-headline">Xora</span>
            </Link>
            <p className="text-muted-foreground text-sm">AI with personality. Conversations with soul.</p>
          </div>
          <div>
            <h3 className="font-semibold tracking-wider text-foreground">Explore</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link href="/api" className="text-sm text-muted-foreground hover:text-foreground">API</Link></li>
            </ul>
          </div>
          <div>
             <h3 className="font-semibold tracking-wider text-foreground">Resources</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Blog</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Docs</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a></li>
            </ul>
          </div>
          <div>
             <h3 className="font-semibold tracking-wider text-foreground">Connect</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Github size={16}/> GitHub</a></li>
              <li><a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Twitter size={16}/> Twitter / X</a></li>
              <li><a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Linkedin size={16}/> LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Xora. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <ThemeToggle />
            </div>
        </div>
      </div>
    </footer>
  );
};
