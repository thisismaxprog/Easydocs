'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadDocumentDialog } from '@/components/upload-document-dialog';

export function OverviewUploadButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className}>
        <Upload className="mr-2 h-4 w-4" />
        Carica documento
      </Button>
      <UploadDocumentDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
