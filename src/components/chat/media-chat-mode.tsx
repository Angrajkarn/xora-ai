
'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, X, Loader2, Volume2, VolumeX, Video, VideoOff, MicOff, PhoneOff, SwitchCamera, Expand, Minimize, Waves, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runXoraPersonaFlow, type XoraPersonaInput } from '@/ai/flows/aihub-persona-flow';
import { runInteractiveGroupChat } from '@/ai/flows/group-conversation-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { addMessageToChat, createChatAndAddMessage } from '@/services/chatService';
import { useRouter } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Message, Author, ChatSummary } from '@/lib/types';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MODELS, VOICES, getVoiceForEmotion } from '@/lib/constants';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

type Status = 'idle' | 'listening' | 'processing' | 'speaking';
type MediaChatModeType = 'voice' | 'video';

const parseTranscript = (transcript: string): { speaker: string, text: string }[] => {
    if (!transcript) return [];
    return transcript.split('\n')
      .map(line => line.trim())
      .filter(line => line.includes(':'))
      .map(line => {
          const parts = line.split(':');
          const speaker = parts[0].trim();
          const text = parts.slice(1).join(':').trim();
          return { speaker, text };
      });
};

const estimateDuration = (text: string): number => {
    // Average speaking rate: ~150 words/min. Average word length: ~5 chars.
    // So, ~750 chars/min. 60000ms / 750 chars = 80ms/char.
    const msPerChar = 80;
    const minDuration = 500; // minimum half a second
    return Math.max(minDuration, text.length * msPerChar);
};

// --- EMOTION MAPPING HELPERS ---
const getEmotionColor = (emotion?: string | null): string => {
    switch (emotion?.toLowerCase()) {
        case 'happy':
        case 'playful':
            return 'hsla(48, 95%, 58%, 0.4)'; // yellow-400
        case 'sad':
        case 'contemplative':
        case 'overwhelmed':
            return 'hsla(210, 89%, 64%, 0.4)'; // blue-400
        case 'frustrated':
        case 'angry':
            return 'hsla(0, 84%, 60%, 0.4)'; // red-500
        case 'romantic':
            return 'hsla(330, 84%, 60%, 0.4)'; // pink-500
        default:
            return 'hsla(var(--accent), 0.4)'; // default accent
    }
};

// --- UI COMPONENTS ---
const StatusIndicator = ({ status }: { status: Status }) => {
    const messages = {
        idle: 'Click the mic to start',
        listening: 'Listening...',
        processing: 'AI is thinking...',
        speaking: 'AI is speaking...',
    };

    return (
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-center text-muted-foreground z-20">
            <AnimatePresence mode="wait">
                <motion.p
                    key={status}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {messages[status]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
};

const AiAvatar = ({ status, emotion }: { status: Status; emotion?: string | null }) => {
    const emotionColor = useMemo(() => getEmotionColor(emotion), [emotion]);

    return (
        <motion.div
            className="relative w-[50vh] h-[50vh] sm:w-[60vh] sm:h-[60vh] "
            animate={status}
        >
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border"
                    variants={{
                        speaking: {
                            scale: 1 + i * 0.25,
                            opacity: 1 - i * 0.18,
                            borderColor: emotionColor,
                            transition: {
                                duration: 1.2,
                                repeat: Infinity,
                                repeatType: "mirror",
                                ease: "easeInOut",
                                delay: i * 0.15,
                            },
                        },
                        listening: {
                            scale: 1 + i * 0.05,
                            opacity: 0.1,
                            borderColor: 'hsla(var(--primary), 0.3)',
                        },
                        processing: {
                            scale: [1, 1.1, 1],
                            opacity: [0.2, 0.4, 0.2],
                            borderColor: 'hsla(var(--muted-foreground), 0.3)',
                            transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        },
                        idle: { scale: 1, opacity: 0.1, borderColor: 'hsla(var(--foreground), 0.1)' }
                    }}
                />
            ))}
            <motion.div
                className="absolute inset-1/4 rounded-full bg-primary/5 flex items-center justify-center"
                variants={{
                    speaking: {
                        scale: [1, 1.05, 1],
                        transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut", repeatType: 'mirror' }
                    },
                    listening: { scale: 1 },
                    idle: { scale: 1 },
                    processing: { scale: 1 }
                }}
            >
                <Sparkles className="w-1/3 h-1/3 text-primary/30" />
            </motion.div>
        </motion.div>
    );
};

const GroupCallVisualizer = ({ status, chatData, currentSpeaker }: { status: Status, chatData: ChatSummary | null, currentSpeaker: string | null }) => {
    const allPersonas = useMemo(() => {
        if (!chatData) return [];
        return [
            ...(chatData.aiMembers || []).map(id => MODELS.find(m => m.id === id)).filter(Boolean),
            ...(chatData.customPersonas || [])
        ].map(p => ({
            id: p!.id,
            name: p!.name,
            icon: p!.icon || Users,
        }));
    }, [chatData]);

    if (allPersonas.length === 0) {
        return <AiAvatar status={status} />;
    }
    
    const numPersonas = allPersonas.length;
    const gridClasses: {[key: number]: string} = {
        2: 'grid-cols-2 grid-rows-1',
        3: 'grid-cols-3 grid-rows-1',
        4: 'grid-cols-2 grid-rows-2',
        5: 'grid-cols-3 grid-rows-2',
        6: 'grid-cols-3 grid-rows-2',
    };
    const gridLayout = gridClasses[numPersonas] || 'grid-cols-3 grid-rows-2';


    return (
        <div className={`grid ${gridLayout} gap-4 p-8 w-full h-full max-w-[70vh] max-h-[70vh] items-center justify-center`}>
            {allPersonas.map(persona => (
                <motion.div 
                    key={persona.id}
                    className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg border-2 border-transparent transition-all duration-300 aspect-square"
                    animate={{
                        borderColor: currentSpeaker === persona.name ? 'hsla(var(--accent), 1)' : 'transparent',
                        scale: currentSpeaker === persona.name ? 1.1 : 1,
                        backgroundColor: currentSpeaker === persona.name ? 'hsla(var(--accent), 0.1)' : 'hsla(0, 0%, 100%, 0.05)',
                        boxShadow: currentSpeaker === persona.name ? '0 0 20px hsla(var(--accent), 0.5)' : 'none',
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
                         <persona.icon className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-white text-sm font-semibold text-center truncate w-full">{persona.name}</p>
                </motion.div>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---
export function MediaChatMode({
    mode,
    isOpen,
    onClose,
    chatId,
    setChatId,
    user,
    messages,
    chatData
}: {
    mode: MediaChatModeType;
    isOpen: boolean;
    onClose: () => void;
    chatId: string | undefined;
    setChatId: (id: string) => void;
    user: FirebaseUser;
    messages: Message[];
    chatData: ChatSummary | null;
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [status, setStatus] = useState<Status>('idle');
    const [userTranscript, setUserTranscript] = useState('');
    const [aiTranscript, setAiTranscript] = useState('');
    const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
    const [lastAiEmotion, setLastAiEmotion] = useState<string | null>(null);
    const speakerTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const wakeTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [activeVoice, setActiveVoice] = useState('Algenib');
    const [customVoiceReady, setCustomVoiceReady] = useState(false);
    
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isSoundMuted, setIsSoundMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isUserMainView, setIsUserMainView] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [canSwitchCamera, setCanSwitchCamera] = useState(false);
    const dragContainerRef = useRef(null);
    
    const [currentMode, setCurrentMode] = useState(mode);

    useEffect(() => {
        setCurrentMode(mode);
    }, [mode]);
    
    const isGroupChat = useMemo(() => {
        if (!chatData) return false;
        const aiMemberCount = chatData.aiMembers?.length || 0;
        const customPersonaCount = chatData.customPersonas?.length || 0;
        return (aiMemberCount + customPersonaCount) > 1;
    }, [chatData]);


    const stateRef = useRef({ status, chatId, messages, user, isMicMuted, activeVoice, isGroupChat, chatData });
    useEffect(() => {
        stateRef.current = { status, chatId, messages, user, isMicMuted, activeVoice, isGroupChat, chatData };
    });

    const cleanup = useCallback(() => {
        console.log("Cleaning up media chat mode...");
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        if (wakeTimerRef.current) {
            clearTimeout(wakeTimerRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        speakerTimeoutsRef.current.forEach(clearTimeout);
        speakerTimeoutsRef.current = [];
        setCurrentSpeaker(null);
        setLastAiEmotion(null);

        setStatus('idle');
        setUserTranscript('');
        setAiTranscript('');
        setHasCameraPermission(null);
        setCanSwitchCamera(false);
        setIsUserMainView(false);
    }, []);

    const startListening = useCallback(() => {
        const { status, isMicMuted } = stateRef.current;
        if (recognitionRef.current && status !== 'listening' && !isMicMuted) {
            console.log("Starting to listen...");
            setStatus('listening');
            setUserTranscript('');
            setAiTranscript('');
             try {
                recognitionRef.current.start();
            } catch (e) {
                console.warn("Speech recognition couldn't start, might be running already.", e);
            }
        }
    }, []);


    const handleSendMessage = useCallback(async (text: string) => {
        const { user: currentUser, chatId: currentChatId, messages: currentMessages, activeVoice: currentVoice, isGroupChat: currentIsGroupChat, chatData: currentChatData } = stateRef.current;
        
        if (!text.trim() || !currentUser) return;
        
        console.log("Sending message to AI:", text);
        setStatus('processing');
        
        const author: Author = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'User',
            avatar: currentUser.photoURL || undefined
        };
        const userMessage: Omit<Message, 'id'> = { role: 'user', content: text, author, createdAt: new Date() };

        let resolvedChatId = currentChatId;
        if (!resolvedChatId) {
            try {
                const newChat = await createChatAndAddMessage(currentUser, userMessage as Message, 'aihub');
                setChatId(newChat.id);
                router.push(`/chat/${newChat.id}`);
                resolvedChatId = newChat.id;
            } catch(e) {
                console.error("Failed to create chat:", e);
                toast({ title: "Error", description: "Could not start new chat.", variant: "destructive" });
                startListening();
                return;
            }
        } else {
             await addMessageToChat(resolvedChatId, userMessage as Message);
        }

        try {
            let transcript: string;
            let audioDataUri: string;

            if (currentIsGroupChat && currentChatData) {
                const allPersonas = [
                    ...(currentChatData.aiMembers || []).map(id => MODELS.find(m => m.id === id)).filter(Boolean),
                    ...(currentChatData.customPersonas || [])
                ].map(p => ({
                    id: p!.id,
                    name: p!.name,
                    instructions: p!.persona || p!.instructions,
                }));

                if (allPersonas.length < 1) throw new Error("Not enough personas for a group chat.");
                
                const historyForAI = [...currentMessages, userMessage].map(m => ({
                    role: m.role,
                    content: m.content,
                    authorName: m.author.name || (m.role === 'user' ? 'User' : 'AI'),
                }));

                const result = await runInteractiveGroupChat({ 
                    newMessage: text, 
                    history: historyForAI,
                    personas: allPersonas 
                });

                transcript = result.transcript;
                audioDataUri = result.audioDataUri;
                
                const assistantMessage: Omit<Message, 'id'> = {
                    role: 'assistant',
                    author: { uid: 'ai-group', name: 'AI Group' },
                    content: transcript,
                    isPersonaResponse: true,
                    personaName: 'AI Group',
                    createdAt: new Date(),
                };
                 if(resolvedChatId) await addMessageToChat(resolvedChatId, assistantMessage as Message);

                const speakerTurns = parseTranscript(transcript);
                let cumulativeDelay = 0;

                speakerTimeoutsRef.current.forEach(clearTimeout);
                speakerTimeoutsRef.current = [];

                speakerTurns.forEach((turn, index) => {
                    const duration = estimateDuration(turn.text);
                    const timeoutId = setTimeout(() => {
                        setCurrentSpeaker(turn.speaker);
                        if (index === speakerTurns.length - 1) {
                            const clearTimeoutId = setTimeout(() => {
                                setCurrentSpeaker(null);
                            }, duration);
                            speakerTimeoutsRef.current.push(clearTimeoutId);
                        }
                    }, cumulativeDelay);

                    speakerTimeoutsRef.current.push(timeoutId);
                    cumulativeDelay += duration;
                });

            } else {
                 setCurrentSpeaker(null);
                 const history = currentMessages.slice(-6).map(m => ({ role: m.role, content: m.content } as { role: 'user' | 'assistant', content: string }));
                 const personaInput: XoraPersonaInput = { prompt: text, history };
                 const result = await runXoraPersonaFlow(personaInput);
                 transcript = result.finalAnswer;
                 setLastAiEmotion(result.emotion);

                 const selectedVoice = getVoiceForEmotion(result.emotion, currentVoice);

                 const { media } = await textToSpeech({ text: transcript, voice: selectedVoice });
                 audioDataUri = media;
                 
                 const assistantMessage: Omit<Message, 'id'> = {
                    role: 'assistant',
                    author: { uid: 'ai', name: 'Xora Persona' },
                    content: transcript,
                    isPersonaResponse: true,
                    personaName: 'Xora Persona',
                    createdAt: new Date(),
                };
                 if(resolvedChatId) await addMessageToChat(resolvedChatId, assistantMessage as Message);
            }

            setAiTranscript(transcript);
            if (audioRef.current) {
                audioRef.current.src = audioDataUri;
                audioRef.current.play();
                setStatus('speaking');
            }

        } catch(e) {
            console.error("AI/TTS Error:", e);
            toast({ title: "Error", description: "Could not get a response from AI.", variant: "destructive" });
            startListening();
        }

    }, [router, setChatId, toast, startListening]);
    
    // Main setup effect
    useEffect(() => {
        if (!isOpen) {
            cleanup();
            return;
        }
        
        const getMediaPermissions = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: currentMode === 'video' ? { facingMode } : false, audio: true });
                streamRef.current = stream;
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                 if(currentMode === 'video' && !isCameraOn) {
                    setIsCameraOn(true);
                }
            } catch (error) {
                console.error("Error accessing media devices:", error);
                setHasCameraPermission(false);
                toast({
                    variant: "destructive",
                    title: "Media Access Denied",
                    description: "Please enable camera and microphone permissions in your browser settings.",
                    duration: 9000
                });
                return;
            }
        
            const { isGroupChat: currentIsGroupChat, chatData: currentChatData } = stateRef.current;
            let initialVoice = 'Algenib';

            if (!currentIsGroupChat) {
                const personaId = currentChatData?.defaultModelId;
                const persona = MODELS.find(m => m.id === personaId);
                if (persona?.voice) {
                    initialVoice = persona.voice;
                } else {
                    initialVoice = localStorage.getItem('xora-voice') || 'Algenib';
                }
            } else {
                 initialVoice = localStorage.getItem('xora-voice') || 'Algenib';
            }
            setActiveVoice(initialVoice);
            if (initialVoice === 'Custom') {
                setCustomVoiceReady(true);
            }


            if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
                toast({ title: "Compatibility Error", description: "Your browser does not support voice recognition.", variant: "destructive" });
                onClose();
                return;
            }

            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognitionAPI();
            const recognition = recognitionRef.current;
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            let finalTranscript = '';

            recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setUserTranscript(finalTranscript + interimTranscript);
            };
            
            recognition.onend = () => {
                const { status: currentStatus } = stateRef.current;
                console.log("Recognition ended. Status:", currentStatus, "Transcript:", finalTranscript);
                if (currentStatus === 'listening' && finalTranscript.trim()) {
                    handleSendMessage(finalTranscript);
                } else if (currentStatus === 'listening') {
                    startListening();
                }
                finalTranscript = '';
            };

            recognition.onerror = (event) => {
                if (event.error === 'aborted' || event.error === 'no-speech') {
                    console.warn(`Speech recognition inactive: ${event.error}`);
                    if (stateRef.current.status === 'listening') {
                        startListening();
                    }
                    return;
                }
                console.error("Speech recognition error", event.error);
                toast({ title: "Voice Error", description: `An error occurred: ${event.error}`, variant: "destructive" });
                setStatus('idle');
            };

            if (!audioRef.current) {
                audioRef.current = new Audio();
                audioRef.current.onended = () => {
                    if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
                    wakeTimerRef.current = setTimeout(startListening, 500);
                };
            }
            startListening();
        };

        const checkDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(device => device.kind === 'videoinput');
                setCanSwitchCamera(videoInputs.length > 1);
            } catch (err) {
                console.warn("Could not enumerate devices:", err);
                setCanSwitchCamera(false);
            }
        };

        getMediaPermissions().then(checkDevices);

        return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentMode, facingMode]);

    useEffect(() => {
        if(audioRef.current) {
            audioRef.current.muted = isSoundMuted;
        }
    }, [isSoundMuted]);

    const handleVoiceChange = (newVoice: string) => {
        setActiveVoice(newVoice);
        localStorage.setItem('xora-voice', newVoice);
        toast({ title: `Voice changed to ${newVoice}` });
    };

    const toggleMic = () => {
        const nextState = !isMicMuted;
        setIsMicMuted(nextState);
        if (nextState) { // Muting
            recognitionRef.current?.stop();
            setStatus('idle');
        } else { // Unmuting
            startListening();
        }
    };
    
    const toggleCamera = () => {
        if (!streamRef.current) return;
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !isCameraOn;
            setIsCameraOn(!isCameraOn);
        }
    };

    const handleToggleMainView = useCallback(() => {
        setIsUserMainView(prev => !prev);
    }, []);

    const handleSwitchCamera = useCallback(async () => {
        if (!streamRef.current) return;

        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';

        try {
            // Request the new stream first. This is safer.
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacingMode },
                audio: true,
            });

            // If successful, stop the old stream's tracks
            streamRef.current.getTracks().forEach(track => track.stop());

            // Assign the new stream
            streamRef.current = newStream;
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }

            // Update state after success
            setFacingMode(newFacingMode);
            // Ensure the camera is visually enabled after switching
            setIsCameraOn(true); 
            newStream.getVideoTracks().forEach(track => track.enabled = true);

        } catch (error) {
            console.error("Error switching camera:", error);
            toast({
                variant: "destructive",
                title: "Camera Switch Failed",
                description: "Could not switch to the other camera. It might not be available.",
            });
        }
    }, [facingMode, toast]);

    const allVoices = useMemo(() => {
        const baseVoices = [...VOICES];
        if (customVoiceReady) {
            baseVoices.unshift({
                id: 'Custom',
                name: 'Custom Voice',
                gender: 'Your Voice',
                description: 'A clone of your own voice, created from your recording.'
            });
        }
        return baseVoices;
    }, [customVoiceReady]);


    const micVariants = {
        listening: { scale: [1, 1.2, 1], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } },
        speaking: { scale: [1, 1.2, 1], transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" } },
        processing: { scale: 1 },
        idle: { scale: 1 },
    };

    const transcript = userTranscript || aiTranscript;

    const voiceSelectorPopoverContent = (
        <div className="grid gap-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Change Voice</h4>
                <p className="text-sm text-muted-foreground">Select a voice for the assistant.</p>
            </div>
            <ScrollArea className="max-h-60">
                <RadioGroup value={activeVoice} onValueChange={handleVoiceChange} className="grid gap-2 pr-2">
                    {allVoices.map(voice => (
                        <Label key={voice.id} htmlFor={`media-voice-${voice.id}`} className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <span>{voice.name} ({voice.gender})</span>
                            <RadioGroupItem value={voice.id} id={`media-voice-${voice.id}`} />
                        </Label>
                    ))}
                </RadioGroup>
            </ScrollArea>
        </div>
    );

    if (currentMode === 'voice') {
         return (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
                <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMode('video')} className="w-10 h-10">
                        <Video className="w-6 h-6"/>
                        <span className="sr-only">Switch to Video Mode</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsSoundMuted(prev => !prev)} className="w-10 h-10">
                        {isSoundMuted ? <VolumeX className="w-6 h-6"/> : <Volume2 className="w-6 h-6"/>}
                        <span className="sr-only">{isSoundMuted ? 'Unmute' : 'Mute'}</span>
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-10 h-10">
                                <Sparkles className="w-6 h-6" />
                                <span className="sr-only">Change Voice</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 glassmorphic">
                           {voiceSelectorPopoverContent}
                        </PopoverContent>
                    </Popover>
                    <Button variant="ghost" size="icon" className="w-10 h-10" onClick={onClose}>
                        <X className="w-6 h-6"/>
                        <span className="sr-only">Close Voice Mode</span>
                    </Button>
                </div>
                <AnimatePresence>
                    {transcript && (
                        <motion.div
                            key="transcript" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-4xl text-center px-8 prose prose-2xl lg:prose-3xl dark:prose-invert prose-p:my-2"
                        >
                           <p className="font-semibold tracking-tight">{transcript}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                        className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center transition-shadow duration-500"
                        animate={status}
                        variants={{
                            listening: { boxShadow: '0 0 80px 20px hsla(var(--primary), 0.4)' },
                            speaking: { boxShadow: `0 0 80px 20px ${getEmotionColor(lastAiEmotion)}` },
                            processing: { boxShadow: '0 0 60px 10px hsla(var(--muted-foreground), 0.2)' },
                            idle: { boxShadow: '0 0 0px 0px hsla(var(--muted-foreground), 0)' },
                        }}
                    >
                        <motion.button
                            onClick={startListening}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/20 flex items-center justify-center"
                            animate={status}
                            variants={micVariants}
                            disabled={status !== 'idle'}
                        >
                            {status === 'processing' ? <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" />
                            : status === 'speaking' ? <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-accent" />
                            : <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />}
                        </motion.button>
                    </motion.div>
                </div>
                <StatusIndicator status={status} />
            </div>
        );
    }
    
    // Video Mode UI
    return (
        <div ref={dragContainerRef} className="w-full h-full flex flex-col items-center justify-center relative bg-black">
            {/* Main Viewport */}
             <motion.div
                layout
                transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                {!isUserMainView && isGroupChat && (
                    <GroupCallVisualizer 
                        status={status} 
                        chatData={chatData} 
                        currentSpeaker={currentSpeaker}
                    />
                )}
                {!isUserMainView && !isGroupChat && <AiAvatar status={status} emotion={lastAiEmotion} />}
            </motion.div>
            
            {/* User Video Container (this is the one that moves) */}
            <motion.div
                layout
                drag={!isUserMainView}
                dragConstraints={dragContainerRef}
                dragMomentum={false}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                className={cn(
                    "overflow-hidden shadow-2xl border-2 border-white/20 z-20 bg-black",
                    isUserMainView 
                        ? "absolute inset-0" 
                        : "absolute bottom-6 right-6 w-40 h-auto sm:w-64 rounded-lg aspect-video",
                    !isUserMainView && "cursor-grab active:cursor-grabbing"
                )}
            >
                 <video ref={videoRef} className={cn(
                    "w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300",
                    isCameraOn ? "opacity-100" : "opacity-0"
                )} autoPlay muted playsInline />
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                    isCameraOn ? "opacity-0" : "opacity-100"
                )}>
                    <VideoOff className="w-10 h-10 text-white/50" />
                </div>
            </motion.div>

             {/* AI PiP Container (only visible when user is main) */}
            {isUserMainView && (
                <motion.div
                    layout
                    drag
                    dragConstraints={dragContainerRef}
                    dragMomentum={false}
                    transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                    className="absolute bottom-6 right-6 w-40 h-auto sm:w-64 rounded-lg aspect-video overflow-hidden shadow-2xl border-2 border-white/20 z-20 bg-black cursor-grab active:cursor-grabbing"
                >
                   <div className="w-full h-full flex items-center justify-center">
                        {isGroupChat ? <Users className="w-10 h-10 text-primary/50" /> : <AiAvatar status={status} emotion={lastAiEmotion} />}
                    </div>
                </motion.div>
            )}


            {/* Permission Denied Alert */}
            {hasCameraPermission === false && (
                <motion.div 
                    className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Alert variant="destructive">
                        <AlertTitle>Camera &amp; Mic Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera and microphone access in your browser settings to use video chat.
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {/* Transcript */}
             <AnimatePresence>
                {transcript && (
                     <motion.div
                        key="transcript"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[150%] sm:-translate-y-[200%] w-full max-w-4xl text-center px-8 z-10"
                    >
                         <p className="text-3xl lg:text-5xl font-semibold tracking-tight text-white prose prose-2xl lg:prose-3xl dark:prose-invert" style={{textShadow: '0 2px 10px rgba(0,0,0,0.7)'}}>
                            {transcript}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/20">
                     <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={() => setCurrentMode('voice')}>
                        <Waves className="w-6 h-6" />
                        <span className="sr-only">Switch to Voice Mode</span>
                    </Button>
                    <Button variant="ghost" size="icon" className={cn("rounded-full w-14 h-14", isMicMuted && "bg-destructive/50 hover:bg-destructive/70")} onClick={toggleMic}>
                        {isMicMuted ? <MicOff className="w-6 h-6"/> : <Mic className="w-6 h-6"/>}
                    </Button>
                    <Button variant="ghost" size="icon" className={cn("rounded-full w-14 h-14", !isCameraOn && "bg-destructive/50 hover:bg-destructive/70")} onClick={toggleCamera}>
                        {isCameraOn ? <Video className="w-6 h-6"/> : <VideoOff className="w-6 h-6"/>}
                    </Button>
                    
                     {canSwitchCamera && (
                        <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={handleSwitchCamera}>
                            <SwitchCamera className="w-6 h-6"/>
                        </Button>
                    )}

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full w-14 h-14">
                                <Sparkles className="w-6 h-6" />
                                <span className="sr-only">Change Voice</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 glassmorphic" side="top" align="center">
                           {voiceSelectorPopoverContent}
                        </PopoverContent>
                    </Popover>

                    <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={handleToggleMainView}>
                        {isUserMainView ? <Minimize className="w-6 h-6"/> : <Expand className="w-6 h-6"/>}
                    </Button>

                    <Button variant="destructive" size="icon" className="rounded-full w-16 h-14" onClick={onClose}>
                        <PhoneOff className="w-6 h-6"/>
                    </Button>
                </div>
            </div>
        </div>
    );
}
