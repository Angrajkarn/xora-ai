// This component is deprecated and has been replaced by src/components/app-header.tsx
// It is kept here to avoid breaking existing imports until they are all updated.
// Please use AppHeader for the new AIHub layout.

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline">AIHub</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/chat" className="transition-colors hover:text-foreground/80 text-foreground/60">Chat</Link>
            <Link href="/templates" className="transition-colors hover:text-foreground/80 text-foreground/60">Templates</Link>
            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">Dashboard</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
          </div>
          <nav className="flex items-center">
            <ThemeToggle />
            <Button asChild className="ml-2">
                <Link href="/login">Login</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
