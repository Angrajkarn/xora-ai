

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Plus, Search, MessageSquare, MoreHorizontal, Pencil, Share2, Trash2, PanelLeftClose, PanelLeftOpen, Loader2, ShieldCheck, Users, AlertCircle, Folder, ChevronsUpDown, Check, Bot, Clapperboard, Megaphone } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { updateChatTitle } from '@/services/chatService';
import { getSidebarDataAction, deleteChatAction } from '@/services/chatServiceActions';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { ChatSummary, Workspace } from '@/lib/types';
import { GroupChatDialog } from './chat/group-chat-dialog';
import { WorkspaceDialog } from './workspace-dialog';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { updateWorkspaceNameAction, deleteWorkspaceAction } from '@/services/workspaceServiceActions';
import { Dialog, DialogHeader, DialogFooter, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';


const renameWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
});

export function AppSidebar({ inSheet = false, onNavigate }: { inSheet?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  const [allChats, setAllChats] = useState<ChatSummary[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWorkspacesOpen, setIsWorkspacesOpen] = useState(true);

  // New states for workspace management
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  
  const renameForm = useForm<z.infer<typeof renameWorkspaceSchema>>({
    resolver: zodResolver(renameWorkspaceSchema),
  });

  useEffect(() => {
    if (editingWorkspace) {
        renameForm.setValue('name', editingWorkspace.name);
    }
  }, [editingWorkspace, renameForm]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate();
    }
    router.push(path);
  };
  
  const fetchData = useCallback(async () => {
    if (!user) {
      setAllChats([]);
      setWorkspaces([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { chats, workspaces } = await getSidebarDataAction(user.uid);
      setAllChats(chats);
      setWorkspaces(workspaces);
    } catch (err: any) {
      console.error("Failed to fetch sidebar data:", err);
      const errorMessage = "Could not load your data. Please try again later.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, pathname]);

  useEffect(() => {
    if (renamingChatId !== null && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingChatId]);

  const handleRenameStart = (id: string, currentTitle: string) => {
    setRenamingChatId(id);
    setTempTitle(currentTitle);
  };

  const handleRenameSubmit = async () => {
    if (!renamingChatId || !tempTitle.trim()) {
      setRenamingChatId(null);
      return;
    }
    const originalTitle = allChats.find(c => c.id === renamingChatId)?.title;
    setAllChats(prev => prev.map(chat => chat.id === renamingChatId ? { ...chat, title: tempTitle.trim() } : chat));
    try {
      await updateChatTitle(renamingChatId, tempTitle.trim());
      toast({ title: 'Chat renamed successfully.' });
    } catch (error) {
      console.error("Failed to rename chat:", error);
      toast({ title: "Error", description: "Failed to rename chat.", variant: "destructive" });
      if (originalTitle) {
        setAllChats(prev => prev.map(chat => chat.id === renamingChatId ? { ...chat, title: originalTitle } : chat));
      }
    } finally {
      setRenamingChatId(null);
    }
  };
  
  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRenameSubmit();
    else if (e.key === 'Escape') setRenamingChatId(null);
  };

  const handleDelete = async (id: string) => {
    const originalChats = [...allChats];
    setAllChats(prev => prev.filter(chat => chat.id !== id));
    
    const result = await deleteChatAction(id);

    if (result.success) {
      toast({ title: 'Chat deleted.' });
      if (pathname === `/chat/${id}`) {
        router.push('/chat');
      }
    } else {
      console.error("Failed to delete chat:", result.error);
      toast({ title: "Error", description: "Failed to delete chat.", variant: "destructive" });
      setAllChats(originalChats);
    }
  };

  const handleWorkspaceRenameSubmit = async (data: z.infer<typeof renameWorkspaceSchema>) => {
    if (!editingWorkspace) return;

    const result = await updateWorkspaceNameAction(editingWorkspace.id, data.name);
    if (result.success) {
        toast({ title: 'Workspace renamed successfully.' });
        fetchData(); // Refetch all data
    } else {
        toast({ title: 'Error', description: 'Failed to rename workspace.', variant: 'destructive' });
    }
    setEditingWorkspace(null);
  };

  const handleWorkspaceDelete = async () => {
      if (!deletingWorkspace) return;
      const result = await deleteWorkspaceAction(deletingWorkspace.id);
      if (result.success) {
          toast({ title: 'Workspace deleted successfully.' });
          if (selectedWorkspaceId === deletingWorkspace.id) {
              setSelectedWorkspaceId(null); // Deselect if the current workspace is deleted
          }
          fetchData(); // Refetch all data
      } else {
          toast({ title: 'Error', description: 'Failed to delete workspace.', variant: 'destructive' });
      }
      setDeletingWorkspace(null);
  };

  const filteredWorkspaces = useMemo(() => {
    if (!searchTerm.trim()) return workspaces;
    return workspaces.filter(ws => ws.name.toLowerCase().includes(searchTerm.trim().toLowerCase()));
  }, [workspaces, searchTerm]);

  const filteredChats = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    
    // If there is a search term, search across ALL chats, ignoring workspace selection.
    if (searchLower) {
        return allChats.filter(chat => chat.title.toLowerCase().includes(searchLower));
    }
    
    // If no search term, filter by the selected workspace.
    if (selectedWorkspaceId) {
        return allChats.filter(chat => chat.workspaceId === selectedWorkspaceId);
    }
    
    // If no workspace selected and no search term, show unassigned chats.
    return allChats.filter(chat => !chat.workspaceId);

  }, [allChats, selectedWorkspaceId, searchTerm]);

  const finalIsCollapsed = !inSheet && isCollapsed;

  const rootClasses = inSheet
    ? "flex flex-col h-full p-2 bg-background"
    : cn(
        "hidden md:flex flex-col h-screen p-2 border-r bg-background/50 sticky top-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[4.5rem]" : "w-72"
      );
      
  const WorkspaceIcon = ({ iconName, color }: { iconName: string, color: string }) => {
    const IconComponent = (LucideIcons as any)[iconName] || Folder;
    return <IconComponent className="h-4 w-4" style={{ color }} />;
  };

  return (
    <>
      <div data-sidebar-id="app-sidebar" className={rootClasses}>
          <div className="flex items-center justify-between py-2 mb-2 h-14 px-2">
              <Link href="/chat" onClick={() => handleNavigation('/chat')} className={cn("flex items-center gap-2 overflow-hidden", finalIsCollapsed && 'w-full justify-center relative group')}>
                  <Sparkles className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className={cn("flex flex-col", finalIsCollapsed && "sr-only")}>
                      <span className="font-headline text-2xl font-bold whitespace-nowrap leading-tight">Xora</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap -mt-1">Your AI Ecosystem</span>
                  </div>
                  {!inSheet && (
                      <Button onClick={(e) => { e.preventDefault(); setIsCollapsed(false); }} variant="ghost" size="icon" className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10", !finalIsCollapsed && "hidden")}>
                          <PanelLeftOpen /><span className="sr-only">Open Sidebar</span>
                      </Button>
                  )}
              </Link>
              {!inSheet && (<Button onClick={() => setIsCollapsed(true)} variant="ghost" size="icon" className={cn("flex-shrink-0", finalIsCollapsed && "hidden")}><PanelLeftClose /><span className="sr-only">Close Sidebar</span></Button>)}
          </div>

          <div className={cn("flex flex-col gap-2 px-2", finalIsCollapsed ? "items-center" : "items-stretch")}>
              <Button className={cn(finalIsCollapsed && "aspect-square p-0")} onClick={() => handleNavigation(selectedWorkspaceId ? `/chat?workspaceId=${selectedWorkspaceId}` : '/chat')}>
                  <Plus className={cn("h-4 w-4", !finalIsCollapsed && "mr-2")} />
                  <span className={cn(finalIsCollapsed && "sr-only")}>New Chat</span>
              </Button>
              <GroupChatDialog workspaceId={selectedWorkspaceId} isCollapsed={finalIsCollapsed} />
              <Button asChild variant="ghost" className={cn('w-full', isCollapsed ? "aspect-square p-0 justify-center" : "justify-start")}>
                <Link href="/reel-generator">
                  <Clapperboard className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  <span className={cn(isCollapsed && "sr-only")}>Reel Generator</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" className={cn('w-full', isCollapsed ? "aspect-square p-0 justify-center" : "justify-start")}>
                <Link href="/influencer">
                  <Megaphone className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  <span className={cn(isCollapsed && "sr-only")}>Influencer Mode</span>
                </Link>
              </Button>
          </div>
          
          <div className={cn("relative px-2 my-2", finalIsCollapsed && 'hidden')}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Search..."
                  className="pl-8 h-9 bg-input/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          
          <div className="flex-grow mt-2 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 -mx-2 h-full">
              <div className="px-2 space-y-1">
                  {isLoading ? (
                      <div className="p-4 space-y-2">
                          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
                      </div>
                  ) : error ? (
                      <div className="text-center text-xs text-destructive p-3 bg-destructive/10 rounded-md mx-2 flex flex-col items-center gap-2">
                          <AlertCircle className="w-5 h-5" /><p className="font-semibold">Error Loading Data</p><p>{error}</p>
                      </div>
                  ) : (
                      <>
                          <Collapsible open={isWorkspacesOpen} onOpenChange={setIsWorkspacesOpen} className={cn('px-2', finalIsCollapsed && "hidden")}>
                            <div className="flex items-center justify-between">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full justify-start px-2 -ml-2">
                                  <ChevronsUpDown className="h-4 w-4 mr-2" />
                                  <span className="font-semibold">Workspaces</span>
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="space-y-1 pt-2">
                              <WorkspaceDialog onWorkspaceCreated={fetchData} />
                              <Button variant={selectedWorkspaceId === null && !searchTerm ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start" onClick={() => setSelectedWorkspaceId(null)}>
                                  <Bot className="h-4 w-4 mr-2" /> Unassigned
                              </Button>
                              {filteredWorkspaces.map(ws => (
                                  <div key={ws.id} className="relative group rounded-md hover:bg-accent/50">
                                      <Button variant={selectedWorkspaceId === ws.id && !searchTerm ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start" onClick={() => setSelectedWorkspaceId(ws.id)}>
                                          <WorkspaceIcon iconName={ws.icon} color={ws.color} />
                                          <span className="truncate ml-2">{ws.name}</span>
                                      </Button>
                                      <div className="absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-48 glassmorphic">
                                                  <DropdownMenuItem onSelect={() => setEditingWorkspace(ws)}><Pencil className="mr-2 h-4 w-4" /><span>Rename Workspace</span></DropdownMenuItem>
                                                  <DropdownMenuItem onSelect={() => toast({ title: "Sharing coming soon!" })}><Share2 className="mr-2 h-4 w-4" /><span>Share & Manage Access</span></DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem onSelect={() => setDeletingWorkspace(ws)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Delete Workspace</span></DropdownMenuItem>
                                              </DropdownMenuContent>
                                          </DropdownMenu>
                                      </div>
                                  </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                          
                          <div className={cn('px-2 pt-2', finalIsCollapsed && "hidden")}><Separator /></div>

                          <div className={cn("space-y-1 pt-2", finalIsCollapsed && "hidden")}>
                              <p className="text-xs text-muted-foreground mb-1 px-2">{searchTerm ? 'Search Results' : 'Chats'}</p>
                              {filteredChats.length > 0 ? filteredChats.map((chat) => (
                                <div key={chat.id} className="relative group rounded-md hover:bg-accent/50">
                                  {renamingChatId === chat.id ? (
                                    <div className="flex items-center h-9 px-2">
                                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                                      <Input ref={renameInputRef} value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} onKeyDown={handleRenameKeyDown} onBlur={handleRenameSubmit} className="h-7 w-full bg-input" />
                                    </div>
                                  ) : (
                                    <Button variant={pathname === `/chat/${chat.id}` ? 'secondary' : 'ghost'} className="w-full justify-start h-9" asChild>
                                      <Link href={`/chat/${chat.id}`} onClick={() => handleNavigation(`/chat/${chat.id}`)} className="w-full flex items-center">
                                        {(chat.aiMembers && chat.aiMembers.length > 0) || (chat.customPersonas && chat.customPersonas.length > 0) ? <Users className="h-4 w-4 mr-2 flex-shrink-0" /> : <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />}
                                        <span className="truncate flex-1 text-left">{chat.title}</span>
                                        {chat.expiresAt && (<TooltipProvider delayDuration={300}><Tooltip><TooltipTrigger><ShieldCheck className="h-4 w-4 text-primary ml-1 flex-shrink-0" /></TooltipTrigger><TooltipContent side="right"><p>Secure Mode: This chat will self-destruct.</p></TooltipContent></Tooltip></TooltipProvider>)}
                                      </Link>
                                    </Button>
                                  )}
                                  {renamingChatId !== chat.id && (
                                    <div className="absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 glassmorphic">
                                          <DropdownMenuItem onClick={() => handleRenameStart(chat.id, chat.title)}><Pencil className="mr-2 h-4 w-4" /><span>Rename</span></DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => toast({ title: 'Sharing coming soon!' })}><Share2 className="mr-2 h-4 w-4" /><span>Share</span></DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem></AlertDialogTrigger>
                                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the chat "{chat.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={() => handleDelete(chat.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )}
                                </div>
                              )) : (
                                <div className="text-center text-xs text-muted-foreground p-4">No chats found.</div>
                              )}
                          </div>
                      </>
                  )}
              </div>
            </ScrollArea>
          </div>
          
          <div className="mt-auto pt-2 border-t border-border/50 px-2">
              <Button variant="default" onClick={() => handleNavigation('/billing')} className={cn("w-full h-auto text-left p-3", finalIsCollapsed ? "justify-center p-2" : "justify-start")}>
                  <div className={cn("p-2 bg-primary-foreground/10 rounded-full", !finalIsCollapsed && "mr-3")}>
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className={cn("flex flex-col", finalIsCollapsed && "hidden")}>
                      <span className="font-semibold">Upgrade Plan</span>
                      <p className="text-xs text-primary-foreground/90 font-normal leading-snug">Unlock all AI models</p>
                  </div>
              </Button>
          </div>
      </div>

      <Dialog open={!!editingWorkspace} onOpenChange={(open) => !open && setEditingWorkspace(null)}>
        <DialogContent className="glassmorphic">
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
            <DialogDescription>Enter a new name for your workspace.</DialogDescription>
          </DialogHeader>
          <Form {...renameForm}>
            <form onSubmit={renameForm.handleSubmit(handleWorkspaceRenameSubmit)} className="space-y-4">
              <FormField
                control={renameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Workspace Name</FormLabel>
                    <FormControl>
                      <Input {...field} autoFocus className="bg-input/50"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingWorkspace(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deletingWorkspace} onOpenChange={(open) => !open && setDeletingWorkspace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingWorkspace?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workspace and all chats within it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={handleWorkspaceDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
  
