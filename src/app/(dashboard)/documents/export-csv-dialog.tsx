'use client';

import { useState } from 'react';
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
import { EXPORT_PRESET_META, type ExportCsvPreset } from '@/lib/export-presets';

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
  const [csvPreset, setCsvPreset] = useState<ExportCsvPreset>('generic');
  const [loading, setLoading] = useState(false);
  const { success, error } = useAppToast();

  const selectedMeta = EXPORT_PRESET_META.find((p) => p.value === csvPreset);

  const presetFileSuffix: Record<ExportCsvPreset, string> = {
    generic: '',
    accounting_it: '-contabilita-it',
    teamsystem: '-teamsystem',
    danea: '-danea',
    zucchetti: '-zucchetti',
  };

  async function handleExport(format: 'xlsx' | 'csv') {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month,
        client_id: clientId,
        only_approved: onlyApproved === 'approved' ? 'true' : 'false',
      });
      if (format === 'csv') params.set('preset', csvPreset);

      const endpoint =
        format === 'xlsx' ? `/api/export-excel?${params}` : `/api/export-csv?${params}`;
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
      const suffix = format === 'csv' ? (presetFileSuffix[csvPreset] ?? '') : '';
      a.download = `export-${month}${suffix}${clientId !== 'all' ? `-${clientId}` : ''}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      const label = format === 'xlsx' ? 'Excel Easydocs' : (selectedMeta?.label ?? 'CSV');
      success('Export completato', `File ${label} scaricato.`);
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
          <DialogTitle>Export documenti</DialogTitle>
          <DialogDescription className="text-left">
            Scegli mese, cliente e formato. I template per gestionale usano separatore{' '}
            <code className="text-xs">;</code> e importi in formato italiano.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
          {/* Mese */}
          <div className="space-y-2">
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

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="min-w-0 max-w-full">
                <SelectValue className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutto lo studio</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stato documenti */}
          <div className="space-y-2">
            <Label>Includi documenti</Label>
            <Select
              value={onlyApproved}
              onValueChange={(v) => setOnlyApproved(v as 'approved' | 'all')}
            >
              <SelectTrigger className="min-w-0 max-w-full">
                <SelectValue className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti (anche estratti e da revisionare)</SelectItem>
                <SelectItem value="approved">Solo approvati</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formato CSV / Gestionale */}
          <div className="space-y-2">
            <Label>Formato CSV / Gestionale</Label>
            <Select
              value={csvPreset}
              onValueChange={(v) => setCsvPreset(v as ExportCsvPreset)}
            >
              <SelectTrigger className="min-w-0 max-w-full">
                <SelectValue placeholder="Scegli formato" className="truncate" />
              </SelectTrigger>
              <SelectContent className="max-w-[min(100vw-2rem,22rem)]">
                {EXPORT_PRESET_META.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMeta && (
              <p className="text-xs text-muted-foreground">{selectedMeta.description}</p>
            )}
            {(csvPreset === 'teamsystem' ||
              csvPreset === 'danea' ||
              csvPreset === 'zucchetti') && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Tracciato basato su documentazione pubblica. Verifica i codici conto e causale
                con il tuo gestionale prima dell'import definitivo.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Annulla
          </Button>
          <Button
            onClick={() => handleExport('xlsx')}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Export…' : 'Scarica Excel'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleExport('csv')}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading
              ? 'Export…'
              : csvPreset === 'generic'
                ? 'Scarica CSV'
                : `Scarica CSV ${selectedMeta?.label ?? ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
