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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAppToast } from '@/hooks/use-app-toast';

type Client = { id: string; name: string };

export function ExportCsvDialog({
  open,
  onOpenChange,
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
}) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [clientId, setClientId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const { success, error } = useAppToast();
  const router = useRouter();

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month, client_id: clientId });
      const res = await fetch(`/api/export-csv?${params}`);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${month}${clientId !== 'all' ? `-${clientId}` : ''}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      success('Export completato', 'Il file CSV è stato scaricato.');
      onOpenChange(false);
    } catch (e) {
      error('Errore export', e instanceof Error ? e.message : 'Export fallito');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export CSV</DialogTitle>
          <DialogDescription>
            Esporta i documenti approvati per un mese (studio intero o singolo cliente).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mese</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutto lo studio</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? 'Export…' : 'Scarica CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
