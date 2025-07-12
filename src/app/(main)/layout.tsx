
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { CommandPaletteProvider } from '@/contexts/command-palette-provider';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CommandPaletteProvider>
      <div className="relative flex h-screen bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
