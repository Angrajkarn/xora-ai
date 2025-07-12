
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Clapperboard, AudioLines, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runReelGeneratorFlow, type ReelGeneratorOutput } from '@/ai/flows/reel-generator-flow';
import { MotionDiv } from '@/components/ui/motion';
import { AnimatePresence } from 'framer-motion';
import { useCarousel } from '@/components/ui/carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { Skeleton } from '@/components/ui/skeleton';

const ReelScene = ({ scene }: { scene: ReelGeneratorOutput['scenes'][0] }) => {
  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <img
        src={scene.imageUrl}
        alt={`Scene ${scene.scene}`}
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-center text-sm sm:text-base font-semibold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          {scene.script}
        </p>
      </div>
    </div>
  );
};

const ReelPlayer = ({ reelData }: { reelData: ReelGeneratorOutput }) => {
  const [emblaRef] = useEmblaCarousel({
    axis: 'y',
    align: 'start',
  });

  return (
    <Card className="glassmorphic w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Clapperboard /> {reelData.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-[9/16] w-full rounded-lg border bg-muted overflow-hidden" ref={emblaRef}>
          <div className="h-full">
            {reelData.scenes.map((scene) => (
              <div key={scene.scene} className="h-full flex items-center justify-center">
                <ReelScene scene={scene} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
            <Label className="flex items-center gap-2"><AudioLines className="w-4 h-4"/> Generated Voiceover</Label>
            <audio controls src={reelData.audioDataUri} className="w-full h-10" />
        </div>
      </CardContent>
    </Card>
  );
};

const ReelSkeleton = () => (
    <Card className="glassmorphic w-full max-w-sm mx-auto">
        <CardHeader>
             <Skeleton className="h-7 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="aspect-[9/16] w-full rounded-lg" />
            <div className="space-y-2">
                 <Skeleton className="h-5 w-32" />
                 <Skeleton className="h-10 w-full" />
            </div>
        </CardContent>
    </Card>
)

export default function ReelGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reelData, setReelData] = useState<ReelGeneratorOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateReel = async () => {
    if (!topic.trim()) {
      toast({ title: 'Please enter a topic for your reel.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setReelData(null);
    try {
      const result = await runReelGeneratorFlow({ topic });
      setReelData(result);
      toast({ title: 'Reel generated successfully!', description: 'Swipe through the scenes below.' });
    } catch (error: any) {
      console.error('Reel generation failed:', error);
      toast({
        title: 'Reel Generation Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glassmorphic">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Clapperboard className="w-8 h-8 text-primary" />
                <CardTitle className="font-headline text-2xl">Text-to-Reel Generator</CardTitle>
              </div>
              <CardDescription>
                Turn any idea or prompt into a viral social media reel. The AI will write a script, generate visuals for each scene, and create a voiceover.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="reel-topic">Reel Topic</Label>
                <Textarea
                  id="reel-topic"
                  placeholder="e.g., The importance of drinking water"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px] bg-input/50"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardContent>
              <Button onClick={handleGenerateReel} disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                Generate Reel
              </Button>
            </CardContent>
          </Card>
        </MotionDiv>

        <AnimatePresence>
          {isLoading && (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-center"
            >
              <ReelSkeleton />
            </MotionDiv>
          )}
          {reelData && (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-center"
            >
              <ReelPlayer reelData={reelData} />
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
