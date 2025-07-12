
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, HelpCircle, Mail, Users, BookOpen, ExternalLink } from 'lucide-react';
import { MotionDiv } from '@/components/ui/motion';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { type User } from 'firebase/auth';

const supportSchema = z.object({
  name: z.string(),
  email: z.string(),
  category: z.string({ required_error: 'Please select a category.' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }),
  message: z.string().min(20, { message: 'Message must be at least 20 characters.' }),
});

const faqItems = [
  {
    question: 'How does the Smart AI Router work?',
    answer: "The Smart AI Router analyzes your prompt and intelligently selects the best AI model (like ChatGPT, Gemini, etc.) to handle your specific request. If you don't specify a model with a slash command, it routes your prompt to multiple models and provides a synthesized summary for the most comprehensive answer.",
  },
  {
    question: 'Can I choose which AI model to use?',
    answer: 'Absolutely! You can direct your prompt to a specific model by using a slash command at the beginning of your message. For example, typing `/chat-gpt What is the capital of France?` will send your question directly to ChatGPT.',
  },
  {
    question: 'How do I reset my password?',
    answer: 'You can reset your password by navigating to the Profile page from the user menu in the top-right corner. There you will find a "Change Password" section.',
  },
  {
    question: 'Is there a free plan available?',
    answer: 'Yes, we offer a free plan with a generous number of monthly prompts to get you started. For more advanced features and higher limits, you can upgrade to one of our paid plans. Check the landing page for pricing details.',
  },
];

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
      ease: 'easeOut',
    },
  },
};

export default function SupportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof supportSchema>>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      name: '',
      email: '',
      category: '',
      subject: '',
      message: '',
    },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        form.setValue('name', currentUser.displayName || 'User');
        form.setValue('email', currentUser.email || '');
      }
    });
    return () => unsubscribe();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof supportSchema>) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Support Ticket Submitted:', values);
    toast({
      title: 'Support Ticket Submitted!',
      description: "We've received your request and will get back to you shortly.",
    });
    form.reset({
      ...values,
      subject: '',
      message: ''
    });
    setIsSubmitting(false);
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <MotionDiv variants={itemVariants} initial="hidden" animate="visible">
          <h1 className="font-headline text-4xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground">Get help, find answers, and connect with our team.</p>
        </MotionDiv>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: FAQ & Resources */}
          <div className="lg:col-span-1 space-y-8">
            <MotionDiv variants={itemVariants} initial="hidden" animate="visible" transition={{delay: 0.1}}>
              <Card className="glassmorphic">
                <CardHeader>
                  <div className="flex items-center gap-3">
                      <HelpCircle className="w-6 h-6 text-primary"/>
                      <CardTitle className="font-headline">Frequently Asked Questions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </MotionDiv>
            <MotionDiv variants={itemVariants} initial="hidden" animate="visible" transition={{delay: 0.2}}>
              <Card className="glassmorphic">
                <CardHeader>
                  <div className="flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-primary"/>
                      <CardTitle className="font-headline">More Resources</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-between glassmorphic">
                      <span>Read Documentation</span> <ExternalLink className="w-4 h-4"/>
                  </Button>
                  <Button variant="outline" className="w-full justify-between glassmorphic">
                      <span>Join Community Forum</span> <ExternalLink className="w-4 h-4"/>
                  </Button>
                </CardContent>
              </Card>
            </MotionDiv>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-2">
            <MotionDiv variants={itemVariants} initial="hidden" animate="visible" transition={{delay: 0.3}}>
              <Card className="glassmorphic">
                <CardHeader>
                  <div className="flex items-center gap-3">
                      <Mail className="w-6 h-6 text-primary"/>
                      <CardTitle className="font-headline">Submit a Support Ticket</CardTitle>
                  </div>
                  <CardDescription>Can't find an answer? We're here to help.</CardDescription>
                </CardHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                      <Input {...field} disabled className="bg-input/50 opacity-70"/>
                                  </FormControl>
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                      <Input {...field} disabled className="bg-input/50 opacity-70"/>
                                  </FormControl>
                                  </FormItem>
                              )}
                          />
                      </div>
                      <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                      <SelectTrigger className="bg-input/50">
                                          <SelectValue placeholder="Select a category..." />
                                      </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="glassmorphic">
                                          <SelectItem value="general">General Inquiry</SelectItem>
                                          <SelectItem value="technical">Technical Support</SelectItem>
                                          <SelectItem value="billing">Billing Issue</SelectItem>
                                          <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                                      </SelectContent>
                                  </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Issue with chat history" {...field} className="bg-input/50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Please describe your issue in detail..."
                                className="min-h-[150px] bg-input/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Ticket
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </MotionDiv>
          </div>
        </div>
      </div>
    </div>
  );
}
