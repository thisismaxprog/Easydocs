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
  const [csvPreset, setCsvPreset] = useState<'generic' | 'accounting_it'>('generic');
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
      if (format === 'csv') {
        params.set('preset', csvPreset);
      }
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
      const suffix =
        format === 'csv' && csvPreset === 'accounting_it' ? '-contabilita-it' : '';
      a.download = `export-${month}${suffix}${clientId !== 'all' ? `-${clientId}` : ''}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      success(
        'Export completato',
        format === 'xlsx'
          ? 'File Excel Easydocs scaricato.'
          : csvPreset === 'accounting_it'
            ? 'CSV per import gestionale (separatore ;) scaricato.'
            : 'File CSV scaricato.'
      );
      onOpenChange(false);
    } catch (e) {
      error('Errore export', e instanceof Error ? e.message : 'Export fallito');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md overflow-hidden sm:max-w-md">
        <DialogHeader className="min-w-0 shrink-0">
          <DialogTitle>Export</DialogTitle>
          <DialogDescription className="text-left space-y-1">
            <span className="block">
              Excel = formato Easydocs. CSV: scegli tra standard o contabilità IT (punto e virgola, importi tipo 69,00) per import in molti gestionali.
            </span>
            <span className="block text-xs">
              Template dedicati TeamSystem / Profis / Ipsoa: in roadmap, con file campione o tracciato ufficiale.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
          <div className="min-w-0 space-y-2">
            <Label>Mese (data documento)</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full min-w-0 max-w-full"
            />
            <p className="text-xs text-muted-foreground">
              Solo i documenti con data in questo mese vengono inclusi.
            </p>
          </div>
          <div className="min-w-0 space-y-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="min-w-0 max-w-full">
                <SelectValue className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutto lo studio</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label>Includi documenti</Label>
            <Select value={onlyApproved} onValueChange={(v) => setOnlyApproved(v as 'approved' | 'all')}>
              <SelectTrigger className="min-w-0 max-w-full">
                <SelectValue className="truncate" />
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
          <div className="min-w-0 space-y-2">
            <Label>Formato CSV</Label>
            <Select value={csvPreset} onValueChange={(v) => setCsvPreset(v as 'generic' | 'accounting_it')}>
              <SelectTrigger className="min-w-0 max-w-full">
                <SelectValue placeholder="Formato" className="truncate" />
              </SelectTrigger>
              <SelectContent className="max-w-[min(100vw-2rem,20rem)]">
                <SelectItem value="generic">Easydocs</SelectItem>
                <SelectItem value="accounting_it">Gestionale IT</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {csvPreset === 'accounting_it'
                ? 'CSV con separatore ; e importi tipo 69,00 (molti gestionali italiani).'
                : 'CSV con virgola, come l’Excel Easydocs.'}
            </p>
          </div>
        </div>
        <DialogFooter className="min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Annulla
          </Button>
          <Button onClick={() => handleExport('xlsx')} disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Export…' : 'Scarica Excel Easydocs'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleExport('csv')} disabled={loading} className="w-full sm:w-auto">
            {csvPreset === 'accounting_it' ? 'Scarica CSV gestionale' : 'Scarica CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
