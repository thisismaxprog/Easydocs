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
  const [onlyApproved, setOnlyApproved] = useState<'approved' | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const { success, error } = useAppToast();
  const router = useRouter();

  async function handleExport(format: 'xlsx' | 'csv') {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month,
        client_id: clientId,
        only_approved: onlyApproved === 'approved' ? 'true' : 'false',
      });
      const endpoint = format === 'xlsx' ? `/api/export-excel?${params}` : `/api/export-csv?${params}`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      a.download = `export-${month}${clientId !== 'all' ? `-${clientId}` : ''}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      success('Export completato', format === 'xlsx' ? 'Il file Excel è stato scaricato.' : 'Il file CSV è stato scaricato.');
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
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>
            Esporta i documenti per un mese (studio intero o singolo cliente). Seleziona il mese della data documento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mese (data documento)</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Solo i documenti con data in questo mese vengono inclusi.
            </p>
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
          <div className="space-y-2">
            <Label>Includi documenti</Label>
            <Select value={onlyApproved} onValueChange={(v) => setOnlyApproved(v as 'approved' | 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti (anche estratti e da revisionare)</SelectItem>
                <SelectItem value="approved">Solo approvati</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Scegli &quot;Tutti&quot; per vedere nell’export anche i documenti non ancora approvati.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={() => handleExport('xlsx')} disabled={loading}>
            {loading ? 'Export…' : 'Scarica Excel'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleExport('csv')} disabled={loading}>
            Scarica CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
