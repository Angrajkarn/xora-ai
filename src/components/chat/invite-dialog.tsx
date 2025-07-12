
'use client';

import { useState, useEffect } from 'react';
import { getMemberProfiles } from '@/app/(main)/chat/actions';
import type { Author, ChatSummary } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Copy } from 'lucide-react';

export const InviteDialog = ({
    isOpen,
    onOpenChange,
    chatData,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    chatData: ChatSummary | null;
}) => {
    const [members, setMembers] = useState<Author[]>([]);
    const [isFetchingMembers, setIsFetchingMembers] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const { toast } = useToast();
    const [shareUrl, setShareUrl] = useState('');

    useEffect(() => {
        if(isOpen) {
            setShareUrl(window.location.href);
            const fetchMembers = async () => {
                if (!chatData?.members) return;
                setIsFetchingMembers(true);
                try {
                    const profiles = await getMemberProfiles(chatData.members);
                    setMembers(profiles);
                } catch(e) {
                    console.error("Failed to fetch member profiles", e);
                    toast({ title: "Error", description: "Could not load chat members." });
                } finally {
                    setIsFetchingMembers(false);
                }
            }
            fetchMembers();
        }
    }, [isOpen, chatData, toast]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        toast({ title: 'Link copied to clipboard!' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md glassmorphic">
                <DialogHeader>
                    <DialogTitle className="font-headline">Invite Teammates</DialogTitle>
                    <DialogDescription>
                        Anyone with this link can view and join the conversation.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="share-link">Share Link</Label>
                        <div className="flex gap-2">
                            <Input id="share-link" value={shareUrl} readOnly className="bg-input/50" />
                            <Button onClick={handleCopyLink} size="icon" variant="outline" className="flex-shrink-0">
                                {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Members ({members.length})</Label>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {isFetchingMembers ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                ))
                            ) : members.map(member => (
                                <div key={member.uid} className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{member.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
