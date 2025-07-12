
'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Send, Sparkles, User, Paperclip, Mic, Bot, BrainCircuit, Moon, Loader2, FileUp, Code, FileText, ThumbsUp, ThumbsDown, Copy, Star, Heart, PenLine, File as FileIcon, Globe, X, Link as LinkIcon, Image as ImageIcon, Users, Video, Waves, MoreHorizontal, ShieldCheck, Check, BarChart2, Lightbulb, ShoppingCart, Clapperboard, Calendar } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODELS as allModels } from '@/lib/constants';
import { smartAIRouter, type SmartAIRouterInput, type SmartAIRouterOutput } from '@/ai/flows/smart-ai-router';
import { runXoraPersonaFlow, type XoraPersonaInput, type XoraPersonaOutput } from '@/ai/flows/aihub-persona-flow';
import { runModelSuggester } from '@/ai/flows/model-suggester-flow';
import { runInteractiveGroupChat } from '@/ai/flows/group-conversation-flow';
import { runCollaborativeCopilot } from '@/ai/flows/collaborative-copilot-flow';
import { runPromptSuggestionFlow, type PromptSuggestionOutput } from '@/ai/flows/prompt-suggester-flow';
import { useToast } from '@/hooks/use-toast';
import { type Message, type Attachment, type ModelId, type Author, type ChatSummary } from '@/lib/types';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listenToChatMessages, createChatAndAddMessage, addMessageToChat, joinChat, updateChatDefaultModel, setChatExpiry } from '@/services/chatService';
import { getChatHistoryAction } from '@/services/chatServiceActions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Switch } from '../ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MediaChatMode } from './media-chat-mode';
import { Timestamp } from 'firebase/firestore';
import { add, format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getMemberProfiles } from '@/app/(main)/chat/actions';
import { Skeleton } from '../ui/skeleton';
import { updateUserActivity } from '@/services/gamificationService';
import { DataChartRenderer } from './data-chart-renderer';


const chatModels = allModels.filter(m => m.type === 'model' || m.type === 'persona');

interface WelcomeCardProps {
    userName: string;
    onPromptClick: (prompt: string) => void;
    suggestions: PromptSuggestionOutput['suggestions'] | null;
    isLoading: boolean;
}

const WelcomeCard = ({ userName, onPromptClick, suggestions, isLoading }: WelcomeCardProps) => {
    
    if (isLoading || !suggestions) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <Skeleton className="w-16 h-16 rounded-full mb-6" />
                 <Skeleton className="h-10 w-80 mb-2" />
                 <Skeleton className="h-5 w-96 mb-8" />
                <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                         <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            className="flex flex-col items-center justify-center h-full text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="p-4 bg-primary/10 rounded-full border border-primary/20 mb-6">
                <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tight mb-2">Hello, {userName}. I'm Xora.</h1>
            <p className="max-w-xl text-muted-foreground mb-8">
                Your AI Ecosystem. How can I help you today?
                <br />
                Select a suggestion below, or type a message to start.
            </p>
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((p, i) => {
                    const IconComponent = (LucideIcons as any)[p.icon] || Sparkles;
                    return (
                        <motion.button 
                            key={i}
                            onClick={() => onPromptClick(p.text)}
                            className="p-4 text-left rounded-lg bg-card/50 hover:bg-muted transition-all flex items-start gap-4 border border-border/50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                        >
                            <IconComponent className="mr-1 mt-1 h-5 w-5 text-primary/80 flex-shrink-0" />
                            <span className="font-medium">{p.text}</span>
                        </motion.button>
                    )
                })}
            </div>
        </motion.div>
    );
}

const ChatActions = ({
  content,
  messageId,
  feedback,
  onFeedback,
}: {
  content: string;
  messageId: string;
  feedback?: 'like' | 'dislike';
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
}) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
};

const SecureModeDialog = ({
    isOpen,
    onOpenChange,
    chatId,
    currentExpiry,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    chatId: string;
    currentExpiry: Date | null;
}) => {
    const [duration, setDuration] = useState('never');
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (currentExpiry) {
                const diffHours = (currentExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                if (diffHours <= 1) setDuration('1h');
                else if (diffHours <= 24) setDuration('24h');
                else setDuration('7d');
            } else {
                setDuration('never');
            }
        }
    }, [isOpen, currentExpiry]);

    const handleSave = async () => {
        let newExpiry: Timestamp | null = null;
        if (duration !== 'never') {
            const now = new Date();
            if (duration === '1h') newExpiry = Timestamp.fromDate(add(now, { hours: 1 }));
            if (duration === '24h') newExpiry = Timestamp.fromDate(add(now, { days: 1 }));
            if (duration === '7d') newExpiry = Timestamp.fromDate(add(now, { days: 7 }));
        }

        try {
            await setChatExpiry(chatId, newExpiry);
            toast({
                title: 'Security Settings Updated',
                description: `Self-destruct timer has been ${newExpiry ? 'set' : 'turned off'}.`
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to update security settings.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glassmorphic">
                <DialogHeader>
                    <DialogTitle className="font-headline">Secure Chat Settings</DialogTitle>
                    <DialogDescription>
                        Enhance privacy for this conversation. These settings only apply to this specific chat.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label className="font-semibold">Self-Destruct Timer</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                        Automatically delete this chat after a set period. This action is permanent.
                    </p>
                    <RadioGroup value={duration} onValueChange={setDuration}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="never" id="r-never" />
                            <Label htmlFor="r-never">Never (Default)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1h" id="r-1h" />
                            <Label htmlFor="r-1h">1 Hour</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="24h" id="r-24h" />
                            <Label htmlFor="r-24h">24 Hours</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="7d" id="r-7d" />
                            <Label htmlFor="r-7d">7 Days</Label>
                        </div>
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const InviteDialog = ({
    isOpen,
    onOpenChange,
    chatData,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    chatData: ChatSummary | null;
}) => {
    const [members, setMembers] = useState<Author[]>([]);
    const [isFetchingMembers, setIsFetchingMembers] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const { toast } = useToast();
    const [shareUrl, setShareUrl] = useState('');

    useEffect(() => {
        if(isOpen) {
            setShareUrl(window.location.href);
            const fetchMembers = async () => {
                if (!chatData?.members) return;
                setIsFetchingMembers(true);
                try {
                    const profiles = await getMemberProfiles(chatData.members);
                    setMembers(profiles);
                } catch(e) {
                    console.error("Failed to fetch member profiles", e);
                    toast({ title: "Error", description: "Could not load chat members." });
                } finally {
                    setIsFetchingMembers(false);
                }
            }
            fetchMembers();
        }
    }, [isOpen, chatData, toast]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        toast({ title: 'Link copied to clipboard!' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md glassmorphic">
                <DialogHeader>
                    <DialogTitle className="font-headline">Invite Teammates</DialogTitle>
                    <DialogDescription>
                        Anyone with this link can view and join the conversation.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="share-link">Share Link</Label>
                        <div className="flex gap-2">
                            <Input id="share-link" value={shareUrl} readOnly className="bg-input/50" />
                            <Button onClick={handleCopyLink} size="icon" variant="outline" className="flex-shrink-0">
                                {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Members ({members.length})</Label>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {isFetchingMembers ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                ))
                            ) : members.map(member => (
                                <div key={member.uid} className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{member.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


export function ChatInterface({ chatId: initialChatId }: { chatId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isAttachmentPopoverOpen, setIsAttachmentPopoverOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<{ modelId: ModelId; reason: string } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [thinkingEntity, setThinkingEntity] = useState<string | null>(null);
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  
  const [chatId, setChatId] = useState(initialChatId);
  const [chatData, setChatData] = useState<ChatSummary | null>(null);
  const [isMediaChatOpen, setIsMediaChatOpen] = useState(false);
  const [mediaChatMode, setMediaChatMode] = useState<'voice' | 'video'>('voice');
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestionOutput['suggestions'] | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);


  const handleMediaChatClose = useCallback(() => {
    setIsMediaChatOpen(false);
  }, []);
  
  const openMediaChat = (mode: 'voice' | 'video') => {
    if (user) {
        updateUserActivity(user.uid, 'VOICE_VIRTUOSO');
    }
    setMediaChatMode(mode);
    setIsMediaChatOpen(true);
  }


  useEffect(() => {
    setChatId(initialChatId);
  }, [initialChatId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);
  
  // Effect for welcome screen and message listening
  useEffect(() => {
    if (!user) {
        setShowWelcome(false);
        setMessages([]);
        setChatData(null);
        setIsLoadingHistory(false);
        return;
    }

    if (!chatId) { // Welcome screen logic
        setShowWelcome(true);
        setMessages([]);
        setChatData(null);
        setIsLoadingHistory(false);

        const fetchSuggestions = async () => {
            setIsSuggestionsLoading(true);
            try {
                const history = await getChatHistoryAction(user.uid);
                const topics = history.slice(0, 5).map(h => h.title);
                const result = await runPromptSuggestionFlow({ chatTopics: topics });
                setPromptSuggestions(result.suggestions);
            } catch (err) {
                console.error("Failed to fetch prompt suggestions", err);
                setPromptSuggestions([
                    { text: "Write a short story about a detective on a space station", icon: "PenLine" },
                    { text: "Plan a 3-day marketing campaign for a new coffee brand", icon: "Lightbulb" },
                    { text: "Explain how a blockchain works in simple terms", icon: "BrainCircuit" },
                    { text: "Generate a Python script to parse a CSV file and find the average value of a column", icon: "Code" }
                ]);
            } finally {
                setIsSuggestionsLoading(false);
            }
        };
        
        fetchSuggestions();
        return;
    }

    // Existing chat logic
    setIsLoadingHistory(true);
    setShowWelcome(false);

    joinChat(chatId, user.uid).catch(err => console.error("Failed to join chat, might already be a member.", err));

    const unsubscribe = listenToChatMessages(chatId, (newMessages, newChatData) => {
      setMessages(newMessages);
      setChatData(newChatData);
      setIsLoadingHistory(false);
    });

    return () => unsubscribe();

  }, [chatId, user]);


  useEffect(() => {
    if (user && !chatId) {
      const promptFromTemplate = searchParams.get('prompt');
      if (promptFromTemplate) {
        setInput(decodeURIComponent(promptFromTemplate));
        inputRef.current?.focus();
        router.replace('/chat', { scroll: false });
      }
    }
  }, [user, chatId, router, searchParams]);
  
  // Debounce effect for suggestions
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (input.trim().length < 10 || input.startsWith('/') || isLoading) {
        setSuggestion(null);
        return;
      }
      try {
        const result = await runModelSuggester({ prompt: input });
        const suggestedModel = allModels.find(m => m.id === result.suggestedModelId);
        // Only suggest personas, not core models
        if (suggestedModel?.type === 'persona' && !input.startsWith('/')) {
          setSuggestion({ modelId: result.suggestedModelId as ModelId, reason: result.reason });
        }
      } catch (e) {
        console.error("Suggestion error:", e);
        setSuggestion(null);
      }
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [input, isLoading]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div');
        if (scrollableView) {
            scrollableView.scrollTo({ top: scrollableView.scrollHeight, behavior: 'smooth' });
        }
      }
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleFeedback = useCallback((messageId: string, feedback: 'like' | 'dislike') => {
      setMessages(prev =>
          prev.map(msg => {
              if (msg.id === messageId) {
                  return { ...msg, feedback: msg.feedback === feedback ? undefined : feedback };
              }
              return msg;
          })
      );
      toast({ title: `Feedback Received!` });
  }, [toast]);

  const handleSlashCommandSelect = (modelId: string) => {
    const words = input.split(' ');
    words.pop();
    words.push(`/${modelId}`);
    setInput(words.join(' ') + ' ');
    setShowSlashCommand(false);
    inputRef.current?.focus();
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setSuggestion(null);
    const words = value.split(' ');
    const lastWord = words[words.length - 1];
    setShowSlashCommand(lastWord.startsWith('/'));
  }

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
          toast({title: "Invalid URL", description: "Please enter a valid URL.", variant: "destructive"});
      }
  };

  const removeAttachment = () => {
      setAttachment(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  }
  
  const handleSendMessage = async (rawInput: string) => {
    if ((!rawInput.trim() && !attachment) || isLoading || !user) return;

    setSuggestion(null);

    const commandRegex = /^\s*\/([\w-]+)/;
    const commandMatch = rawInput.match(commandRegex);
    const command = commandMatch ? commandMatch[1] as ModelId : null;

    let cleanContent = rawInput.trim();
    if (command) {
      cleanContent = cleanContent.replace(commandRegex, '').trim();
    }
    
    if (!cleanContent && !attachment) {
      toast({ title: "Empty message", description: "Please type a message or add an attachment.", variant: "destructive" });
      return;
    }

    const modelForCommand = command ? allModels.find(m => m.id === command) : null;
    const isStartingNewPersonaChat = !!modelForCommand && modelForCommand.type === 'persona';
    
    const author: Author = {
        uid: user.uid,
        name: user.displayName || 'User',
        avatar: user.photoURL || undefined,
    }
    
    if (!cleanContent) {
        if (attachment?.file) cleanContent = `Analyzed file: ${attachment.file.name}`;
        else if (attachment?.url) cleanContent = `Analyzed URL: ${attachment.url}`;
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: cleanContent, author, attachment: attachment || undefined, createdAt: new Date() };
    const currentMessages = messages;
    
    // Set loading state
    setIsLoading(true);
    setInput('');
    setShowSlashCommand(false);
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    const isGroupChat = (chatData?.aiMembers && chatData.aiMembers.length > 0) || (chatData?.customPersonas && chatData.customPersonas.length > 0);
    const persona = allModels.find(m => m.id === (command || chatData?.defaultModelId));
    const thinkingName = isGroupChat ? "AI Group" : (persona?.name || 'Xora');
    setThinkingEntity(thinkingName);
    
    let currentChatId = chatId;
    
    // If starting a new chat (either because it's the first message ever, or because a persona was commanded)
    if (isStartingNewPersonaChat || !currentChatId) {
        if (showWelcome) setShowWelcome(false);
        try {
            const customTitle = modelForCommand ? `Chat with ${modelForCommand.name}` : undefined;
            const workspaceIdFromUrl = searchParams.get('workspaceId');
            const newChat = await createChatAndAddMessage(user, userMessage as Message, command || 'smart-ai', customTitle, workspaceIdFromUrl || undefined);
            
            currentChatId = newChat.id;
            
            if (currentChatId !== chatId) {
                setChatId(currentChatId);
                router.push(`/chat/${currentChatId}`);
            }
        } catch (e) {
            console.error("Failed to create chat:", e);
            toast({ title: "Error", description: "Could not start a new chat.", variant: "destructive" });
            setIsLoading(false);
            setThinkingEntity(null);
            return;
        }
    } else {
        await addMessageToChat(currentChatId, userMessage as Message);

        if (command && (!modelForCommand || (modelForCommand.type !== 'persona' && modelForCommand.id !== 'xora')) && !isGroupChat) {
            await updateChatDefaultModel(currentChatId, command);
            setChatData(prev => prev ? { ...prev, defaultModelId: command } : null);
        }
    }

    if (!currentChatId) {
        setIsLoading(false);
        setThinkingEntity(null);
        return;
    }
    
    // Build history for AI
    const historyForAI = [...currentMessages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
        authorName: m.author.name || (m.role === 'user' ? 'User' : 'AI'),
    }));

    try {
      const { file, url } = attachment || {};
      const lastAssistantMessage = [...currentMessages, userMessage].reverse().find(m => m.role === 'assistant');
      const lastResponseFeedback = lastAssistantMessage?.feedback;
      
      const assistantAuthor: Author = { uid: 'ai', name: 'AI', avatar: '/ai-avatar.png' };

      // Route to appropriate flow
      if (isGroupChat && chatData) {
        const allPersonas = [
            ...(chatData.aiMembers || []).map(id => {
                const model = allModels.find(m => m.id === id);
                return model ? { id: model.id, name: model.name, instructions: model.persona } : null;
            }).filter(Boolean),
            ...(chatData.customPersonas || []).map(p => ({ id: p.id, name: p.name, instructions: p.instructions }))
        ].filter(p => p !== null) as {id: string; name: string; instructions: string}[];

        const groupResult = await runInteractiveGroupChat({
            newMessage: cleanContent,
            history: historyForAI,
            personas: allPersonas,
        });
        
        for (const res of groupResult.responses) {
            const persona = allPersonas.find(p => p.name === res.speaker);
            if (persona && currentChatId) {
                const groupAssistantMessage: Omit<Message, 'id'> = {
                    role: 'assistant',
                    author: { uid: persona.id, name: persona.name, avatar: '' },
                    content: res.content,
                    isPersonaResponse: true,
                    personaName: persona.name,
                    createdAt: new Date(),
                };
                await addMessageToChat(currentChatId, groupAssistantMessage as Message);
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate typing delay
            }
        }

      } else if (isSinglePersonaInteraction(command || chatData?.defaultModelId)) {
        const personaInput: XoraPersonaInput = {
          prompt: cleanContent,
          history: buildModelSpecificHistory('xora', currentMessages),
          lastResponseFeedback,
          fileDataUri: file?.dataUri,
          url,
        };
        const result: XoraPersonaOutput = await runXoraPersonaFlow(personaInput);
        const personaModel = allModels.find(m => m.id === (command || chatData?.defaultModelId));
        const assistantMessage: Omit<Message, 'id'> = {
          role: 'assistant',
          author: { ...assistantAuthor, name: personaModel?.name || 'Xora Persona' },
          content: result.finalAnswer,
          isPersonaResponse: true,
          personaName: personaModel?.name || 'Xora Persona',
          detectedLanguage: result.detectedLanguage,
          createdAt: new Date(),
        };
        if (currentChatId) await addMessageToChat(currentChatId, assistantMessage as Message);
      
      } else { // Fallback to Smart AI Router
        const chatInput: SmartAIRouterInput = {
          prompt: cleanContent,
          history: buildModelSpecificHistory('smart-ai', currentMessages),
          modelIds: [command || chatData?.defaultModelId || 'smart-ai'],
          fileDataUri: file?.dataUri,
          fileType: file?.type,
          url,
        };
        const result: SmartAIRouterOutput = await smartAIRouter(chatInput);

        if (result.responses?.length > 0 && currentChatId) {
            const assistantMessage = {
                role: 'assistant',
                author: assistantAuthor,
                content: '',
                responses: result.responses,
                createdAt: new Date(),
                detectedLanguage: result.detectedLanguage,
            };
            await addMessageToChat(currentChatId, assistantMessage as Message);
        }

        if (result.summary && currentChatId) {
            const summaryMessage: Omit<Message, 'id'> = {
                role: 'assistant',
                author: { ...assistantAuthor, name: "Xora Smart Summary" },
                content: result.summary,
                isSummary: true,
                createdAt: new Date(),
                detectedLanguage: result.detectedLanguage,
            };
            await addMessageToChat(currentChatId, summaryMessage as Message);
        }
      }
      
      const badgeCheckType = command && allModels.find(m => m.id === command)?.id;
      await updateUserActivity(user.uid, badgeCheckType as any);

    } catch (error) {
      console.error("Error calling AI flow:", error);
      const errorMessage: Message = {
          id: Date.now().toString() + '-err',
          role: 'assistant',
          author: { uid: 'ai', name: 'Error' },
          content: `Sorry, an error occurred while processing your request. Please try again later.`,
          createdAt: new Date(),
      };
      if (currentChatId) {
        await addMessageToChat(currentChatId, errorMessage);
      }
      toast({
        title: "An Error Occurred",
        description: "Could not get a response from the AI. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
        setThinkingEntity(null);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };
  
  const handleCopilotRequest = async () => {
    if (!chatId || !user || messages.length === 0) {
      toast({
        title: "Co-pilot needs context",
        description: "Please have some conversation history before asking the co-pilot for help.",
        variant: "destructive"
      });
      return;
    }

    setIsCopilotLoading(true);
    try {
      const history = messages.slice(-5).map(m => ({
        role: m.role,
        content: `(${m.author?.name || 'Unknown User'}): ${m.content}`
      }));

      const response = await runCollaborativeCopilot({ history });

      const copilotMessage: Message = {
        id: Date.now().toString() + '-copilot',
        role: 'assistant',
        author: { uid: 'ai-copilot', name: 'AI Co-pilot', avatar: ''},
        content: response,
        isCopilotResponse: true,
        createdAt: new Date(),
      };
      
      await addMessageToChat(chatId, copilotMessage);
      await updateUserActivity(user.uid, 'COLLABORATOR');
      
    } catch (error) {
       console.error("Co-pilot Error:", error);
       toast({ title: "Co-pilot Error", description: "Could not get a response from the co-pilot.", variant: "destructive" });
    } finally {
       setIsCopilotLoading(false);
    }
  };

    const isSinglePersonaInteraction = (modelId?: ModelId) => {
        if (!modelId) return false;
        return allModels.find(m => m.id === modelId)?.type === 'persona' || modelId === 'xora';
    }

  const buildModelSpecificHistory = (modelId: ModelId | 'xora', historySource: Message[]): { role: 'user' | 'assistant'; content: string }[] => {
      const modelHistory: { role: 'user' | 'assistant'; content: string }[] = [];
      historySource.forEach(msg => {
        if (msg.role === 'user') {
          modelHistory.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant') {
          if (modelId === 'xora' && msg.isPersonaResponse) {
            modelHistory.push({ role: 'assistant', content: msg.content });
          } else if (modelId !== 'xora' && msg.responses) {
            const modelResponse = msg.responses.find(r => r.modelId === modelId);
            if (modelResponse) {
              modelHistory.push({ role: 'assistant', content: modelResponse.content });
            }
          }
        }
      });
      return modelHistory.slice(-6);
    };
  
  const currentExpiry = chatData?.expiresAt ? (chatData.expiresAt as Timestamp).toDate() : null;
  
  const userName = useMemo(() => {
    if (!user) return 'User';
    return user.displayName?.split(' ')[0] || 'User';
  }, [user]);

  const chatUi = (
    <div className="relative flex h-full flex-col bg-background">
        {!showWelcome && chatId && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                 {currentExpiry && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/80 text-primary">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-xs font-medium">Secure Mode</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This chat will self-destruct on {format(currentExpiry, 'PPp')}.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                 <Button variant="ghost" size="icon" onClick={() => setIsInviteDialogOpen(true)}>
                    <Users className="h-5 w-5" />
                    <span className="sr-only">Invite Teammates</span>
                </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 glassmorphic" align="end">
                         <DropdownMenuItem onSelect={() => setIsSecurityDialogOpen(true)}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Secure Chat Settings</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        {isLoadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : showWelcome ? (
          <div className="flex h-full items-center justify-center p-4">
             <WelcomeCard 
                userName={userName}
                onPromptClick={handleSendMessage} 
                suggestions={promptSuggestions} 
                isLoading={isSuggestionsLoading}
             />
          </div>
        ) : (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            {messages.map((message) => {
              const isCurrentUser = message.author?.uid === user?.uid;
              const ModelIcon = allModels.find(m => m.id === message.author?.uid)?.icon || allModels.find(m => m.name === message.personaName)?.icon || Heart;

              return (
                <motion.div
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
                            {message.isCopilotResponse ? <Users/> : message.author?.uid === 'ai' ? <Sparkles/> : <ModelIcon className="h-4 w-4 text-primary" />}
                        </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn('flex flex-col gap-1 w-full max-w-lg group', isCurrentUser && 'items-end')}>
                     {!isCurrentUser && <p className="text-xs text-muted-foreground">{message.author?.name || 'Unknown'}</p>}

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
                      ) : message.isPersonaResponse ? (
                        <div className={cn('rounded-lg p-3 text-sm shadow-md bg-muted')}>
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                            </div>
                        </div>
                      ) : message.responses ? (
                         <div className="grid grid-cols-1 gap-2 w-full">
                            {message.responses.map((res, i) => {
                                const model = allModels.find(m => m.id === res.modelId);
                                const ResModelIcon = model?.icon || Sparkles;
                                return(
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
                                      <ChatActions content={res.content} messageId={message.id + i} onFeedback={(id, feedback) => handleFeedback(message.id, feedback)} />
                                    </CardFooter>
                                </Card>
                               )
                           })}
                         </div>
                      ): (
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
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1" style={{color: isCurrentUser ? 'inherit' : ''}}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                            </div>
                        </div>
                      )}
                      
                     <div className={cn('flex items-center gap-1', isCurrentUser ? 'pr-2' : 'pl-2')}>
                        <ChatActions content={message.content} messageId={message.id} feedback={message.feedback} onFeedback={handleFeedback} />
                    </div>
                  </div>
                   {isCurrentUser && (
                     <Avatar className="h-8 w-8 border">
                        <AvatarImage src={message.author?.avatar} alt={message.author?.name} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              )}
            )}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4"
              >
                  <Avatar className="h-8 w-8 border-2 border-primary/50">
                      <AvatarFallback className="bg-transparent"><Sparkles className="h-4 w-4 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className='max-w-lg rounded-lg p-3 text-sm shadow-md bg-muted flex items-center gap-2'>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{thinkingEntity || 'Xora'} is thinking...</span>
                  </div>
              </motion.div>
            )}
        </div>
        )}
      </ScrollArea>
      <div className="border-t bg-background/80 backdrop-blur-sm p-4 space-y-2">
        <AnimatePresence>
            {showSlashCommand && (
              <motion.div 
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
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2"
        >
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
                <Button type="button" size="icon" variant="ghost" onClick={handleCopilotRequest} disabled={isLoading || isCopilotLoading || showWelcome} title="Ask Co-pilot for help">
                  {isCopilotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Users className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                  <p>Ask Co-pilot for a summary or suggestion</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder={"Ask Xora anything, or type '/' for commands..."}
            className="text-base"
            disabled={isLoading}
          />
          
          <Button type="button" size="icon" variant="ghost" onClick={() => openMediaChat('voice')} disabled={isLoading}>
            <Mic className="h-5 w-5" />
          </Button>
          
          <Button type="button" size="icon" variant="ghost" onClick={() => openMediaChat('video')} disabled={isLoading}>
            <Video className="h-5 w-5" />
          </Button>

          <Button type="submit" size="icon" variant="ghost" disabled={(!input.trim() && !attachment) || isLoading}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );


  return (
    <div className="h-full flex flex-col">
      {chatUi}
      {chatId && <InviteDialog
          isOpen={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          chatData={chatData}
      />}
      {chatId && <SecureModeDialog
          isOpen={isSecurityDialogOpen}
          onOpenChange={setIsSecurityDialogOpen}
          chatId={chatId}
          currentExpiry={currentExpiry}
      />}
      <Dialog open={isMediaChatOpen} onOpenChange={setIsMediaChatOpen}>
          <DialogContent className="w-screen h-screen max-w-full max-h-full p-0 m-0 bg-background/95 backdrop-blur-lg border-0">
              <DialogHeader className="sr-only">
                  <DialogTitle>Media Chat Mode</DialogTitle>
                  <DialogDescription>
                  Engage in a voice or video conversation with the AI assistant.
                  </DialogDescription>
              </DialogHeader>
              {user && <MediaChatMode
                  mode={mediaChatMode}
                  isOpen={isMediaChatOpen}
                  onClose={handleMediaChatClose}
                  chatId={chatId}
                  setChatId={setChatId}
                  user={user}
                  messages={messages}
                  chatData={chatData}
              />}
          </DialogContent>
      </Dialog>
    </div>
  );
}
