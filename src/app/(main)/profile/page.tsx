
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile, updatePassword, type User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, User as UserIcon, Flame, Brain, Heart, Target, Sparkles, Wand2 } from 'lucide-react';
import { MotionDiv } from '@/components/ui/motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getUserProfile, synthesizeAIProfile } from './actions';
import { BADGES, LEVEL_UP_BASE_XP, LEVEL_UP_FACTOR } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { MemorySynthesizerOutput } from '@/ai/flows/memory-synthesizer-flow';


const profileSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
});

const passwordSchema = z.object({
    newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});


const ProfilePageSkeleton = () => (
    <div className="space-y-8">
        <div className="space-y-2">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <Skeleton className="h-56" />
                <Skeleton className="h-80" />
            </div>
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-48" />
            </div>
        </div>
    </div>
);


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiProfile, setAiProfile] = useState<MemorySynthesizerOutput | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { toast } = useToast();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
    },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsLoading(true);
      setUser(currentUser);
      if (currentUser) {
        profileForm.setValue('fullName', currentUser.displayName || '');
        getUserProfile(currentUser.uid)
            .then(profile => setUserProfile(profile))
            .catch(err => {
                console.error("Failed to get user profile", err);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load your profile data.' });
            })
            .finally(() => setIsLoading(false));
      } else {
          setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [profileForm, toast]);

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: values.fullName });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    setIsPasswordSaving(true);
    try {
        await updatePassword(user, values.newPassword);
        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
        });
        passwordForm.reset();
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Password Update Failed",
            description: error.message + " You may need to sign in again to perform this action.",
        });
    } finally {
        setIsPasswordSaving(false);
    }
  }

  const handleAnalyzeProfile = async () => {
    if (!user) return;
    setIsAnalyzing(true);
    setAiProfile(null);
    setAnalysisError(null);

    try {
        const result = await synthesizeAIProfile(user.uid, user.displayName || 'User');
        if ('error' in result) {
            setAnalysisError(result.error);
        } else {
            setAiProfile(result);
            toast({ title: "AI Profile Generated!", description: "Xora has synthesized its memories of your conversations." });
        }
    } catch(e) {
        console.error(e);
        setAnalysisError('A critical error occurred. Please check the console.');
    } finally {
        setIsAnalyzing(false);
    }
}

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <ProfilePageSkeleton />
      </div>
    );
  }

  if (!user || !userProfile) {
    return <div className="p-4 sm:p-6 lg:p-8 text-center">Please sign in to view your profile.</div>;
  }
  
  const getUserInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return <UserIcon />;
  }

  const { level = 0, xp = 0, title = 'Newcomer', currentStreak = 0, badges: earnedBadges = [] } = userProfile;
  const xpForNextLevel = LEVEL_UP_BASE_XP * Math.pow(LEVEL_UP_FACTOR, level);
  const progressPercent = (xp / xpForNextLevel) * 100;
  
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-headline text-4xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">Manage your personal information, progress, and account settings.</p>
        </MotionDiv>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column for Avatar & Progress */}
          <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1 space-y-8"
          >
              <Card className="glassmorphic">
                  <CardHeader>
                      <CardTitle>Profile Picture</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                      <div className="relative group">
                          <Avatar className="h-32 w-32 border-4 border-primary/20">
                              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User avatar'} />
                              <AvatarFallback className="text-4xl">
                                  {getUserInitial()}
                              </AvatarFallback>
                          </Avatar>
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="h-4 w-4"/>
                          </Button>
                      </div>
                      <p className="text-muted-foreground text-sm text-center">Upload a new photo. We recommend a 200x200px image.</p>
                  </CardContent>
              </Card>

              <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle>Your AI Journey</CardTitle>
                    <CardDescription>Track your progress and achievements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <Badge variant="secondary" className="px-4 py-1 text-base font-bold bg-primary/10 text-primary border-primary/20">{title}</Badge>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <p className="font-semibold text-primary">Level {level}</p>
                            <p className="text-sm text-muted-foreground">{xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</p>
                        </div>
                        <Progress value={progressPercent} className="h-3" />
                    </div>
                    {currentStreak > 0 && (
                        <div className="flex items-center justify-center gap-2 text-orange-400 font-bold text-lg">
                            <Flame className="w-6 h-6" />
                            <span>{currentStreak} Day Streak</span>
                        </div>
                    )}
                    <Separator />
                    <div>
                        <h4 className="font-semibold mb-2 text-center">Badges Earned ({earnedBadges.length} / {BADGES.length})</h4>
                        <p className="text-center text-sm text-muted-foreground mb-4">
                          Earn these badges and create your own personalized AI!
                        </p>
                        <TooltipProvider>
                            <div className="grid grid-cols-4 gap-4">
                                {BADGES.slice(0, 8).map(badge => {
                                    const hasBadge = earnedBadges.includes(badge.id);
                                    return (
                                        <Tooltip key={badge.id}>
                                            <TooltipTrigger className="flex justify-center">
                                                <div className={cn(
                                                    "p-3 bg-primary/10 rounded-full border border-primary/20 aspect-square flex items-center justify-center transition-all",
                                                    hasBadge ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-card" : "opacity-40 grayscale"
                                                    )}>
                                                    <badge.icon className={cn("w-8 h-8", hasBadge ? "text-primary" : "text-muted-foreground")}/>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-semibold">{badge.name}</p>
                                                <p className="text-xs text-muted-foreground">{badge.description}</p>
                                                {!hasBadge && <p className="text-xs text-amber-400 font-bold">[LOCKED]</p>}
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </TooltipProvider>
                    </div>
                </CardContent>
              </Card>
          </MotionDiv>

          {/* Right column for Forms */}
          <div className="lg:col-span-2 space-y-8">
              <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your name and review your email address.</CardDescription>
                    </CardHeader>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="bg-input/50"/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <Input value={user.email || ''} disabled className="bg-input/50 opacity-70"/>
                                    <p className="text-xs text-muted-foreground pt-1">Your email address cannot be changed.</p>
                                </FormItem>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
              </MotionDiv>
              
              <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
              >
                  <Card className="glassmorphic">
                      <CardHeader>
                          <div className="flex items-center gap-3">
                              <Brain className="w-6 h-6 text-primary" />
                              <CardTitle>AI Memory Visualizer</CardTitle>
                          </div>
                          <CardDescription>See how Xora understands you based on your conversations. This is your "Human Mind UI."</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="font-semibold">Xora is analyzing your memories...</p>
                                    <p className="text-sm">This may take a moment.</p>
                                </div>
                          ) : aiProfile ? (
                               <MotionDiv
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="space-y-4"
                              >
                                  <div className="p-4 rounded-lg bg-background/50 border">
                                      <h4 className="font-semibold flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-pink-400"/> Relationship with Xora</h4>
                                      <p className="text-sm text-muted-foreground italic">"{aiProfile.relationshipWithAI}"</p>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div className="p-4 rounded-lg bg-background/50 border">
                                           <h4 className="font-semibold flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-yellow-400"/> Key Personality Traits</h4>
                                           <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                               {aiProfile.personalityTraits.map(trait => <li key={trait}>{trait}</li>)}
                                           </ul>
                                       </div>
                                       <div className="p-4 rounded-lg bg-background/50 border">
                                           <h4 className="font-semibold flex items-center gap-2 mb-2"><Wand2 className="w-4 h-4 text-blue-400"/> Key Interests</h4>
                                           <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                               {aiProfile.keyInterests.map(interest => <li key={interest}>{interest}</li>)}
                                           </ul>
                                       </div>
                                  </div>
                                   <div className="p-4 rounded-lg bg-background/50 border">
                                      <h4 className="font-semibold flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-green-400"/> Recent Goals & Projects</h4>
                                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                          {aiProfile.recentGoals.length > 0 ? aiProfile.recentGoals.map(goal => <li key={goal}>{goal}</li>) : <li>No specific goals detected recently.</li>}
                                      </ul>
                                  </div>
                              </MotionDiv>
                          ) : analysisError ? (
                              <div className="text-center py-4">
                                  <p className="text-destructive font-medium">{analysisError}</p>
                              </div>
                          ) : (
                              <div className="text-center py-4">
                                  <p className="text-muted-foreground">Click the button to generate an AI-powered summary of your profile.</p>
                              </div>
                          )}
                      </CardContent>
                      <CardFooter className="border-t px-6 py-4">
                           <Button onClick={handleAnalyzeProfile} disabled={isAnalyzing}>
                              {isAnalyzing ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                              ) : (
                                  <><Brain className="mr-2 h-4 w-4" />{aiProfile ? 'Re-Analyze Profile' : 'Generate AI Profile'}</>
                              )}
                          </Button>
                      </CardFooter>
                  </Card>
              </MotionDiv>

              <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
              >
                  <Card className="glassmorphic">
                      <CardHeader>
                          <CardTitle>Change Password</CardTitle>
                          <CardDescription>For your security, choose a strong new password.</CardDescription>
                      </CardHeader>
                      <Form {...passwordForm}>
                          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                              <CardContent className="space-y-4">
                                  <FormField
                                      control={passwordForm.control}
                                      name="newPassword"
                                      render={({ field }) => (
                                          <FormItem>
                                              <FormLabel>New Password</FormLabel>
                                              <FormControl>
                                                  <Input type="password" {...field} className="bg-input/50"/>
                                              </FormControl>
                                              <FormMessage />
                                          </FormItem>
                                      )}
                                  />
                                  <FormField
                                      control={passwordForm.control}
                                      name="confirmPassword"
                                      render={({ field }) => (
                                          <FormItem>
                                              <FormLabel>Confirm New Password</FormLabel>
                                              <FormControl>
                                                  <Input type="password" {...field} className="bg-input/50"/>
                                              </FormControl>
                                              <FormMessage />
                                          </FormItem>
                                      )}
                                  />
                              </CardContent>
                              <CardFooter className="border-t px-6 py-4">
                                  <Button type="submit" disabled={isPasswordSaving}>
                                      {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Update Password
                                  </Button>
                              </CardFooter>
                          </form>
                      </Form>
                  </Card>
              </MotionDiv>
              <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
              >
                  <Card className="glassmorphic border-destructive/50">
                      <CardHeader>
                          <CardTitle className="text-destructive">Danger Zone</CardTitle>
                          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive">Delete Account</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => alert('Account deletion is a critical action. Implement with care!')}>
                                      Continue
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </CardContent>
                  </Card>
              </MotionDiv>
          </div>
        </div>
      </div>
    </div>
  );
}
