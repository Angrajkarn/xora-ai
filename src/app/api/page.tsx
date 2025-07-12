'use client';

import React, { useState, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MotionDiv } from '@/components/ui/motion';
import { Code, Copy, PlusCircle, Trash2, Check, ExternalLink, KeyRound, Webhook, Terminal, Sparkles, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
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
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { HeroBackground } from '@/components/hero-background';

// --- SKELETON LOADER ---
const ApiPageSkeleton = () => (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="space-y-8">
            <div>
                <Skeleton className="h-10 w-1/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
                <Skeleton className="h-48"/>
                <Skeleton className="h-48"/>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <Skeleton className="h-6 w-32 mb-2"/>
                        <Skeleton className="h-4 w-56"/>
                    </div>
                    <Skeleton className="h-10 w-40" />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-20"/></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full"/></TableCell>)}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
);


// --- LOGGED-IN VIEW ---
interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: Date;
  lastUsed: Date | null;
  status: 'active' | 'revoked';
}
const generateApiKey = (): string => `sk-${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;
const initialApiKeys: ApiKey[] = [
  { id: 'key_1', name: 'Default Production Key', key: generateApiKey(), created: new Date('2024-06-15'), lastUsed: new Date('2024-07-20'), status: 'active' },
];

const ApiKeysManager = () => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setApiKeys(initialApiKeys);
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        toast({ title: 'API Key Copied', description: 'The key has been copied to your clipboard.' });
        setTimeout(() => setCopiedKey(null), 2000);
    };
    
    const handleGenerateKey = (name: string) => {
        const newKey: ApiKey = { id: `key_${apiKeys.length + 1}`, name, key: generateApiKey(), created: new Date(), lastUsed: null, status: 'active' };
        setApiKeys(prev => [...prev, newKey]);
        toast({ title: 'New Key Generated', description: `Key "${name}" has been created.` });
    }

    const handleRevokeKey = (keyId: string) => {
        setApiKeys(prev => prev.map(key => key.id === keyId ? { ...key, status: 'revoked' } : key));
        toast({ title: 'API Key Revoked', description: 'The key has been revoked and can no longer be used.' });
    };
    
    const GenerateKeyDialog = () => {
        const [name, setName] = useState('');
        const [open, setOpen] = useState(false);
        
        const onGenerate = () => {
            if (name.trim()) {
                handleGenerateKey(name);
                setOpen(false);
                setName('');
            } else {
                 toast({ title: 'Name Required', description: 'Please provide a name for the key.', variant: 'destructive' });
            }
        }
        
        return (
             <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><PlusCircle className="mr-2"/> Generate New Key</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md glassmorphic">
                    <DialogHeader>
                        <DialogTitle className="font-headline">Generate New API Key</DialogTitle>
                        <DialogDescription>Give your new key a descriptive name to help you identify it later.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label htmlFor="key-name">Key Name</Label>
                        <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., My Production App" className="bg-input/50"/>
                    </div>
                    <DialogFooter><Button type="button" onClick={onGenerate}>Generate Key</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }
    
    if (isLoading) return <div className="container mx-auto max-w-7xl px-4 md:px-6 py-12"><ApiPageSkeleton /></div>;

    return (
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-12">
            <div className="space-y-8">
                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="font-headline text-4xl font-bold tracking-tight">API Access</h1>
                    <p className="text-muted-foreground">Manage API keys and webhooks to integrate AIHub with your applications.</p>
                </MotionDiv>
                
                <MotionDiv className="grid gap-8 md:grid-cols-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{delay: 0.1}}>
                    <Card className="glassmorphic h-full">
                        <CardHeader className="flex-row gap-4 items-center">
                            <div className="p-3 bg-primary/10 rounded-full border border-primary/20"><Code className="w-6 h-6 text-primary"/></div>
                            <div>
                                <CardTitle className="font-headline">API Documentation</CardTitle>
                                <CardDescription>Explore endpoints and examples.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Our comprehensive documentation provides everything you need to start building.</p></CardContent>
                        <CardFooter><Button variant="outline" asChild><a href="#" target="_blank" rel="noopener noreferrer">Read the Docs <ExternalLink className="ml-2"/></a></Button></CardFooter>
                    </Card>
                    <Card className="glassmorphic h-full">
                        <CardHeader className="flex-row gap-4 items-center">
                            <div className="p-3 bg-primary/10 rounded-full border border-primary/20"><Webhook className="w-6 h-6 text-primary"/></div>
                            <div>
                                <CardTitle className="font-headline">Webhooks</CardTitle>
                                <CardDescription>Get notified about events.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">Configure webhooks to receive real-time notifications for events.</p></CardContent>
                        <CardFooter><Button variant="outline" disabled>Configure Webhooks (Soon)</Button></CardFooter>
                    </Card>
                </MotionDiv>

                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{delay: 0.2}}>
                    <Card className="glassmorphic">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="font-headline">API Keys</CardTitle>
                                <CardDescription>Manage your secret API keys. Do not share these with anyone.</CardDescription>
                            </div>
                            <div className="mt-4 sm:mt-0"><GenerateKeyDialog /></div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead><TableHead>Key Preview</TableHead><TableHead>Created</TableHead><TableHead>Last Used</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiKeys.map((apiKey) => (
                                        <TableRow key={apiKey.id} className={apiKey.status === 'revoked' ? 'text-muted-foreground' : ''}>
                                            <TableCell className="font-medium">{apiKey.name}</TableCell>
                                            <TableCell className="font-mono text-sm">{apiKey.key.substring(0, 10)}...{apiKey.key.slice(-4)}</TableCell>
                                            <TableCell>{format(apiKey.created, 'MMM d, yyyy')}</TableCell>
                                            <TableCell>{apiKey.lastUsed ? format(apiKey.lastUsed, 'MMM d, yyyy') : 'Never'}</TableCell>
                                            <TableCell><Badge variant={apiKey.status === 'active' ? 'secondary' : 'outline'} className={apiKey.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}>{apiKey.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleCopy(apiKey.key)} disabled={apiKey.status === 'revoked'}>{copiedKey === apiKey.key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" disabled={apiKey.status === 'revoked'}><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Revoke API Key?</AlertDialogTitle><AlertDialogDescription>This will permanently revoke the key "{apiKey.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={() => handleRevokeKey(apiKey.id)}>Revoke Key</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </MotionDiv>
            </div>
        </div>
    );
}

// --- LOGGED-OUT VIEW ---
const PublicApiView = () => (
    <div className="w-full">
        <section className="relative w-full py-20 md:py-32 flex items-center justify-center">
            <HeroBackground />
            <div className="container mx-auto max-w-7xl px-4 md:px-6 z-10 relative">
                 <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <Badge variant="secondary" className="mb-4">Developer API</Badge>
                    <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">Power Your Applications with AIHub</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Integrate the power of multiple leading AI models through a single, unified API. Simple, powerful, and built for developers.</p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Button asChild size="lg"><Link href="/signup?continue=/api">Get Your Free API Key</Link></Button>
                        <Button asChild variant="outline" size="lg"><Link href="#">Read Documentation</Link></Button>
                    </div>
                </MotionDiv>
            </div>
        </section>
        
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-12 space-y-12">
            <MotionDiv className="grid gap-8 md:grid-cols-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{delay: 0.2}}>
                <Card className="glassmorphic">
                    <CardHeader><div className="p-3 bg-primary/10 rounded-full border border-primary/20 w-fit mb-2"><Sparkles className="w-6 h-6 text-primary"/></div><CardTitle>All Models, One API</CardTitle></CardHeader>
                    <CardContent>Access Gemini, ChatGPT, Claude, and more without managing multiple integrations.</CardContent>
                </Card>
                <Card className="glassmorphic">
                    <CardHeader><div className="p-3 bg-primary/10 rounded-full border border-primary/20 w-fit mb-2"><Share2 className="w-6 h-6 text-primary"/></div><CardTitle>Smart AI Routing</CardTitle></CardHeader>
                    <CardContent>Let our intelligent router choose the best model for any prompt, ensuring optimal results.</CardContent>
                </Card>
                <Card className="glassmorphic">
                    <CardHeader><div className="p-3 bg-primary/10 rounded-full border border-primary/20 w-fit mb-2"><KeyRound className="w-6 h-6 text-primary"/></div><CardTitle>Simple & Secure</CardTitle></CardHeader>
                    <CardContent>Get started in minutes with a single API key and straightforward, secure authentication.</CardContent>
                </Card>
            </MotionDiv>
            
            <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{delay: 0.4}}>
                <h2 className="text-3xl font-bold text-center font-headline mb-4">Easy Integration</h2>
                <Card className="glassmorphic">
                    <CardContent className="p-6">
                        <pre className="p-4 rounded-lg bg-black/70 text-sm text-white overflow-x-auto"><code className="font-mono">
{`curl https://api.aihub.dev/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "smart-ai",
    "messages": [
      {
        "role": "user",
        "content": "Explain quantum computing in simple terms."
      }
    ]
  }'`}
                        </code></pre>
                    </CardContent>
                </Card>
            </MotionDiv>
        </div>
    </div>
);


export default function ApiPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const pageContent = () => {
        if (authLoading) {
            return <ApiPageSkeleton />;
        }
        return user ? <ApiKeysManager /> : <PublicApiView />;
    };
    
    return (
        <React.Fragment>
            {pageContent()}
        </React.Fragment>
    );
}
