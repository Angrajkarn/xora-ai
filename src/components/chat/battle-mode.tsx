
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Swords, Trophy, Sparkles } from 'lucide-react';
import { MODELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { runBattleFlow, type BattleFlowOutput } from '@/ai/flows/battle-flow';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MotionDiv } from '../ui/motion';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const battleModels = MODELS.filter(m => m.type === 'model' || m.type === 'persona');

export function BattleMode() {
  const [modelA, setModelA] = useState<string>('gemini');
  const [modelB, setModelB] = useState<string>('claude');
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleFlowOutput | null>(null);
  const [winner, setWinner] = useState<'A' | 'B' | null>(null);
  const { toast } = useToast();

  const handleStartBattle = async () => {
    if (!prompt.trim() || !modelA || !modelB) {
      toast({ title: 'Please fill all fields', description: 'Select two models and enter a prompt.', variant: 'destructive' });
      return;
    }
    if (modelA === modelB) {
        toast({ title: 'Select different models', description: 'The two models for the battle must be different.', variant: 'destructive' });
        return;
    }

    setIsLoading(true);
    setBattleResult(null);
    setWinner(null);
    try {
      const result = await runBattleFlow({ prompt, modelAId: modelA, modelBId: modelB });
      setBattleResult(result);
    } catch (error) {
      console.error(error);
      toast({ title: 'Battle Failed', description: 'An error occurred while getting responses.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVote = (selectedWinner: 'A' | 'B') => {
      setWinner(selectedWinner);
      const winnerModel = selectedWinner === 'A' ? battleModels.find(m => m.id === modelA) : battleModels.find(m => m.id === modelB);
      toast({
          title: 'Vote Cast!',
          description: `You voted for ${winnerModel?.name}. Thank you for the feedback!`,
      });
  }

  const modelAData = battleModels.find(m => m.id === modelA);
  const modelBData = battleModels.find(m => m.id === modelB);

  return (
    <ScrollArea className="h-full">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glassmorphic">
                    <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <Swords className="w-8 h-8 text-primary"/>
                        <CardTitle className="font-headline text-2xl">AI Model Battle</CardTitle>
                    </div>
                    <CardDescription>Pit two AI models against each other with the same prompt and decide the winner.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center">
                        <div className="space-y-2">
                            <Label htmlFor="model-a">Model 1</Label>
                            <Select value={modelA} onValueChange={setModelA}>
                                <SelectTrigger id="model-a"><SelectValue placeholder="Select a model" /></SelectTrigger>
                                <SelectContent className="glassmorphic">
                                {battleModels.map(model => <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="text-muted-foreground font-bold text-sm py-2">VS</div>
                        <div className="space-y-2">
                            <Label htmlFor="model-b">Model 2</Label>
                            <Select value={modelB} onValueChange={setModelB}>
                                <SelectTrigger id="model-b"><SelectValue placeholder="Select a model" /></SelectTrigger>
                                <SelectContent className="glassmorphic">
                                {battleModels.map(model => <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prompt">Your Prompt</Label>
                        <Textarea
                        id="prompt"
                        placeholder="e.g., Write a short story about a robot who discovers music."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[120px] bg-input/50"
                        />
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button onClick={handleStartBattle} disabled={isLoading} size="lg">
                        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                        Start Battle
                    </Button>
                    </CardFooter>
                </Card>
            </MotionDiv>

            <AnimatePresence>
            {isLoading && (
                 <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 flex items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="animate-spin h-6 w-6" />
                    <p className="font-semibold">The battle is on... fetching responses...</p>
                </MotionDiv>
            )}
            {battleResult && (
                 <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-2xl font-bold text-center mb-6 font-headline">Battle Results</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Model A Response */}
                        <Card className={cn("glassmorphic flex flex-col transition-all", winner === 'A' && 'border-2 border-green-500 shadow-lg shadow-green-500/20', winner && winner !== 'A' && 'opacity-60')}>
                           <CardHeader className="flex flex-row items-center gap-3">
                                {modelAData?.icon && <modelAData.icon className="w-6 h-6" />}
                                <CardTitle className="font-headline">{modelAData?.name}</CardTitle>
                                {winner === 'A' && <Trophy className="w-5 h-5 text-green-500" />}
                           </CardHeader>
                           <CardContent className="prose prose-sm dark:prose-invert max-w-none flex-grow">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{battleResult.responseA}</ReactMarkdown>
                           </CardContent>
                           <CardFooter>
                                <Button onClick={() => handleVote('A')} disabled={!!winner} variant={winner === 'A' ? 'default' : 'outline'} className="w-full">
                                    {winner === 'A' ? 'Voted!' : 'Vote for this version'}
                                </Button>
                           </CardFooter>
                        </Card>

                        {/* Model B Response */}
                        <Card className={cn("glassmorphic flex flex-col transition-all", winner === 'B' && 'border-2 border-green-500 shadow-lg shadow-green-500/20', winner && winner !== 'B' && 'opacity-60')}>
                           <CardHeader className="flex flex-row items-center gap-3">
                                {modelBData?.icon && <modelBData.icon className="w-6 h-6" />}
                                <CardTitle className="font-headline">{modelBData?.name}</CardTitle>
                                {winner === 'B' && <Trophy className="w-5 h-5 text-green-500" />}
                           </CardHeader>
                           <CardContent className="prose prose-sm dark:prose-invert max-w-none flex-grow">
                               <ReactMarkdown remarkPlugins={[remarkGfm]}>{battleResult.responseB}</ReactMarkdown>
                           </CardContent>
                           <CardFooter>
                                <Button onClick={() => handleVote('B')} disabled={!!winner} variant={winner === 'B' ? 'default' : 'outline'} className="w-full">
                                    {winner === 'B' ? 'Voted!' : 'Vote for this version'}
                                </Button>
                           </CardFooter>
                        </Card>

                    </div>
                </MotionDiv>
            )}
            </AnimatePresence>
        </div>
    </ScrollArea>
  );
}
