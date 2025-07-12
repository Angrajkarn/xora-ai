'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useCommandPalette } from '@/contexts/command-palette-provider';
import { MODELS } from '@/lib/constants';

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, setIsOpen } = useCommandPalette();

  const runCommand = React.useCallback((command: () => unknown) => {
    setIsOpen(false);
    command();
  }, [setIsOpen]);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="AI Models">
          {MODELS.map((model) => (
            <CommandItem
              key={model.id}
              value={model.name}
              onSelect={() => {
                runCommand(() => router.push(`/chat?model=${model.id}`));
              }}
            >
              <model.icon className="mr-2 h-4 w-4" />
              <span>{model.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
