
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Sparkles, Heart, Users, Copy, ThumbsUp, ThumbsDown, File as FileIcon, Globe, SmilePlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';
import { type Message } from '@/lib/types';
import { MODELS as allModels } from '@/lib/constants';
import { DataChartRenderer } from './data-chart-renderer';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';


const ReactionPicker = React.memo(({
    onSelect,
    children,
}: {
    onSelect: (emoji: string) => void;
    children: React.ReactNode;
}) => {
    const emojis = ['❤️', '😂', '👍', '😢', '🤯', '🔥'];

    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-auto p-1 glassmorphic">
                <div className="flex gap-1">
                    {emojis.map((emoji) => (
                        <Button
                            key={emoji}
                            variant="ghost"
                            size="icon"
                            className="text-lg rounded-full h-9 w-9"
                            onClick={() => onSelect(emoji)}
                        >
                            {emoji}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
});
ReactionPicker.displayName = 'ReactionPicker';

const EmojiBubble = ({ emoji }: { emoji: string }) => (
    <motion.div
        initial={{ scale: 0.5, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.5, y: 10, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute -bottom-3 -right-2 text-lg p-1 bg-background/80 backdrop-blur-sm rounded-full shadow-md border"
    >
        {emoji}
    </motion.div>
);

const ChatActions = React.memo(({
  content,
  messageId,
  feedback,
  onFeedback,
  onReact,
}: {
  content: string;
  messageId: string;
  feedback?: 'like' | 'dislike';
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
  onReact: (messageId: string, reaction: string | null) => void;
}) => {
  const { toast } = useToast();

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard!" });
  }, [content, toast]);

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity bg-background/50 border rounded-full px-1">
      <ReactionPicker onSelect={(emoji) => onReact(messageId, emoji)}>
        <Button variant="ghost" size="icon" className="h-7 w-7">
            <SmilePlus className="h-4 w-4" />
            <span className="sr-only">React</span>
        </Button>
      </ReactionPicker>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
        <Copy className="h-4 w-4" />
        <span className="sr-only">Copy</span>
      </Button>
      <Button variant="ghost" size="icon" className={cn("h-7 w-7", feedback === 'like' && 'text-primary bg-primary/10')} onClick={() => onFeedback(messageId, 'like')}>
        <ThumbsUp className="h-4 w-4" />
        <span className="sr-only">Like</span>
      </Button>
      <Button variant="ghost" size="icon" className={cn("h-7 w-7", feedback === 'dislike' && 'text-destructive bg-destructive/10')} onClick={() => onFeedback(messageId, 'dislike')}>
        <ThumbsDown className="h-4 w-4" />
        <span className="sr-only">Dislike</span>
      </Button>
    </div>
  );
});
ChatActions.displayName = 'ChatActions';


const ChatMessageComponent = ({ 
    message, 
    isCurrentUser, 
    onFeedback,
    onReact
}: { 
    message: Message; 
    isCurrentUser: boolean; 
    onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void; 
    onReact: (messageId: string, reaction: string | null) => void;
}) => {
  const ModelIcon = allModels.find(m => m.id === message.author?.uid)?.icon || allModels.find(m => m.name === message.personaName)?.icon || Heart;

  return (
    <motion.div
      layout
      key={message.id}
      className={cn('flex items-start gap-4 w-full', isCurrentUser ? 'justify-end' : 'justify-start')}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 border-2 border-primary/50">
          <AvatarImage src={message.author?.avatar} alt={message.author?.name} />
          <AvatarFallback>
            {message.isCopilotResponse ? <Users /> : message.author?.uid === 'ai' ? <Sparkles /> : <ModelIcon className="h-4 w-4 text-primary" />}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex flex-col gap-1 w-full max-w-lg group/message', isCurrentUser && 'items-end')}>
        {!isCurrentUser && <p className="text-xs text-muted-foreground">{message.author?.name || 'Unknown'}</p>}
        
        <div className="relative">
             {message.isCopilotResponse ? (
                <Card className="glassmorphic border-2 border-accent/50 shadow-lg shadow-accent/10">
                    <CardHeader className="p-3 flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-accent" />
                        <CardTitle className="font-headline text-lg text-accent">AI Co-pilot</CardTitle>
                    </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </CardContent>
                </Card>
            ) : message.isSummary ? (
                <Card className="glassmorphic border-2 border-primary/50 shadow-lg shadow-primary/10">
                    <CardHeader className="p-3 flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <CardTitle className="font-headline text-lg text-primary">Xora Smart Summary</CardTitle>
                    </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </CardContent>
                </Card>
            ) : message.responses ? (
                <div className="grid grid-cols-1 gap-2 w-full">
                    {message.responses.map((res, i) => {
                    const model = allModels.find(m => m.id === res.modelId);
                    const ResModelIcon = model?.icon || Sparkles;
                    return (
                        <Card key={i} className="glassmorphic flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-2 p-2">
                            <Avatar className="h-6 w-6 border-2 border-primary/20">
                            <AvatarFallback className="bg-transparent"><ResModelIcon className="h-3 w-3 text-primary" /></AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-sm font-headline">{model?.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow text-sm p-2 pt-0 pb-2 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1">
                            {res.imageUrl && (
                            <div className="my-2 rounded-lg overflow-hidden border">
                                <img src={res.imageUrl} alt={res.content || 'Generated image'} className="w-full h-auto object-contain" />
                            </div>
                            )}
                            {res.chartData && <DataChartRenderer chartData={res.chartData} />}
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{res.content}</ReactMarkdown>
                            {res.audioDataUri && (
                            <div className="mt-2">
                                <audio controls src={res.audioDataUri} className="w-full h-10" />
                            </div>
                            )}
                        </CardContent>
                        <CardFooter className="p-1 pt-0 justify-end">
                            <ChatActions content={res.content} messageId={message.id + i} onFeedback={(id, feedback) => onFeedback(message.id, feedback)} onReact={onReact}/>
                        </CardFooter>
                        </Card>
                    )
                    })}
                </div>
            ) : (
                <div className={cn('rounded-lg p-3 text-sm shadow-md', isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    {message.attachment && (
                    message.attachment.file && message.attachment.file.type.startsWith('image/') ? (
                        <img src={message.attachment.file.dataUri} alt={message.attachment.file.name} className="mb-2 rounded-md max-w-full h-auto max-h-60 object-contain" />
                    ) : (
                        <div className={cn("mb-2 flex items-center gap-2 p-2 rounded-md border text-sm", isCurrentUser ? "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20" : "bg-background/50 border-border")}>
                        {message.attachment.file ? <FileIcon className="h-4 w-4 flex-shrink-0" /> : <Globe className="h-4 w-4 flex-shrink-0" />}
                        <span className="truncate font-medium">{message.attachment.file?.name || message.attachment.url}</span>
                        </div>
                    )
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1" style={{ color: isCurrentUser ? 'inherit' : '' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                </div>
            )}
             <AnimatePresence>
                {message.userReaction && !isCurrentUser && <EmojiBubble emoji={message.userReaction} />}
                {message.aiReaction && isCurrentUser && <EmojiBubble emoji={message.aiReaction} />}
             </AnimatePresence>
        </div>

        <div className={cn(
            'flex items-center gap-1 self-end transition-all duration-300', 
            isCurrentUser ? 'group-hover/message:opacity-100 opacity-0 -translate-x-full' : 'pl-2',
            message.isPersonaResponse ? 'pt-1' : ''
        )}>
          <ChatActions content={message.content} messageId={message.id} feedback={message.feedback} onFeedback={onFeedback} onReact={onReact}/>
        </div>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={message.author?.avatar} alt={message.author?.name} />
          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
};

export const ChatMessage = React.memo(ChatMessageComponent);
