'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateFirmName } from '@/app/actions';
import { useAppToast } from '@/hooks/use-app-toast';

export function SettingsForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const { success, error } = useAppToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateFirmName(name);
    setLoading(false);
    if (result?.error) {
      error('Errore', result.error);
      return;
    }
    success('Nome aggiornato', 'Le modifiche sono state salvate.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name">Nome studio</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Studio Rossi & Associati"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Salvataggio…' : 'Salva'}
      </Button>
    </form>
  );
}
