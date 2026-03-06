'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Search, Upload, LogOut, User, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { useCommandPalette } from '@/components/command-palette';

export function AppHeader({
  onUploadClick,
  firmName,
}: {
  onUploadClick?: () => void;
  firmName?: string | null;
}) {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const { setOpen: setCommandOpen } = useCommandPalette();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex flex-1 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted md:max-w-sm"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span>Cerca documenti, clienti… (Ctrl+K)</span>
      </button>
      <div className="flex items-center gap-2">
        {firmName && (
          <span className="hidden text-sm text-muted-foreground md:inline">
            {firmName}
          </span>
        )}
        {onUploadClick && (
          <Button onClick={onUploadClick} size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Carica
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
