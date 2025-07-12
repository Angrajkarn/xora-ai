

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createGroupChat } from '@/services/chatService';
import { MODELS } from '@/lib/constants';
import type { ModelId, CustomPersona } from '@/lib/types';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, Users, X, PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { updateUserActivity } from '@/services/gamificationService';


const personaModels = MODELS.filter(m => m.type === 'persona');

export function GroupChatDialog({ workspaceId, isCollapsed }: { workspaceId?: string | null, isCollapsed?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState<ModelId[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  const [customPersonas, setCustomPersonas] = useState<CustomPersona[]>([]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const handlePersonaToggle = (personaId: ModelId) => {
    setSelectedPersonas(prev =>
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };
  
  const handleAddCustomPersona = () => {
    if (customPersonas.length < 5) {
        setCustomPersonas(prev => [...prev, { id: `custom-${Date.now()}`, name: '', instructions: '' }]);
    }
  };

  const handleRemoveCustomPersona = (id: string) => {
    setCustomPersonas(prev => prev.filter(p => p.id !== id));
  };

  const handleCustomPersonaChange = (id: string, field: 'name' | 'instructions', value: string) => {
    setCustomPersonas(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };


  const resetState = () => {
    setIsOpen(false);
    setSelectedPersonas([]);
    setGroupName('');
    setCustomPersonas([]);
  };

  const handleCreateGroup = async () => {
    if (!user) {
      toast({ title: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    
    const finalCustomPersonas = customPersonas.filter(p => p.name.trim() && p.instructions.trim());

    if (selectedPersonas.length < 1 && finalCustomPersonas.length < 1) {
      toast({ title: 'Select or create at least one AI persona.', variant: 'destructive' });
      return;
    }
    if (!groupName.trim()) {
      toast({ title: 'Please enter a group name.', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      const newChatId = await createGroupChat(user, selectedPersonas, groupName.trim(), finalCustomPersonas.length > 0 ? finalCustomPersonas : undefined, workspaceId || undefined);
      toast({ title: 'Group chat created!', description: 'You can now start the conversation.' });

      if (finalCustomPersonas.length > 0) {
        await updateUserActivity(user.uid, 'CUSTOM_CREATOR');
      }
      await updateUserActivity(user.uid, 'DIRECTOR');

      resetState();
      router.push(`/chat/${newChatId}`);
    } catch (error) {
      console.error('Failed to create group chat:', error);
      toast({ title: 'Error', description: 'Could not create the group chat.', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) resetState();
        setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" className={cn('w-full', isCollapsed ? "aspect-square p-0 justify-center" : "justify-start")}>
            <Users className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            <span className={cn(isCollapsed && "sr-only")}>New Group Chat</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glassmorphic">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a New Group Chat</DialogTitle>
          <DialogDescription>
            Select AI personas to join your group conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input 
                    id="group-name"
                    placeholder="e.g., Creative Brainstorm"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="bg-input/50"
                />
            </div>
            <div className="space-y-2">
              <Label>Select AI Personas</Label>
              <ScrollArea className="h-40 rounded-md border p-2">
                <div className="space-y-2">
                  {personaModels.map(persona => (
                    <div
                      key={persona.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handlePersonaToggle(persona.id)}
                    >
                      <Checkbox
                        id={`persona-${persona.id}`}
                        checked={selectedPersonas.includes(persona.id)}
                        onCheckedChange={() => handlePersonaToggle(persona.id)}
                      />
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                          <AvatarFallback className="bg-transparent text-primary"><persona.icon className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                          <p className="font-medium text-sm">{persona.name}</p>
                          <p className="text-xs text-muted-foreground">{persona.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="space-y-2">
                <Label>Custom Personas</Label>
                <ScrollArea className="max-h-32 w-full pr-3">
                    <div className="space-y-3">
                        {customPersonas.map((persona, index) => (
                            <div key={persona.id} className="p-3 border rounded-lg space-y-2 relative bg-background/50">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={() => handleRemoveCustomPersona(persona.id)}
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Remove Persona</span>
                                </Button>
                                <Input
                                    placeholder={`Custom Persona ${index + 1} Name`}
                                    value={persona.name}
                                    onChange={(e) => handleCustomPersonaChange(persona.id, 'name', e.target.value)}
                                    className="bg-input/80"
                                />
                                <Textarea
                                    placeholder={`Instructions for Persona ${index + 1}`}
                                    value={persona.instructions}
                                    onChange={(e) => handleCustomPersonaChange(persona.id, 'instructions', e.target.value)}
                                    className="bg-input/80 h-20"
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleAddCustomPersona}
                    disabled={customPersonas.length >= 5}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Custom Persona ({customPersonas.length}/5)
                </Button>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleCreateGroup} disabled={isCreating} className="w-full">
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
