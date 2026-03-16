'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateClient } from '@/app/actions';
import { useAppToast } from '@/hooks/use-app-toast';

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
};

export function EditClientDialog({
  client,
  open,
  onOpenChange,
}: {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useAppToast();
  const router = useRouter();

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateClient(client.id, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      toastError('Errore', result.error);
      return;
    }
    success('Cliente aggiornato', 'Le modifiche sono state salvate.');
    onOpenChange(false);
    router.refresh();
  }

  const displayName = client.company_name || client.name || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifica cliente</DialogTitle>
          <DialogDescription>
            Aggiorna i dati anagrafici del cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 p-3">{error}</p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="company_name">Ragione sociale / Nome *</Label>
              <Input
                id="company_name"
                name="company_name"
                defaultValue={displayName}
                placeholder="Es. Rossi S.r.l."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat_number">P.IVA</Label>
              <Input id="vat_number" name="vat_number" defaultValue={client.vat_number ?? ''} placeholder="12345678901" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_code">Codice fiscale</Label>
              <Input id="tax_code" name="tax_code" defaultValue={client.tax_code ?? ''} placeholder="RSSMRA80A01H501Z" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internal_code">Codice interno</Label>
              <Input id="internal_code" name="internal_code" defaultValue={client.internal_code ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Referente</Label>
              <Input id="contact_name" name="contact_name" defaultValue={client.contact_name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email contatto</Label>
              <Input id="contact_email" name="contact_email" type="email" defaultValue={client.contact_email ?? client.email ?? ''} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email (secondaria)</Label>
              <Input id="email" name="email" type="email" defaultValue={client.email ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={client.phone ?? ''} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Note</Label>
              <Input id="notes" name="notes" defaultValue={client.notes ?? ''} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvataggio…' : 'Salva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
