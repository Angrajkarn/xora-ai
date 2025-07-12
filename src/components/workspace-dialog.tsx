
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, PlusCircle } from 'lucide-react';
import { WORKSPACE_ICON_NAMES, WORKSPACE_COLORS } from '@/lib/constants';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createWorkspaceAction } from '@/services/workspaceServiceActions';

const workspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  icon: z.string({ required_error: 'Please select an icon.' }),
  color: z.string({ required_error: 'Please select a color.' }),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

const IconPicker = ({ field }: { field: any }) => (
  <div className="grid grid-cols-5 gap-2">
    {WORKSPACE_ICON_NAMES.map(iconName => {
      const IconComponent = (LucideIcons as any)[iconName];
      return (
        <button
          key={iconName}
          type="button"
          onClick={() => field.onChange(iconName)}
          className={cn(
            'flex items-center justify-center p-3 rounded-md border-2 transition-all',
            field.value === iconName ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/50 hover:bg-muted'
          )}
        >
          <IconComponent className="w-5 h-5" />
        </button>
      );
    })}
  </div>
);

const ColorPicker = ({ field }: { field: any }) => (
  <div className="flex flex-wrap gap-2">
    {WORKSPACE_COLORS.map(color => (
      <button
        key={color}
        type="button"
        onClick={() => field.onChange(color)}
        className="w-8 h-8 rounded-full border-2"
        style={{
          backgroundColor: color,
          borderColor: field.value === color ? 'var(--primary)' : 'transparent',
          boxShadow: field.value === color ? '0 0 0 2px var(--primary)' : 'none',
        }}
      />
    ))}
  </div>
);

export function WorkspaceDialog({ onWorkspaceCreated }: { onWorkspaceCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: '', icon: WORKSPACE_ICON_NAMES[0], color: WORKSPACE_COLORS[0] },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: WorkspaceFormData) => {
    if (!user) {
      toast({ title: 'You must be logged in to create a workspace.', variant: 'destructive' });
      return;
    }
    try {
      await createWorkspaceAction(user.uid, data.name, data.icon, data.color);
      toast({ title: 'Workspace created!', description: `"${data.name}" is ready.` });
      onWorkspaceCreated();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast({ title: 'Error', description: 'Could not create workspace.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="w-full justify-start">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glassmorphic">
        <DialogHeader>
          <DialogTitle className="font-headline">Create New Workspace</DialogTitle>
          <DialogDescription>Organize your chats by project or topic.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label>Workspace Name</Label>
                  <FormControl>
                    <Input placeholder="e.g., My Novel Project" {...field} className="bg-input/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <Label>Icon</Label>
                  <FormControl>
                    <IconPicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <Label>Color</Label>
                  <FormControl>
                    <ColorPicker field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
