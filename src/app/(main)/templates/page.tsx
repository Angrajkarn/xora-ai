
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Lightbulb, Code, Book, Clapperboard, ShoppingCart, MessageCircle, CodeXml, GraduationCap, PenLine, ArrowRight, Search, Briefcase, Feather, Brain, Mic, Megaphone, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MotionDiv } from '@/components/ui/motion';

const allTemplates = [
  // Writing
  { title: 'Blog Post Outline', description: 'Generate a structured outline for your next blog post.', icon: FileText, category: 'Writing', prompt: 'Create a detailed blog post outline for the topic: "[Your Topic Here]". Include an introduction, 3-5 main sections with sub-points, and a conclusion.' },
  { title: 'Email Copy Polisher', description: 'Improve the tone and clarity of your email copy.', icon: MessageCircle, category: 'Writing', prompt: 'Rewrite the following email copy to be more professional, engaging, and clear. Keep the core message intact.\n\n[Paste your email copy here]' },
  { title: 'AIDA Copywriting', description: 'Use the Attention-Interest-Desire-Action framework.', icon: Megaphone, category: 'Writing', prompt: 'Write a piece of copy for a [product/service] using the AIDA framework. The target audience is [target audience].' },
  { title: 'Resume Bullet Points', description: 'Craft impactful bullet points for your resume.', icon: Briefcase, category: 'Writing', prompt: 'Turn the following responsibility: "[Your responsibility]" into 3 impactful, action-oriented resume bullet points using metrics where possible.' },
  { title: 'Press Release', description: 'Generate a professional press release for an announcement.', icon: Feather, category: 'Writing', prompt: 'Write a press release announcing [your news, e.g., a new product launch]. Include a headline, dateline, introduction, body, boilerplate, and contact information.' },
  
  // Coding
  { title: 'Python Function Generator', description: 'Create a Python function from a description.', icon: Code, category: 'Coding', prompt: 'Write a Python function that does the following: [Describe the function\'s purpose and parameters here]. Include docstrings and type hints.' },
  { title: 'SQL Query Writer', description: 'Write complex SQL queries from natural language.', icon: CodeXml, category: 'Coding', prompt: 'Generate an SQL query that selects [columns] from the [table_name] table where [conditions].' },
  { title: 'Regex Generator', description: 'Create regular expressions from a description.', icon: CodeXml, category: 'Coding', prompt: 'Generate a regular expression that matches the following pattern: [Describe the pattern, e.g., "email addresses"].' },
  { title: 'Code Refactorer', description: 'Improve existing code for readability and efficiency.', icon: Code, category: 'Coding', prompt: 'Refactor the following [language] code to be more efficient and readable. Explain the changes you made.\n\n[Paste your code here]' },
  { title: 'Unit Test Generator', description: 'Generate unit tests for a given function or class.', icon: Code, category: 'Coding', prompt: 'Write unit tests for the following [language] function using the [testing framework, e.g., Jest, Pytest].\n\n[Paste your function here]' },

  // Business
  { title: 'Business Idea Brainstorm', description: 'Brainstorm innovative business ideas in a niche.', icon: Lightbulb, category: 'Business', prompt: 'Brainstorm 5 innovative business ideas in the [niche/industry] market. For each idea, provide a brief description and a potential target audience.' },
  { title: 'E-commerce Product Description', description: 'Create compelling product descriptions that sell.', icon: ShoppingCart, category: 'Business', prompt: 'Write a compelling product description for the following product: [Product Name and key features]. The description should be persuasive and highlight the benefits for the customer.' },
  { title: 'SWOT Analysis', description: 'Generate a SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis.', icon: Target, category: 'Business', prompt: 'Conduct a SWOT analysis for a company in the [industry] industry named [Company Name].' },
  { title: 'Elevator Pitch', description: 'Craft a concise and persuasive elevator pitch.', icon: Megaphone, category: 'Business', prompt: 'Create a 30-second elevator pitch for a [product/service] that solves [problem] for [target audience].' },
  { title: 'Job Description', description: 'Write a comprehensive and appealing job description.', icon: Briefcase, category: 'Business', prompt: 'Write a job description for a [Job Title] role. Include responsibilities, qualifications, and company information.' },

  // Learning
  { title: 'Lesson Plan Creator', description: 'Develop a detailed lesson plan for any subject.', icon: Book, category: 'Learning', prompt: 'Create a detailed lesson plan for a [grade level] class on the topic of [subject]. The lesson should last [duration] and include learning objectives, materials needed, activities, and an assessment method.' },
  { title: 'Complex Topic Explainer', description: 'Simplify a complex topic.', icon: GraduationCap, category: 'Learning', prompt: 'Explain the concept of [complex topic, e.g., "General Relativity"] in simple, easy-to-understand terms, using analogies.' },
  { title: 'Study Guide Creator', description: 'Generate a study guide from notes or a topic.', icon: Book, category: 'Learning', prompt: 'Create a study guide for an upcoming test on [subject]. The key topics to cover are: [List of topics]. Include key terms, summaries, and potential short-answer questions.' },
  { title: 'Analogy Generator', description: 'Create analogies to explain complex ideas.', icon: Brain, category: 'Learning', prompt: 'Generate 3 different analogies to explain the concept of [complex concept, e.g., "APIs"].' },
  { title: 'Quiz Generator', description: 'Create a multiple-choice quiz on any topic.', icon: GraduationCap, category: 'Learning', prompt: 'Create a 5-question multiple-choice quiz on the topic of [topic]. Provide the correct answer for each question.' },
  
  // Creative
  { title: 'YouTube Script Outline', description: 'Structure your next viral video script.', icon: Clapperboard, category: 'Creative', prompt: 'Create a script outline for a YouTube video about [video topic]. The outline should include an introduction (hook), main content points, B-roll suggestions, and a call-to-action at the end.' },
  { title: 'Short Story Starter', description: 'Generate an opening for a short story.', icon: PenLine, category: 'Creative', prompt: 'Write a compelling opening paragraph for a short story in the [genre] genre. The story should start with the line: "[Starting line]"' },
  { title: 'Character Profile', description: 'Generate a detailed profile for a fictional character.', icon: PenLine, category: 'Creative', prompt: 'Create a detailed character profile for a [type of character, e.g., "fantasy rogue"]. Include their name, age, appearance, personality, backstory, and motivations.' },
  { title: 'Song Lyrics Idea', description: 'Brainstorm ideas and lyrics for a song.', icon: Mic, category: 'Creative', prompt: 'Generate ideas for a song in the [genre] genre about the theme of [theme, e.g., "nostalgia"]. Include a potential title, a chorus, and two verse ideas.' },
  { title: 'Ad Slogan Generator', description: 'Create catchy slogans for a product or brand.', icon: Megaphone, category: 'Creative', prompt: 'Generate 10 catchy slogans for a brand that sells [product/service]. The brand\'s tone is [brand tone, e.g., "playful and energetic"].' }
];


const categories = ['All', 'Writing', 'Coding', 'Business', 'Learning', 'Creative'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function TemplatesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const handleUseTemplate = (prompt: string) => {
    const encodedPrompt = encodeURIComponent(prompt);
    router.push(`/chat?prompt=${encodedPrompt}`);
  };

  const filteredTemplates = allTemplates.filter(template => {
    const matchesCategory = activeTab === 'All' || template.category === activeTab;
    const matchesSearch = searchTerm === '' || 
                          template.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <MotionDiv
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <h1 className="font-headline text-4xl font-bold tracking-tight">Prompt Templates</h1>
          <p className="text-muted-foreground">Jumpstart your creativity with our curated collection of prompt templates.</p>
        </MotionDiv>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10 w-full glassmorphic"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="All" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-8 glassmorphic p-1 h-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs sm:text-sm">{category}</TabsTrigger>
            ))}
          </TabsList>
          
          <AnimatePresence mode="wait">
              <MotionDiv
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
              >
              {filteredTemplates.length > 0 ? (
                  <MotionDiv 
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  >
                  {filteredTemplates.map((template) => (
                      <MotionDiv key={template.title} variants={itemVariants}>
                      <Card className="flex flex-col h-full glassmorphic transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 group">
                          <CardHeader>
                          <div className="flex items-center gap-4">
                              <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                              <template.icon className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                              <CardTitle className="font-headline">{template.title}</CardTitle>
                              <CardDescription>{template.category}</CardDescription>
                              </div>
                          </div>
                          </CardHeader>
                          <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          </CardContent>
                          <CardFooter>
                          <Button className="w-full" onClick={() => handleUseTemplate(template.prompt)}>
                              <span>Use Template</span>
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                          </CardFooter>
                      </Card>
                      </MotionDiv>
                  ))}
                  </MotionDiv>
              ) : (
                  <div className="text-center py-16">
                      <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-semibold">No templates found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or category.</p>
                  </div>
              )}
              </MotionDiv>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
