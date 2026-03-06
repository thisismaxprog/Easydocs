'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addClient } from '@/app/actions';
import { useAppToast } from '@/hooks/use-app-toast';

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useAppToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await addClient(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      toastError('Errore', result.error);
      return;
    }
    success('Cliente aggiunto', 'Il cliente è stato creato.');
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Aggiungi cliente</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo cliente</DialogTitle>
          <DialogDescription>
            Inserisci i dati dell’azienda cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 p-3">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" placeholder="Ragione sociale" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat_number">P.IVA</Label>
            <Input id="vat_number" name="vat_number" placeholder="12345678901" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="cliente@email.it" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvataggio…' : 'Salva'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
