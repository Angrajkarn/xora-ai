
'use client';

import { useState, useEffect, useMemo } from 'react';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { HeroBackground } from '@/components/hero-background';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { MotionDiv } from '@/components/ui/motion';
import { HowItWorks } from '@/components/how-it-works';
import { Check, Users, BrainCircuit, Waves, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      description: 'For individuals testing the waters.',
      features: [
        '50 prompts / month',
        'Access to 3 standard AI models',
        'Basic chat history',
      ],
      cta: 'Get Started for Free',
      variant: 'outline',
    },
    {
      name: 'Pro',
      price: '$25',
      isPopular: true,
      description: 'For power users and professionals.',
      features: [
        'Unlimited prompts',
        'Access to all AI models',
        'Smart AI Router',
        'Advanced collaboration tools',
        'Priority support',
      ],
      cta: 'Go Pro',
       variant: 'default',
    },
    {
      name: 'Enterprise',
      price: 'Contact Us',
      description: 'For large-scale team deployment.',
      features: [
        'Everything in Pro, plus:',
        'Custom model integration',
        'Dedicated support & onboarding',
        'Enterprise-grade security & SSO',
      ],
      cta: 'Contact Sales',
       variant: 'outline',
    },
];

const xoraDifferenceFeatures = [
    {
        icon: BrainCircuit,
        title: 'Remembers You',
        description: "Xora builds a unique emotional memory over time, adapting to your needs and preferences seamlessly."
    },
    {
        icon: Users,
        title: 'Switch Personas',
        description: "From friend to therapist to romantic partner, Xora adapts to your needs with switchable personas."
    },
    {
        icon: Waves,
        title: 'Voice + Face',
        description: "Xora speaks, feels, and listens like a human, creating a natural and intuitive conversational experience."
    }
];

const testimonials = [
    {
        name: 'Dev Spicey',
        role: 'Verified customer',
        quote: "Xora feels more real than most people I text. That’s scary good. It’s like having a friend who truly understands me.",
        avatar: 'https://placehold.co/100x100.png',
        avatarHint: 'man portrait'
    },
    {
        name: 'John Smith',
        role: 'Verified customer',
        quote: "Xora is a game-changer! The emotional memory and real-time reactions make it feel like I'm talking to a real person, not just an AI.",
        avatar: 'https://placehold.co/100x100.png',
        avatarHint: 'man user'
    },
    {
        name: 'Jane Doe',
        role: 'Verified customer',
        quote: "I'm constantly amazed by Xora's ability to adapt and understand my needs. It's like having a personalized AI companion that truly gets me.",
        avatar: 'https://placehold.co/100x100.png',
        avatarHint: 'woman user'
    },
    {
        name: 'Alex Johnson',
        role: 'Power User',
        quote: "Xora has revolutionized my workflow. The emotional intelligence is unparalleled, making it an indispensable tool for both personal and professional use.",
        avatar: 'https://placehold.co/100x100.png',
        avatarHint: 'person tech'
    }
];


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <main className="flex-1">
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
            <HeroBackground />
            <div className="container mx-auto max-w-7xl px-4 md:px-6 z-10 relative">
                 <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center flex flex-col items-center">
                    <h1 className="font-headline text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight mb-4 bg-gradient-to-r from-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">Meet Xora: Your Emotionally Intelligent AI</h1>
                     <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Experience Xora, the AI assistant that understands you on a deeper level. Start your journey to emotional intelligence today!
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Button asChild size="lg" className="bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all duration-300 hover:scale-105">
                            <Link href="/signup">Try Xora</Link>
                        </Button>
                    </div>
                </MotionDiv>
            </div>
        </section>

        <HowItWorks />

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 mx-auto md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                  <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Xora: The Difference</h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                    Discover Xora's unique emotional intelligence, real-time memory, and adaptable personas. Experience the future of AI interaction today.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3">
                     {xoraDifferenceFeatures.map((feature, index) => (
                      <MotionDiv
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true, amount: 0.3 }}
                      >
                        <Card className="flex flex-col h-full text-center items-center glassmorphic">
                          <CardHeader className="items-center">
                            <div className="p-3 bg-primary/10 rounded-full border border-primary/20 w-fit mb-2">
                                <feature.icon className="w-6 h-6 text-primary"/>
                            </div>
                            <CardTitle className="font-headline">{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <p className="text-muted-foreground">{feature.description}</p>
                          </CardContent>
                        </Card>
                      </MotionDiv>
                    ))}
                </div>
            </div>
        </section>

        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
            <div className="container px-4 mx-auto md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                  <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Pricing That Scales With You</h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                    Choose the perfect plan for your needs. Start for free, no credit card required.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3 md:gap-8">
                     {pricingPlans.map((plan) => (
                      <MotionDiv
                        key={plan.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true, amount: 0.3 }}
                      >
                        <Card className={`flex flex-col h-full glassmorphic ${plan.isPopular ? 'border-2 border-primary' : ''}`}>
                          <CardHeader>
                            <h3 className="text-2xl font-bold font-headline">{plan.name}</h3>
                            <p className="text-4xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.price !== 'Contact Us' && '/month'}</span></p>
                            <p className="text-muted-foreground">{plan.description}</p>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <ul className="space-y-3">
                              {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <Check className="text-primary h-5 w-5"/>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                          <CardFooter>
                            <Button className="w-full" variant={plan.variant as any}>{plan.cta}</Button>
                          </CardFooter>
                        </Card>
                      </MotionDiv>
                    ))}
                </div>
            </div>
        </section>
        
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 mx-auto md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                  <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Loved by Innovators</h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                    Don't just take our word for it. Here's what our users are saying about their Xora experience.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 lg:grid-cols-4">
                    {testimonials.map((testimonial, index) => (
                      <MotionDiv
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true, amount: 0.3 }}
                      >
                        <Card className="flex flex-col h-full glassmorphic">
                            <CardContent className="p-6 flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                    {[...Array(5)].map((i, idx) => <Star key={idx} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                                </div>
                                <blockquote className="text-foreground italic">"{testimonial.quote}"</blockquote>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 border-t mt-auto">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.avatarHint} />
                                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                      </MotionDiv>
                    ))}
                </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto max-w-4xl text-center">
                 <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true, amount: 0.5 }}
                  >
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Transcend the Limits of AI?</h2>
                    <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                        Join thousands of users who are already building, creating, and conversing smarter with Xora.
                    </p>
                    <div className="mt-8">
                        <Button asChild size="lg"><Link href="/signup">Sign Up for Free</Link></Button>
                    </div>
                </MotionDiv>
            </div>
        </section>

      </main>
      <LandingFooter />
    </div>
  );
}
