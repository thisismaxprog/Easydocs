'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil, Copy, Check } from 'lucide-react';
import { useAppToast } from '@/hooks/use-app-toast';
import { EditClientDialog } from './edit-client-dialog';

type Client = {
  id: string;
  name: string | null;
  company_name?: string | null;
  vat_number?: string | null;
  tax_code?: string | null;
  internal_code?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  upload_token?: string | null;
};

export function ClientDetailActions({ client }: { client: Client }) {
  const [editOpen, setEditOpen] = useState(false);
  const { success } = useAppToast();
  const router = useRouter();

  function getUploadUrl(token: string) {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/upload/${token}`;
  }

  function handleCopyLink(token: string | null) {
    if (!token) return;
    const url = getUploadUrl(token);
    navigator.clipboard.writeText(url).then(() => {
      success('Link copiato', 'Il link di caricamento è stato copiato negli appunti.');
    });
  }

  return (
    <div className="flex gap-2">
      <EditClientDialog client={client} open={editOpen} onOpenChange={setEditOpen} />
      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Modifica
      </Button>
      {client.upload_token && (
        <Button variant="outline" onClick={() => handleCopyLink(client.upload_token ?? null)}>
          <Copy className="mr-2 h-4 w-4" />
          Copia link
        </Button>
      )}
    </div>
  );
}
