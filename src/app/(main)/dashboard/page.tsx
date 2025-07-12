

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { BrainCircuit, MessageSquare, Sparkles, Star, Clock, List, ArrowRight, Heart } from 'lucide-react';
import { MotionDiv } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MODELS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDashboardData } from './actions';
import { useToast } from '@/hooks/use-toast';

const chartConfig = MODELS.reduce((acc, model, index) => {
  acc[model.id] = {
    label: model.name,
    color: `hsl(var(--chart-${(index % 10) + 1}))`
  };
  return acc;
}, {} as Record<string, { label: string; color: string }>);


const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const DashboardSkeleton = () => (
    <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <Skeleton className="h-80 lg:col-span-3" />
            <Skeleton className="h-80 lg:col-span-2" />
        </div>
         <Skeleton className="h-80 w-full" />
         <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
        </div>
    </div>
);


export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const { toast } = useToast();
    
    const [dashboardData, setDashboardData] = useState<{
        stats: { totalPrompts: number, smartUsage: number, savedChats: number };
        weeklyUsage: any[];
        monthlyVolume: any[];
        recentActivity: any[];
    } | null>(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, currentUser => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await getDashboardData(user.uid);
                setDashboardData(data);
            } catch (error: any) {
                console.error("Failed to fetch dashboard data:", error);
                toast({
                    title: "Error Loading Dashboard",
                    description: "Could not load your usage data. Please try again later.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, toast]);
    

    const { donutData, mostUsedModel } = useMemo(() => {
        if (!dashboardData) return { donutData: [], mostUsedModel: 'N/A' };

        const usage = dashboardData.weeklyUsage.reduce((acc, day) => {
            Object.keys(day).forEach(key => {
                if (key !== 'date') {
                    if (!acc[key as keyof typeof acc]) (acc as any)[key] = 0;
                    (acc as any)[key] += (day as any)[key];
                }
            });
            return acc;
        }, {} as Record<string, number>);
        
        const donutData = Object.entries(usage).map(([name, value]) => ({
            name: (chartConfig as any)[name]?.label || name,
            value,
            fill: (chartConfig as any)[name]?.color || '#8884d8'
        })).sort((a,b) => b.value - a.value);
        
        const mostUsed = donutData[0];
        
        return { donutData, mostUsedModel: mostUsed?.name || 'N/A' };

    }, [dashboardData]);

    if (isLoading || !dashboardData) return <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8"><DashboardSkeleton /></div>

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <MotionDiv
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          variants={variants}
        >
          <h1 className="font-headline text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your real-time AI usage and insights.</p>
        </MotionDiv>

        <MotionDiv 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
        >
          <MotionDiv variants={variants} className="glassmorphic">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats.totalPrompts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">In the last 30 days</p>
              </CardContent>
            </Card>
          </MotionDiv>
          <MotionDiv variants={variants} className="glassmorphic">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Smart AI Usage</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats.smartUsage.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Smart summaries generated</p>
              </CardContent>
            </Card>
          </MotionDiv>
          <MotionDiv variants={variants} className="glassmorphic">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Used Model</CardTitle>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mostUsedModel}</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>
          </MotionDiv>
          <MotionDiv variants={variants} className="glassmorphic">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Chats</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats.savedChats}</div>
                <p className="text-xs text-muted-foreground">Important conversations</p>
              </CardContent>
            </Card>
          </MotionDiv>
        </MotionDiv>
        
        <MotionDiv 
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-5"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.1, delayChildren: 0.3 }}
        >
            <MotionDiv variants={variants} className="glassmorphic lg:col-span-3">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Weekly Usage</CardTitle>
                        <CardDescription>Total prompts by model for the current week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                             <BarChart data={dashboardData.weeklyUsage} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} stroke="hsl(var(--muted-foreground))"/>
                                <YAxis stroke="hsl(var(--muted-foreground))"/>
                                <Tooltip content={<ChartTooltipContent />} />
                                <Legend />
                                {Object.keys(chartConfig).map(modelId => (
                                     <Bar key={modelId} dataKey={modelId} fill={`var(--color-${modelId})`} radius={[4, 4, 0, 0]} stackId="a" name={chartConfig[modelId].label}/>
                                ))}
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </MotionDiv>
            <MotionDiv variants={variants} className="glassmorphic lg:col-span-2">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Model Distribution</CardTitle>
                        <CardDescription>Usage share for each model this week.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="80%" paddingAngle={5} cy="50%">
                                    {donutData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </MotionDiv>
        </MotionDiv>

        <MotionDiv 
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.4 }}
          variants={variants}
          className="glassmorphic"
        >
          <Card>
            <CardHeader>
              <CardTitle>Prompt Volume</CardTitle>
              <CardDescription>Your prompting activity over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{prompts: {label: 'Prompts', color: 'hsl(var(--chart-1))'}}} className="h-[300px] w-full">
                <AreaChart data={dashboardData.monthlyVolume} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="fillPrompts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis 
                        dataKey="date" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                    <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" hideLabel />}
                    />
                    <Area type="monotone" dataKey="prompts" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#fillPrompts)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </MotionDiv>
        
        <MotionDiv
            className="grid gap-8 md:grid-cols-2"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.1, delayChildren: 0.5 }}
        >
             <MotionDiv variants={variants} className="glassmorphic">
                <Card className="h-full">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                             <List className="w-5 h-5"/>
                             <CardTitle>Recent Activity</CardTitle>
                        </div>
                        <CardDescription>Your last few prompts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dashboardData.recentActivity.map(activity => {
                                const model = MODELS.find(m => m.id === activity.model);
                                const ModelIcon = model?.icon || Sparkles;
                                return (
                                    <div key={activity.id} className="flex items-start gap-4">
                                        <div className="p-2 bg-primary/10 rounded-full border border-primary/20 mt-1">
                                            <ModelIcon className="w-4 h-4 text-primary"/>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm truncate">{activity.prompt}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{activity.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </MotionDiv>
            <MotionDiv variants={variants} className="glassmorphic">
                <Card className="h-full flex flex-col items-center justify-center bg-cover bg-center" style={{backgroundImage: 'url(https://placehold.co/600x400.png)'}} data-ai-hint="abstract background">
                     <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
                     <CardContent className="relative z-10 text-center flex flex-col items-center justify-center p-8">
                        <div className="p-3 bg-primary/20 rounded-full mb-4">
                             <Sparkles className="w-8 h-8 text-primary"/>
                        </div>
                        <h3 className="text-2xl font-bold font-headline mb-2">Ready to create?</h3>
                        <p className="text-muted-foreground mb-6">Start a new chat to get inspired.</p>
                        <div className="flex gap-4">
                             <Button asChild>
                                <Link href="/chat">New Chat <ArrowRight className="ml-2"/></Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </MotionDiv>
        </MotionDiv>

      </div>
    </div>
  );
}
