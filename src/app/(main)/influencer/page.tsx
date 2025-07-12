
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Megaphone, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runInfluencerStrategistFlow, type InfluencerStrategistOutput } from '@/ai/flows/influencer-strategist-flow';
import { MotionDiv } from '@/components/ui/motion';
import { AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const DayPlanCard = ({ dayPlan, index }: { dayPlan: InfluencerStrategistOutput['plan'][0], index: number }) => {
    const { toast } = useToast();
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard!' });
    };

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Card className="glassmorphic h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline text-lg">{dayPlan.day}</CardTitle>
                        <Badge variant="secondary">{dayPlan.theme}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div className="aspect-square w-full rounded-lg overflow-hidden border">
                        <img src={dayPlan.imageUrl} alt={dayPlan.theme} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-4">{dayPlan.caption}</p>
                        <p className="text-xs text-primary font-medium">{dayPlan.hashtags}</p>
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCopy(dayPlan.caption)}>
                        <Copy className="mr-2 h-4 w-4"/> Copy Caption
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <a href={dayPlan.imageUrl} download={`${dayPlan.day}-${dayPlan.theme}.png`}>
                            <Download className="mr-2 h-4 w-4"/> Image
                        </a>
                    </Button>
                </CardFooter>
            </Card>
        </MotionDiv>
    );
};

const PlanSkeleton = () => (
    <div className="space-y-8">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-24" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="aspect-square w-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-5/6" />
                             <Skeleton className="h-4 w-1/2" />
                        </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Skeleton className="h-9 w-1/2" />
                        <Skeleton className="h-9 w-1/2" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
);

export default function InfluencerModePage() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [planData, setPlanData] = useState<InfluencerStrategistOutput | null>(null);
  const { toast } = useToast();

  const handleGeneratePlan = async () => {
    if (!topic.trim()) {
      toast({ title: 'Please enter a topic for your content plan.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setPlanData(null);
    try {
      const result = await runInfluencerStrategistFlow({ topic });
      setPlanData(result);
      toast({ title: 'Content plan generated successfully!', description: 'Here is your 7-day strategy.' });
    } catch (error: any) {
      console.error('Plan generation failed:', error);
      toast({
        title: 'Plan Generation Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glassmorphic">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Megaphone className="w-8 h-8 text-primary" />
                <CardTitle className="font-headline text-2xl">AI Influencer Mode</CardTitle>
              </div>
              <CardDescription>
                Define your brand or topic, and let the AI generate a complete 7-day content plan with visuals, captions, and themes to make you go viral.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="brand-topic">Brand / Product / Topic</Label>
                <Textarea
                  id="brand-topic"
                  placeholder="e.g., A brand of sustainable, handcrafted coffee mugs"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px] bg-input/50"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGeneratePlan} disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                Generate 7-Day Plan
              </Button>
            </CardFooter>
          </Card>
        </MotionDiv>

        <AnimatePresence>
          {isLoading && (
            <MotionDiv
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PlanSkeleton />
            </MotionDiv>
          )}
          {planData && (
            <MotionDiv
              key="plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center font-headline">{planData.strategyTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 items-stretch">
                {planData.plan.map((dayPlan, index) => (
                  <DayPlanCard key={dayPlan.day} dayPlan={dayPlan} index={index} />
                ))}
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
