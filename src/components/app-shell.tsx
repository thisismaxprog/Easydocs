'use client';

import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { CommandPaletteProvider } from '@/components/command-palette';
import { UploadDocumentDialog } from '@/components/upload-document-dialog';
import { useRouter } from 'next/navigation';

export function AppShell({
  firmName,
  children,
}: {
  firmName: string | null;
  children: React.ReactNode;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const router = useRouter();

  return (
    <CommandPaletteProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader firmName={firmName} onUploadClick={() => setUploadOpen(true)} />
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => router.refresh()}
      />
    </CommandPaletteProvider>
  );
}
