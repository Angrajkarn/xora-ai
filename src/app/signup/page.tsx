
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Github, Sparkles, Loader2 } from "lucide-react";
import { MotionDiv } from "@/components/ui/motion";
import { GoogleIcon } from "@/components/icons";
import { HeroBackground } from "@/components/hero-background";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, updateProfile, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState, useEffect } from "react";

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Redirect if user is already logged in client-side
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            const continueUrl = searchParams.get('continue');
            router.push(continueUrl || '/chat');
        } else {
            setIsAuthChecking(false);
        }
    });
    return () => unsubscribe();
  }, [router, searchParams]);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const handleAuthSuccess = async (user: FirebaseUser) => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session.');
      }
      
      toast({
        title: "Account Created",
        description: "Welcome! You've been successfully signed up.",
      });

      const continueUrl = searchParams.get('continue');
      router.push(continueUrl || '/chat');
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Session Error",
        description: error.message,
      });
      setIsLoading(false);
    }
  }

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(userCredential.user, {
        displayName: values.fullName,
      });
      await handleAuthSuccess(userCredential.user);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    const authProvider = provider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, authProvider);
      await handleAuthSuccess(result.user);
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Sign-in Failed",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const continueUrl = searchParams.get('continue');
  
  if (isAuthChecking) {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden">
            <HeroBackground />
            <Loader2 className="h-8 w-8 animate-spin z-10" />
        </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden">
      <HeroBackground />
      <MotionDiv
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md mx-auto z-10 p-4"
      >
        <Card className="glassmorphic">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
               <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Create an Account</CardTitle>
            <CardDescription>
              Get started for free. No credit card required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="glassmorphic" onClick={() => handleOAuthSignIn('google')} type="button" disabled={isLoading}>
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                  <Button variant="outline" className="glassmorphic" onClick={() => handleOAuthSignIn('github')} type="button" disabled={isLoading}>
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background/80 px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Ada Lovelace" {...field} className="bg-input/50" disabled={isLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="m@example.com" {...field} className="bg-input/50" disabled={isLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} className="bg-input/50" disabled={isLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 mt-4" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="mt-2 text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href={continueUrl ? `/login?continue=${continueUrl}` : "/login"} className="underline text-primary/80 hover:text-primary">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </MotionDiv>
    </div>
  );
}
