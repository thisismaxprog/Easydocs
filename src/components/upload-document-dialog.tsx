'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { uploadDocument } from '@/app/actions';
import { useAppToast } from '@/hooks/use-app-toast';

type Client = { id: string; name: string };

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const { success, error } = useAppToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const firmId = (await supabase.from('firm_members').select('firm_id').limit(1).single()).data?.firm_id;
      if (!firmId) return;
      const { data } = await supabase.from('clients').select('id, name').eq('firm_id', firmId).order('name');
      setClients(data ?? []);
    })();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.set('file', file);
    if (clientId) formData.set('client_id', clientId);
    const result = await uploadDocument(formData);
    setLoading(false);
    if (result?.error) {
      error('Errore', result.error);
      return;
    }
    success('Documento caricato', 'L’elaborazione è stata avviata.');
    setFile(null);
    setClientId('');
    onOpenChange(false);
    onSuccess?.();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Carica documento</DialogTitle>
          <DialogDescription>
            Aggiungi una fattura o un documento (PDF o immagine). I dati verranno estratti automaticamente quando possibile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente (facoltativo)</Label>
            <Select value={clientId || 'none'} onValueChange={(v) => setClientId(v === 'none' ? '' : v)}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Seleziona cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nessuno</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!file || loading}>
              {loading ? 'Caricamento…' : 'Carica'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
