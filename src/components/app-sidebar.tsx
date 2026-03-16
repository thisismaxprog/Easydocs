'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { dashboardNav } from '@/lib/nav';

export function AppSidebar({ collapsed: initialCollapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[52px]' : 'w-56'
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-3">
        {!collapsed && (
          <Link href="/overview" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="text-primary">Easydocs</span>
          </Link>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {dashboardNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/overview' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
