

'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Search, Settings, User, LogOut, LifeBuoy, CreditCard, Command, BarChart2, Star, PanelLeft, Users, Bell, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { MotionDiv } from './ui/motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useCommandPalette } from '@/contexts/command-palette-provider';
import type { ChatSummary, Author } from '@/lib/types';
import { updateUserLastSeen } from '@/services/userService';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { AppSidebar } from './app-sidebar';
import { useToast } from '@/hooks/use-toast';
import { getSidebarDataAction } from '@/services/chatServiceActions';
import { getMemberProfiles } from '@/app/(main)/chat/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MODELS } from '@/lib/constants';
import { Badge } from './ui/badge';


export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const { toggle } = useCommandPalette();
  const [chatHistory, setChatHistory] = useState<ChatSummary[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const [headerTitle, setHeaderTitle] = useState('Xora');
  const [chatMembers, setChatMembers] = useState<Author[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        updateUserLastSeen(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const { chats } = await getSidebarDataAction(user.uid);
            setChatHistory(chats);
        } catch (error: any) {
            console.error("Failed to fetch chat history for header:", error);
            toast({ 
                title: "Error Loading Chats", 
                description: "Could not load chat history. Please try again later.", 
                variant: "destructive",
            });
        } finally {
            setIsHistoryLoading(false);
        }
    };
    fetchHistory();
  }, [user, pathname, toast]);

  useEffect(() => {
    const processHeader = async () => {
        const pathSegments = pathname.split('/').filter(Boolean);
        const isChatPage = pathSegments[0] === 'chat' && pathSegments[1];

        if (isChatPage) {
            const currentChatId = pathSegments[1];
            const chat = chatHistory.find(c => c.id === currentChatId);

            if (chat) {
                setHeaderTitle(chat.title);
                
                let members: Author[] = [];
                // Fetch human members
                if (chat.members && chat.members.length > 0) {
                    try {
                        // Assuming only one human member for now for simplicity, can be expanded
                        const humanMembers = await getMemberProfiles([user!.uid]);
                        members.push(...humanMembers);
                    } catch (e) { console.error("Failed to get member profiles", e); }
                }

                // Process AI members
                if (chat.aiMembers) {
                    const aiMemberDetails = chat.aiMembers.map(id => {
                        const model = MODELS.find(m => m.id === id);
                        return model ? { uid: model.id, name: model.name, avatar: undefined } : null;
                    }).filter(Boolean) as Author[];
                    members.push(...aiMemberDetails);
                }
                
                // Process custom personas
                if (chat.customPersonas) {
                    const customPersonaDetails = chat.customPersonas.map(p => ({
                        uid: p.id,
                        name: p.name,
                        avatar: undefined,
                    }));
                    members.push(...customPersonaDetails);
                }
                
                setChatMembers(members);
            } else {
                setHeaderTitle(isHistoryLoading ? 'Loading...' : 'Chat');
                setChatMembers([]);
            }
        } else {
             // Logic for other pages
             const title = pathSegments.pop() || 'dashboard';
             if (pathSegments[0] === 'api') setHeaderTitle('API');
             else if (pathname === '/chat') setHeaderTitle('Xora');
             else setHeaderTitle(title.charAt(0).toUpperCase() + title.slice(1));
             setChatMembers([]);
        }
    };

    if (user) {
        processHeader();
    }
  }, [pathname, chatHistory, isHistoryLoading, user]);

  const handleLogout = async () => {
    try {
      // Clear the server-side session cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      // Sign out the client-side Firebase instance
      await signOut(auth);
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
       toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while signing out. Please try again.',
      });
    }
  };

  const getUserName = () => {
      if (user?.displayName) return user.displayName;
      if (user?.email) return user.email.split('@')[0];
      return 'User';
  }
  
  const getUserInitial = () => {
      if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
      if (user?.email) return user.email.charAt(0).toUpperCase();
      return <User />;
  }

  return (
    <header data-header-id="app-header" className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
       <div className="md:hidden">
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SheetTitle className="sr-only">Sidebar Menu</SheetTitle>
            <AppSidebar inSheet onNavigate={() => setIsMobileSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1 flex flex-col justify-center overflow-hidden h-full pt-1">
        <h1 className="font-headline text-lg font-semibold hidden md:block truncate pr-4">{headerTitle}</h1>
        {chatMembers.length > 0 && (
            <div className="hidden md:flex items-center -space-x-1 overflow-hidden mt-0.5">
                {chatMembers.map((member) => {
                    const model = MODELS.find(m => m.id === member.uid || m.name === member.name);
                    const Icon = model?.icon || User;
                    
                    return (
                        <TooltipProvider key={member.uid} delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-5 w-5 border-2 border-background">
                                        <AvatarImage src={member.avatar} alt={member.name} />
                                        <AvatarFallback className="text-[10px] bg-muted">
                                            {model ? <Icon className="h-3 w-3 text-primary" /> : member.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{member.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
        <Button variant="ghost" className="relative h-8 w-full justify-start rounded-[0.5rem] bg-background/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64" onClick={toggle}>
          <Search className="h-4 w-4 mr-2" />
          <span className="hidden lg:inline-flex">Search...</span>
          <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <Command size={12}/>K
          </kbd>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 glassmorphic" align="end">
             <DropdownMenuLabel>
              <div className="flex items-center justify-between">
                <p className="font-semibold">Notifications</p>
                <Badge variant="secondary">3 New</Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex-col items-start gap-1 cursor-pointer">
              <p className="font-medium">🏆 New Badge Unlocked!</p>
              <p className="text-xs text-muted-foreground">You earned the 'Power User' badge.</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex-col items-start gap-1 cursor-pointer">
              <p className="font-medium">✨ Welcome to Xora!</p>
              <p className="text-xs text-muted-foreground">Check out our prompt templates to get started.</p>
            </DropdownMenuItem>
             <DropdownMenuItem className="flex-col items-start gap-1 cursor-pointer">
              <p className="font-medium">💬 Alex joined your "Project Phoenix" chat.</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary hover:underline cursor-pointer">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary/50">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User avatar'} />
                  <AvatarFallback>
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </MotionDiv>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glassmorphic" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{getUserName()}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved">
                    <Star className="mr-2 h-4 w-4" />
                    <span>Saved</span>
                  </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
              <Link href="/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="mr-2 h-4 w-4"/>
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="glassmorphic">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4"/>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4"/>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="mr-2 h-4 w-4"/>
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem asChild>
              <Link href="/support">
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Support</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
