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
import { LayoutDashboard, Users, FileText, Settings, HelpCircle } from 'lucide-react';

const routes = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/clients', label: 'Clienti', icon: Users },
  { href: '/documents', label: 'Documenti', icon: FileText },
  { href: '/settings', label: 'Impostazioni', icon: Settings },
  { href: '/help', label: 'Aiuto', icon: HelpCircle },
];

type CommandPaletteContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CommandPaletteContext = React.createContext<CommandPaletteContextType | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cerca pagine…" />
        <CommandList>
          <CommandEmpty>Nessun risultato.</CommandEmpty>
          <CommandGroup heading="Navigazione">
            {routes.map((r) => {
              const Icon = r.icon;
              return (
                <CommandItem
                  key={r.href}
                  onSelect={() => {
                    router.push(r.href);
                    setOpen(false);
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {r.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) return { open: false, setOpen: () => {} };
  return ctx;
}
