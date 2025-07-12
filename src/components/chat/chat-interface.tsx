
'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2, Users, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { MODELS as allModels, getVoiceForEmotion } from '@/lib/constants';
import { smartAIRouter, type SmartAIRouterInput, type SmartAIRouterOutput } from '@/ai/flows/smart-ai-router';
import { runXoraPersonaFlow, type XoraPersonaInput, type XoraPersonaOutput } from '@/ai/flows/aihub-persona-flow';
import { runInteractiveGroupChat } from '@/ai/flows/group-conversation-flow';
import { runCollaborativeCopilot } from '@/ai/flows/collaborative-copilot-flow';
import { runPromptSuggestionFlow, type PromptSuggestionOutput } from '@/ai/flows/prompt-suggester-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useToast } from '@/hooks/use-toast';
import { type Message, type ModelId, type Author, type ChatSummary, type AIResponse } from '@/lib/types';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listenToChatMessages, createChatAndAddMessage, addMessageToChat, joinChat, updateChatDefaultModel, setChatExpiry, updateMessageReaction } from '@/services/chatService';
import { getChatHistoryAction } from '@/services/chatServiceActions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MediaChatMode } from './media-chat-mode';
import { Timestamp, type Unsubscribe } from 'firebase/firestore';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getMemberProfiles } from '@/app/(main)/chat/actions';
import { updateUserActivity } from '@/services/gamificationService';
import { ChatMessage } from './chat-message';
import { ChatInputForm } from './chat-input-form';
import { Button } from '../ui/button';
import { WelcomeCard } from './welcome-card';
import { InviteDialog } from './invite-dialog';
import { SecureModeDialog } from './secure-mode-dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { synthesizeAIProfile } from '@/app/(main)/profile/actions';
import type { MemorySynthesizerOutput } from '@/ai/flows/memory-synthesizer-flow';


export function ChatInterface({ chatId: initialChatId }: { chatId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [thinkingEntity, setThinkingEntity] = useState<string | null>(null);
  
  const [chatId, setChatId] = useState(initialChatId);
  const [chatData, setChatData] = useState<ChatSummary | null>(null);
  const [isMediaChatOpen, setIsMediaChatOpen] = useState(false);
  const [mediaChatMode, setMediaChatMode] = useState<'voice' | 'video'>('voice');
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestionOutput['suggestions'] | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);

  const [memoryProfile, setMemoryProfile] = useState<MemorySynthesizerOutput | null>(null);
  const memoryFetchedForChat = useRef<string | null>(null);


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
        memoryFetchedForChat.current = null;
        setMemoryProfile(null);

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
    let unsubscribeFromMessages: Unsubscribe | null = null;
    const setupAndListenToChat = async () => {
        setIsLoadingHistory(true);
        setShowWelcome(false);
        try {
            // First, ensure the user is a member of the chat.
            await joinChat(chatId, user.uid);
            
            // Now, it's safe to set up the listener.
            unsubscribeFromMessages = listenToChatMessages(chatId, (newMessages, newChatData) => {
                setMessages(newMessages);
                setChatData(newChatData);
                setIsLoadingHistory(false); // Stop loading once we get data

                // Fetch memory only once per Xora chat
                if (newChatData?.defaultModelId === 'xora' && memoryFetchedForChat.current !== chatId && user) {
                    memoryFetchedForChat.current = chatId; // Mark as fetching/fetched
                    synthesizeAIProfile(user.uid, user.displayName || 'User').then(result => {
                        if (!('error' in result)) {
                            setMemoryProfile(result);
                            console.log("AI long-term memory profile loaded.");
                        } else {
                            console.warn("Could not load AI memory profile:", result.error);
                        }
                    });
                } else if (newChatData?.defaultModelId !== 'xora') {
                    // Clear memory if it's not a Xora chat
                    setMemoryProfile(null);
                }
            });

        } catch (error) {
            console.error("Error setting up chat:", error);
            toast({
                title: "Error Loading Chat",
                description: "You may not have permission to view this chat or it may have been deleted.",
                variant: "destructive"
            });
            router.push('/chat');
        }
    }

    setupAndListenToChat();
    
    // Cleanup function
    return () => {
        if (unsubscribeFromMessages) {
            unsubscribeFromMessages();
        }
    };

  }, [chatId, user, router, toast]);

  useEffect(() => {
    const promptFromTemplate = searchParams.get('prompt');
    if (user && !chatId && promptFromTemplate) {
      const chatInputForm = document.getElementById('chat-input-form');
      if (chatInputForm) {
        (chatInputForm as HTMLInputElement).value = decodeURIComponent(promptFromTemplate);
        chatInputForm.focus();
      }
      router.replace('/chat', { scroll: false });
    }
  }, [user, chatId, router, searchParams]);
  

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
  
  const handleReact = useCallback(async (messageId: string, reaction: string | null) => {
    if (!chatId) return;

    setMessages(prev =>
        prev.map(msg => {
            if (msg.id === messageId) {
                return { ...msg, userReaction: msg.userReaction === reaction ? undefined : reaction };
            }
            return msg;
        })
    );

    try {
        const currentReaction = messages.find(m => m.id === messageId)?.userReaction;
        await updateMessageReaction(chatId, messageId, currentReaction === reaction ? null : reaction, false);
    } catch(e) {
        console.error("Failed to save reaction", e);
        toast({ title: "Could not save reaction.", variant: "destructive" });
    }
  }, [chatId, toast, messages]);


  const handleSendMessage = async (input: string, attachment: any) => {
    if ((!input.trim() && !attachment) || isLoading || !user) return;

    const commandRegex = /^\s*\/([\w-]+)/;
    const commandMatch = input.match(commandRegex);
    const command = commandMatch ? commandMatch[1] as ModelId : null;

    let cleanContent = input.trim();
    if (command) {
      cleanContent = cleanContent.replace(commandRegex, '').trim();
    }
    
    if (!cleanContent && !attachment) {
      toast({ title: "Empty message", description: "Please type a message or add an attachment.", variant: "destructive" });
      return;
    }

    const modelForCommand = allModels.find(m => m.id === command);
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
    
    const isGroupChat = (chatData?.aiMembers && chatData.aiMembers.length > 0) || (chatData?.customPersonas && chatData.customPersonas.length > 0);
    const persona = allModels.find(m => m.id === (command || chatData?.defaultModelId));
    const thinkingName = isGroupChat ? "AI Group" : (persona?.name || 'Xora');
    setThinkingEntity(thinkingName);
    
    let currentChatId = chatId;
    let newUserMessageId = '';
    
    // If starting a new chat (either because it's the first message ever, or because a persona was commanded)
    if (isStartingNewPersonaChat || !currentChatId) {
        if (showWelcome) setShowWelcome(false);
        try {
            const customTitle = modelForCommand ? `Chat with ${modelForCommand.name}` : undefined;
            const workspaceIdFromUrl = searchParams.get('workspaceId');
            const finalWorkspaceId = workspaceIdFromUrl ? workspaceIdFromUrl : undefined;
            const newChat = await createChatAndAddMessage(user, userMessage as Message, command || 'smart-ai', customTitle, finalWorkspaceId);
            
            currentChatId = newChat.id;
            
            await updateUserActivity(user.uid, 'FIRST_STEPS');
            
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
        newUserMessageId = await addMessageToChat(currentChatId, userMessage as Message);

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
    
    let stateHandled = false;
    try {
      const { file, url } = attachment || {};
      const lastAssistantMessage = [...currentMessages, userMessage].reverse().find(m => m.role === 'assistant');
      const lastResponseFeedback = lastAssistantMessage?.feedback;
      const lastUserReaction = lastAssistantMessage?.userReaction;
      
      const assistantAuthor: Author = { uid: 'ai', name: 'AI', avatar: '/ai-avatar.png' };

      // Route to appropriate flow
      if (isGroupChat && chatData) {
        stateHandled = true; // We will handle loading/thinking state manually
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

        // Main "thinking" is done, turn off main loader
        setIsLoading(false);
        setThinkingEntity(null);
        
        // Post each message sequentially with typing effects
        for (const res of groupResult.responses) {
            const persona = allPersonas.find(p => p.name === res.speaker);
            if (persona && currentChatId) {
                setThinkingEntity(persona.name);
                
                // Simulate typing delay based on message length
                const typingDelay = Math.max(1000, Math.min(res.content.length * 50, 4000));
                await new Promise(resolve => setTimeout(resolve, typingDelay));
                
                const groupAssistantMessage: Omit<Message, 'id'> = {
                    role: 'assistant',
                    author: { uid: persona.id, name: persona.name, avatar: '' },
                    content: res.content,
                    isPersonaResponse: true,
                    personaName: persona.name,
                    createdAt: new Date(),
                };

                setThinkingEntity(null);
                await addMessageToChat(currentChatId, groupAssistantMessage as Message);
                
                // Short pause before the next person 'starts typing'
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }


      } else if (isSinglePersonaInteraction(command || chatData?.defaultModelId)) {
        const personaInput: XoraPersonaInput = {
          prompt: cleanContent,
          history: buildModelSpecificHistory('xora', currentMessages),
          memoryProfile: memoryProfile || undefined,
          lastResponseFeedback,
          lastUserReaction,
          fileDataUri: file?.dataUri,
          url,
        };
        const result: XoraPersonaOutput = await runXoraPersonaFlow(personaInput);
        const personaModel = allModels.find(m => m.id === (command || chatData?.defaultModelId));

        const defaultVoice = personaModel?.voice || 'Umbriel';
        const emotionalVoice = getVoiceForEmotion(result.emotion, defaultVoice);
        const { media: audioDataUri } = await textToSpeech({ text: result.finalAnswer, voice: emotionalVoice });
        
        const singleResponse: AIResponse = {
            modelId: personaModel?.id || 'xora',
            content: result.finalAnswer,
            audioDataUri: audioDataUri,
        };
        
        const assistantMessage: Omit<Message, 'id'> = {
          role: 'assistant',
          author: { ...assistantAuthor, name: personaModel?.name || 'Xora Persona' },
          content: result.finalAnswer,
          responses: [singleResponse],
          isPersonaResponse: true,
          personaName: personaModel?.name || 'Xora Persona',
          detectedLanguage: result.detectedLanguage,
          createdAt: new Date(),
        };
        const assistantMessageId = await addMessageToChat(currentChatId, assistantMessage as Message);
        if (result.emojiReaction) {
            await updateMessageReaction(currentChatId, newUserMessageId, result.emojiReaction, true);
        }
      
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
        if (!stateHandled) {
          setIsLoading(false);
          setThinkingEntity(null);
        }
    }
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

  return (
    <div className="h-full flex flex-col">
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
                onPromptClick={(prompt) => handleSendMessage(prompt, null)}
                suggestions={promptSuggestions} 
                isLoading={isSuggestionsLoading}
             />
          </div>
        ) : (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.author?.uid === user?.uid}
                onFeedback={handleFeedback}
                onReact={handleReact}
              />
            ))}
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
            {thinkingEntity && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4"
              >
                  <Avatar className="h-8 w-8 border-2 border-primary/50">
                      <AvatarFallback className="bg-transparent"><Sparkles className="h-4 w-4 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className='max-w-lg rounded-lg p-3 text-sm shadow-md bg-muted flex items-center gap-2'>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{thinkingEntity} is thinking...</span>
                  </div>
              </motion.div>
            )}
        </div>
        )}
      </ScrollArea>
      <ChatInputForm 
        isLoading={isLoading}
        isCopilotLoading={isCopilotLoading}
        showWelcome={showWelcome}
        onSubmit={handleSendMessage}
        onCopilotRequest={handleCopilotRequest}
        onMediaChatOpen={openMediaChat}
      />
    </div>

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
