
'use client';

import Link from 'next/link';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight, Github, Palette, UserCircle, Bell, Sparkles, Upload, PlayCircle, Loader2, CheckCircle, Waves, Info } from 'lucide-react';
import { MotionDiv } from '@/components/ui/motion';
import { ThemeToggle } from '@/components/theme-toggle';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MODELS, VOICES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { cloneVoice } from '@/ai/flows/voice-clone-flow';
import { Slider } from '@/components/ui/slider';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { settingsSchema, type SettingsData } from '@/lib/schemas';
import { sendWelcomeEmail, sendUnsubscribeEmail } from '@/services/notificationService';
import { getUserPreferences, saveUserPreferences } from '@/services/userService';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function SettingsPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [initialPreferences, setInitialPreferences] = useState<SettingsData | null>(null);
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [customVoiceReady, setCustomVoiceReady] = useState(false);
    
    const form = useForm<SettingsData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            notifications: {
                email: false,
                push: false,
                weeklySummary: false,
            },
            ai: {
                defaultModel: 'smart-ai',
                responseStyle: 'balanced',
                voice: 'Algenib'
            },
        },
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, currentUser => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getUserPreferences(user.uid)
                .then((prefs) => {
                    const defaultValues = form.getValues();
                    const loadedPrefs = {
                        ai: { ...defaultValues.ai, ...prefs.ai },
                        notifications: { ...defaultValues.notifications, ...prefs.notifications },
                    };
                    form.reset(loadedPrefs);
                    setInitialPreferences(loadedPrefs);
                    if(prefs.ai?.voice === 'Custom') {
                        setCustomVoiceReady(true);
                    }
                })
                .catch(err => {
                    console.error("Failed to load user preferences:", err);
                    toast({ title: "Error", description: "Could not load your saved settings.", variant: "destructive" });
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [user, form, toast]);
    
    async function onSubmit(data: SettingsData) {
        if (!user || !user.email || !initialPreferences) return;

        setIsSaving(true);
        
        const result = await saveUserPreferences(user.uid, data);
        
        if (result.success) {
            toast({
                title: "Preferences Saved",
                description: "Your settings have been updated successfully.",
            });
            
            // --- Push Notification Logic ---
            const wasPushSubscribed = initialPreferences.notifications.push;
            const isPushSubscribed = data.notifications.push;
            if (isPushSubscribed && !wasPushSubscribed) {
                // In a real app, this is where you would request push permission from the user.
                // For this simulation, we'll just show a toast.
                toast({
                    title: "Push Notifications Enabled",
                    description: "You would normally see a browser prompt to allow notifications here."
                });
            }

            // --- Email Notification Logic ---
            const wasEmailSubscribed = initialPreferences.notifications.email;
            const isEmailSubscribed = data.notifications.email;
            let emailResult: { success: boolean; error?: string } | null = null;

            if (isEmailSubscribed && !wasEmailSubscribed) {
                // User just subscribed - call the server action
                emailResult = await sendWelcomeEmail(user.uid, user.email);
            } else if (!isEmailSubscribed && wasEmailSubscribed) {
                // User just unsubscribed
                emailResult = await sendUnsubscribeEmail(user.email);
            }

            if (emailResult) {
                 if (emailResult.success) {
                     toast({
                        title: isEmailSubscribed ? "Subscription Confirmed!" : "Unsubscribed",
                        description: `A confirmation email has been sent to ${user.email}.`
                     });
                 } else {
                     toast({
                         variant: 'destructive',
                         title: "Failed to Send Email",
                         description: `Error: ${emailResult.error}. Please check your .env credentials and ensure you're using a Gmail App Password.`,
                         duration: 9000,
                     });
                 }
            }
            setInitialPreferences(data);

        } else {
             toast({
                title: "Error Saving",
                description: result.error,
                variant: 'destructive',
            });
        }
        setIsSaving(false);
    }

    const handleVoiceChange = (value: string) => {
        form.setValue('ai.voice', value);
        localStorage.setItem('xora-voice', value);
        toast({
            title: "Voice Changed",
            description: `Default voice is now set to ${value}.`
        })
    }
    
    const handlePreviewVoice = async (voiceId: string, voiceName: string) => {
        if (previewingVoice) return;

        setPreviewingVoice(voiceId);
        if(audio) audio.pause();

        try {
            const { media } = await textToSpeech({ text: `Hello, my name is ${voiceName}. This is what my voice sounds like.`, voice: voiceId });
            const newAudio = new Audio(media);
            setAudio(newAudio);
            newAudio.play();
            newAudio.onended = () => setPreviewingVoice(null);
        } catch (error) {
            console.error("Failed to generate voice preview:", error);
            toast({
                title: 'Preview Failed',
                description: 'Could not generate the voice preview.',
                variant: 'destructive',
            });
            setPreviewingVoice(null);
        }
    };
    
    const handleCustomVoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ title: 'File too large', description: 'Please upload a file smaller than 5MB.', variant: 'destructive' });
            return;
        }

        setIsCloning(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (loadEvent) => {
                const audioDataUri = loadEvent.target?.result as string;
                const result = await cloneVoice({ audioDataUri });

                if (result.success) {
                    setCustomVoiceReady(true);
                    handleVoiceChange('Custom');
                    toast({
                        title: 'Voice Cloned!',
                        description: result.message,
                    });
                } else {
                    throw new Error(result.message);
                }
                setIsCloning(false);
            };
            reader.onerror = () => {
                 throw new Error("Could not read file.");
            }
        } catch (error: any) {
            console.error('Voice cloning failed:', error);
            toast({
                title: 'Cloning Failed',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive'
            });
            setIsCloning(false);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const allVoices = [...VOICES];
    if (customVoiceReady) {
        allVoices.unshift({
            id: 'Custom',
            name: 'Custom Voice',
            gender: 'Your Voice',
            description: 'A clone of your own voice, created from your recording.'
        });
    }

    if (isLoading) {
        return (
            <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="space-y-8">
                    <Skeleton className="h-12 w-1/3" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <Skeleton className="h-64 lg:h-80" />
                        <Skeleton className="h-96 lg:h-[40rem] lg:col-span-2" />
                        <Skeleton className="h-80 lg:col-span-2" />
                        <Skeleton className="h-64" />
                    </div>
                </div>
            </div>
        )
    }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <MotionDiv
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <h1 className="font-headline text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences.</p>
        </MotionDiv>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <MotionDiv
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
              >
                {/* --- Left Column / Top Cards --- */}
                <div className="lg:col-span-1 space-y-8">
                    <MotionDiv variants={itemVariants}>
                        <Card className="glassmorphic h-full flex flex-col">
                            <CardHeader className="flex-row gap-4 items-center">
                            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                                <UserCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="font-headline">Account</CardTitle>
                                <CardDescription>Manage your profile & security.</CardDescription>
                            </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">
                                Update your personal details, change your password, and manage your account security settings.
                            </p>
                            </CardContent>
                            <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/profile">
                                Manage Account <ArrowRight className="ml-2"/>
                                </Link>
                            </Button>
                            </CardFooter>
                        </Card>
                    </MotionDiv>
                    <MotionDiv variants={itemVariants}>
                        <Card className="glassmorphic h-full flex flex-col">
                            <CardHeader className="flex-row gap-4 items-center">
                            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                                <Palette className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="font-headline">Appearance</CardTitle>
                                <CardDescription>Customize the look and feel.</CardDescription>
                            </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                    <Label>Theme</Label>
                                    <ThemeToggle />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </MotionDiv>
                </div>
                {/* --- Right Column / Main AI Card --- */}
                <MotionDiv variants={itemVariants} className="lg:col-span-2">
                    <Card className="glassmorphic h-full flex flex-col">
                        <CardHeader className="flex-row gap-4 items-center">
                            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="font-headline">AI & Voice Settings</CardTitle>
                                <CardDescription>Customize your core AI and voice experience.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-6 pt-6">
                            {/* AI PREFERENCES PART */}
                             <div className="space-y-6">
                                <h4 className="font-medium text-foreground">AI Preferences</h4>
                                <FormField
                                    control={form.control}
                                    name="ai.defaultModel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Default Model</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a default model" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glassmorphic">
                                                    {MODELS.map(model => (
                                                        <SelectItem key={model.id} value={model.id}>
                                                            <div className="flex items-center gap-2">
                                                                <model.icon className="h-4 w-4"/>
                                                                {model.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>The model used when no specific model is commanded.</FormDescription>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ai.responseStyle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Response Style</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="grid grid-cols-3 gap-4"
                                                >
                                                   <Label htmlFor="concise" className="flex h-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                      <RadioGroupItem value="concise" id="concise" className="sr-only peer" />
                                                       Concise
                                                   </Label>
                                                   <Label htmlFor="balanced" className="flex h-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                      <RadioGroupItem value="balanced" id="balanced" className="sr-only peer" />
                                                       Balanced
                                                   </Label>
                                                   <Label htmlFor="detailed" className="flex h-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                      <RadioGroupItem value="detailed" id="detailed" className="sr-only peer" />
                                                       Detailed
                                                   </Label>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />
                            {/* AI VOICE PART */}
                            <div className="space-y-6">
                                <h4 className="font-medium text-foreground">AI Voice Selection</h4>
                                <FormField
                                    control={form.control}
                                    name="ai.voice"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormControl>
                                                <RadioGroup onValueChange={handleVoiceChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {allVoices.map((voice) => (
                                                        <FormItem key={voice.id}>
                                                            <FormControl>
                                                                <RadioGroupItem value={voice.id} id={voice.id} className="sr-only peer" />
                                                            </FormControl>
                                                            <Label htmlFor={voice.id} className="flex h-full cursor-pointer flex-col items-start justify-center rounded-lg border-2 border-muted bg-background/50 p-4 transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                                <div className="flex w-full items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="bg-primary/10 p-2 rounded-full border border-primary/20">
                                                                            <Waves className="h-5 w-5 text-primary" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold">{voice.name}</p>
                                                                            <p className="text-sm text-muted-foreground">{voice.gender}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.preventDefault(); handlePreviewVoice(voice.id, voice.name);}} disabled={!!previewingVoice}>
                                                                            {previewingVoice === voice.id ? <Loader2 className="w-5 h-5 animate-spin"/> : <PlayCircle className="w-5 w-5" />}
                                                                        </Button>
                                                                        <AnimatePresence>
                                                                            {field.value === voice.id && (
                                                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                                                    <CheckCircle className="h-5 w-5 text-primary" />
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                </div>
                                                                <p className="mt-2 text-sm text-muted-foreground pl-14">{voice.description}</p>
                                                            </Label>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                            <Separator />
                            {/* VOICE CLONING PART */}
                            <div>
                                <h4 className="font-medium text-foreground mb-3">Custom Voice Cloning</h4>
                                <Input id="voice-upload" type="file" ref={fileInputRef} onChange={handleCustomVoiceUpload} accept="audio/*" className="hidden"/>
                                <Button type="button" variant="outline" className="w-full glassmorphic" onClick={() => fileInputRef.current?.click()} disabled={isCloning}>
                                    {isCloning ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Uploading & Cloning...</>
                                    ) : (
                                        <><Upload className="mr-2 h-4 w-4"/>Upload & Clone Your Voice</>
                                    )}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">Securely upload a voice recording (MP3, WAV, max 5MB) to create your own custom AI voice. This is a simulation.</p>
                            </div>
                            
                             <Separator />
                             {/* VOICE CUSTOMIZATION PART */}
                            <div>
                                <h4 className="font-medium text-foreground mb-3">Voice Customization</h4>
                                <div className="space-y-8 rounded-lg border p-4 opacity-50 cursor-not-allowed">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label>Playback Speed</Label>
                                            <span className="text-sm text-muted-foreground">1.0x</span>
                                        </div>
                                        <Slider defaultValue={[10]} max={20} step={1} disabled/>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label>Pitch</Label>
                                            <span className="text-sm text-muted-foreground">Normal</span>
                                        </div>
                                        <Slider defaultValue={[10]} max={20} step={1} disabled/>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center pt-2">Voice fine-tuning is coming soon.</p>
                                </div>
                            </div>

                          </CardContent>
                      </Card>
                  </MotionDiv>

                {/* --- Bottom Row Cards --- */}
                <MotionDiv variants={itemVariants} className="lg:col-span-2">
                      <Card className="glassmorphic h-full flex flex-col">
                          <CardHeader className="flex-row gap-4 items-center">
                              <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                                  <Bell className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                  <CardTitle className="font-headline">Notifications</CardTitle>
                                  <CardDescription>Manage how you get notified.</CardDescription>
                              </div>
                          </CardHeader>
                          <CardContent className="flex-grow space-y-4">
                              <FormField
                                  control={form.control}
                                  name="notifications.email"
                                  render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                          <div className="space-y-0.5">
                                              <FormLabel>Email Notifications</FormLabel>
                                              <FormDescription className="pr-4">Receive important updates.</FormDescription>
                                          </div>
                                          <FormControl>
                                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                                          </FormControl>
                                      </FormItem>
                                  )}
                              />
                              <FormField
                                  control={form.control}
                                  name="notifications.push"
                                  render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                          <div className="space-y-0.5">
                                              <FormLabel>Push Notifications</FormLabel>
                                              <FormDescription className="pr-4">Get real-time alerts & re-engagement pings.</FormDescription>
                                          </div>
                                          <FormControl>
                                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                                          </FormControl>
                                      </FormItem>
                                  )}
                              />
                              <FormField
                                  control={form.control}
                                  name="notifications.weeklySummary"
                                  render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                          <div className="space-y-0.5">
                                              <FormLabel>Weekly Summary</FormLabel>
                                              <FormDescription className="pr-4">Get a weekly digest of your activity.</FormDescription>
                                          </div>
                                          <FormControl>
                                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                                          </FormControl>
                                      </FormItem>
                                  )}
                              />
                          </CardContent>
                      </Card>
                </MotionDiv>
                <MotionDiv variants={itemVariants} className="lg:col-span-1">
                      <Card className="glassmorphic h-full">
                          <CardHeader className="flex-row gap-4 items-center">
                            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                                <Info className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="font-headline">About Xora</CardTitle>
                                <CardDescription>Version and links.</CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">App Version</span>
                                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">1.0.0-beta</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Framework</span>
                                  <span>Next.js</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Source Code</span>
                                  <Button variant="outline" size="sm" asChild>
                                      <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                                          <Github className="mr-2"/> View on GitHub
                                      </a>
                                  </Button>
                              </div>
                          </CardContent>
                      </Card>
                </MotionDiv>

              </MotionDiv>

              <MotionDiv
                  className="flex justify-end"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
              >
                  <Button type="submit" size="lg" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save All Preferences
                  </Button>
              </MotionDiv>
          </form>
        </Form>
      </div>
    </div>
  );
}
