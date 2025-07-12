
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Send, Sparkles, Paperclip, Mic, Loader2, File as FileIcon, Globe, X, Users, Video, BarChart2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { runModelSuggester } from '@/ai/flows/model-suggester-flow';
import { MODELS as allModels } from '@/lib/constants';
import type { ModelId, Attachment } from '@/lib/types';

const chatModels = allModels.filter(m => m.type === 'model' || m.type === 'persona');

interface ChatInputFormProps {
  isLoading: boolean;
  isCopilotLoading: boolean;
  showWelcome: boolean;
  onSubmit: (input: string, attachment: Attachment | null) => void;
  onCopilotRequest: () => void;
  onMediaChatOpen: (mode: 'voice' | 'video') => void;
}

export function ChatInputForm({ isLoading, isCopilotLoading, showWelcome, onSubmit, onCopilotRequest, onMediaChatOpen }: ChatInputFormProps) {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isAttachmentPopoverOpen, setIsAttachmentPopoverOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<{ modelId: ModelId; reason: string } | null>(null);
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (input.trim().length < 10 || input.startsWith('/') || isLoading) {
        setSuggestion(null);
        return;
      }
      try {
        const result = await runModelSuggester({ prompt: input });
        const suggestedModel = allModels.find(m => m.id === result.suggestedModelId);
        if (suggestedModel?.type === 'persona' && !input.startsWith('/')) {
          setSuggestion({ modelId: result.suggestedModelId as ModelId, reason: result.reason });
        }
      } catch (e) {
        console.error("Suggestion error:", e);
        setSuggestion(null);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [input, isLoading]);

  const handleSlashCommandSelect = (modelId: string) => {
    const words = input.split(' ');
    words.pop();
    words.push(`/${modelId}`);
    setInput(words.join(' ') + ' ');
    setShowSlashCommand(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setSuggestion(null);
    const words = value.split(' ');
    const lastWord = words[words.length - 1];
    setShowSlashCommand(lastWord.startsWith('/'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setAttachment({ file: { name: file.name, dataUri: loadEvent.target?.result as string, type: file.type } });
      };
      reader.readAsDataURL(file);
      setIsAttachmentPopoverOpen(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const urlInput = e.currentTarget.elements.namedItem('url') as HTMLInputElement;
    if (urlInput.value && urlInput.checkValidity()) {
      setAttachment({ url: urlInput.value });
      setIsAttachmentPopoverOpen(false);
    } else {
      toast({ title: "Invalid URL", description: "Please enter a valid URL.", variant: "destructive" });
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input, attachment);
    setInput('');
    setAttachment(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t bg-background p-4 space-y-2">
      <AnimatePresence>
        {showSlashCommand && (
          <motion.div
            key="slash-command-suggestions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-2 p-1 border rounded-lg glassmorphic"
          >
            <p className="text-xs text-muted-foreground p-2">Select a model to direct your prompt:</p>
            {chatModels.map(model => (
              <Button key={model.id} variant="ghost" className="w-full justify-start" onClick={() => handleSlashCommandSelect(model.id)}>
                <model.icon className="h-4 w-4 mr-2" />
                {model.name}
                <span className="text-xs text-muted-foreground ml-2">{model.description}</span>
              </Button>
            ))}
          </motion.div>
        )}
        {suggestion && !input.startsWith('/') && (
          <motion.div
            key="model-suggestion"
            layout
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="mb-2"
          >
            <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 border text-sm">
              <div className="flex items-center gap-2 truncate min-w-0">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-semibold">Suggestion:</span>
                <span className="text-muted-foreground truncate">{suggestion.reason}</span>
                <Button
                  variant="link"
                  className="p-0 h-auto whitespace-nowrap"
                  onClick={() => {
                    setInput(`/${suggestion.modelId} ${input}`);
                    setSuggestion(null);
                    inputRef.current?.focus();
                  }}
                >
                  Use /{suggestion.modelId}
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => setSuggestion(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {attachment && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 border text-sm">
          <div className="flex items-center gap-2 truncate min-w-0">
            {attachment.file && attachment.file.type.startsWith('image/') ? (
              <img src={attachment.file.dataUri} alt={attachment.file.name} className="h-10 w-10 object-cover rounded-md" />
            ) : (
              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-background flex items-center justify-center">
                {attachment.file ? <FileIcon className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
              </div>
            )}
            <span className="truncate font-medium">{attachment.file?.name || attachment.url}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={removeAttachment}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <Popover open={isAttachmentPopoverOpen} onOpenChange={setIsAttachmentPopoverOpen}>
          <PopoverTrigger asChild>
            <Button type="button" size="icon" variant="ghost">
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 glassmorphic" align="start">
              <div className="grid w-full grid-cols-3">
                <Button variant="ghost" onClick={() => fileInputRef.current?.click()}><ImageIcon className="mr-2 h-4 w-4"/>File</Button>
                <form onSubmit={handleUrlSubmit} className="space-y-2">
                    <Input required id="url-input" name="url" type="url" placeholder="https://example.com" className="bg-input/50" />
                    <Button type="submit" className="w-full">Analyze URL</Button>
                </form>
                <Button variant="ghost" onClick={() => fileInputRef.current?.click()}><BarChart2 className="mr-2 h-4 w-4"/>Data</Button>
              </div>
            </PopoverContent>
        </Popover>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" size="icon" variant="ghost" onClick={onCopilotRequest} disabled={isLoading || isCopilotLoading || showWelcome} title="Ask Co-pilot for help">
                {isCopilotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Users className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ask Co-pilot for a summary or suggestion</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Input
          id="chat-input-form"
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          placeholder={"Ask Xora anything, or type '/' for commands..."}
          className="text-base"
          disabled={isLoading}
        />
        
        <Button type="button" size="icon" variant="ghost" onClick={() => onMediaChatOpen('voice')} disabled={isLoading}>
          <Mic className="h-5 w-5" />
        </Button>
        
        <Button type="button" size="icon" variant="ghost" onClick={() => onMediaChatOpen('video')} disabled={isLoading}>
          <Video className="h-5 w-5" />
        </Button>

        <Button type="submit" size="icon" variant="ghost" disabled={(!input.trim() && !attachment) || isLoading}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
