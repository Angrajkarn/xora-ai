
'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { add } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { setChatExpiry } from '@/services/chatService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

export const SecureModeDialog = ({
    isOpen,
    onOpenChange,
    chatId,
    currentExpiry,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    chatId: string;
    currentExpiry: Date | null;
}) => {
    const [duration, setDuration] = useState('never');
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (currentExpiry) {
                const diffHours = (currentExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                if (diffHours <= 1) setDuration('1h');
                else if (diffHours <= 24) setDuration('24h');
                else setDuration('7d');
            } else {
                setDuration('never');
            }
        }
    }, [isOpen, currentExpiry]);

    const handleSave = async () => {
        let newExpiry: Timestamp | null = null;
        if (duration !== 'never') {
            const now = new Date();
            if (duration === '1h') newExpiry = Timestamp.fromDate(add(now, { hours: 1 }));
            if (duration === '24h') newExpiry = Timestamp.fromDate(add(now, { days: 1 }));
            if (duration === '7d') newExpiry = Timestamp.fromDate(add(now, { days: 7 }));
        }

        try {
            await setChatExpiry(chatId, newExpiry);
            toast({
                title: 'Security Settings Updated',
                description: `Self-destruct timer has been ${newExpiry ? 'set' : 'turned off'}.`
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to update security settings.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glassmorphic">
                <DialogHeader>
                    <DialogTitle className="font-headline">Secure Chat Settings</DialogTitle>
                    <DialogDescription>
                        Enhance privacy for this conversation. These settings only apply to this specific chat.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label className="font-semibold">Self-Destruct Timer</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                        Automatically delete this chat after a set period. This action is permanent.
                    </p>
                    <RadioGroup value={duration} onValueChange={setDuration}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="never" id="r-never" />
                            <Label htmlFor="r-never">Never (Default)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1h" id="r-1h" />
                            <Label htmlFor="r-1h">1 Hour</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="24h" id="r-24h" />
                            <Label htmlFor="r-24h">24 Hours</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="7d" id="r-7d" />
                            <Label htmlFor="r-7d">7 Days</Label>
                        </div>
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

