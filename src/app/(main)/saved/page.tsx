'use client';

import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { MotionDiv } from '@/components/ui/motion';

export default function SavedPage() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-headline text-4xl font-bold tracking-tight">Saved</h1>
          <p className="text-muted-foreground">Review your saved conversations and responses.</p>
        </MotionDiv>
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glassmorphic mt-8 flex h-[400px] w-full flex-col items-center justify-center">
              <div className="flex flex-col items-center text-center p-8">
              <Star className="h-16 w-16 text-primary/50" />
              <h2 className="mt-6 text-2xl font-semibold">Nothing saved yet</h2>
              <p className="mt-2 text-center text-muted-foreground">
                  You can save important conversations to review them later.
              </p>
              </div>
          </Card>
        </MotionDiv>
      </div>
    </div>
  );
}
