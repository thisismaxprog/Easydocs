'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ExternalLink } from 'lucide-react';
import type { ClientInvitationStatus } from '@/lib/types';

type ClientRow = {
  id: string;
  name: string | null;
  company_name?: string | null;
  vat_number: string | null;
  tax_code?: string | null;
  contact_email?: string | null;
  email: string | null;
  invitation_status?: ClientInvitationStatus;
  upload_token?: string | null;
  created_at: string;
};

const statusLabels: Record<ClientInvitationStatus, string> = {
  not_invited: 'Non invitato',
  invited: 'Inviato',
  accepted: 'Accettato',
  expired: 'Scaduto',
};

const statusVariants: Record<ClientInvitationStatus, 'secondary' | 'default' | 'outline'> = {
  not_invited: 'secondary',
  invited: 'outline',
  accepted: 'default',
  expired: 'secondary',
};

export function ClientsTable({
  clients,
  docStats = {},
}: {
  clients: ClientRow[];
  docStats?: Record<string, { count: number; lastAt: string | null }>;
}) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientInvitationStatus | ''>('');

  const filtered = clients.filter((c) => {
    const name = c.company_name || c.name || '';
    const email = c.contact_email || c.email || '';
    const matchSearch =
      name.toLowerCase().includes(q.toLowerCase()) ||
      (c.vat_number ?? '').includes(q) ||
      (c.tax_code ?? '').includes(q) ||
      email.toLowerCase().includes(q.toLowerCase());
    const matchStatus = !statusFilter || c.invitation_status === statusFilter;
    return matchSearch && matchStatus;
  });

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
        <Users className="h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Nessun cliente</p>
        <p className="text-xs text-muted-foreground">
          Aggiungi il primo cliente per associare documenti e inviare il link di caricamento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Cerca per nome, P.IVA, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ClientInvitationStatus | '')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Tutti gli stati</option>
          {(Object.keys(statusLabels) as ClientInvitationStatus[]).map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
      </div>
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>P.IVA / Cod. fisc.</TableHead>
              <TableHead>Contatto</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Documenti</TableHead>
              <TableHead>Ultimo upload</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const stats = docStats[c.id] ?? { count: 0, lastAt: null };
              const displayName = c.company_name || c.name || '—';
              const contact = c.contact_email || c.email || '—';
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${c.id}`} className="hover:underline text-primary">
                      {displayName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {[c.vat_number, c.tax_code].filter(Boolean).join(' / ') || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{contact}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[c.invitation_status ?? 'not_invited']}>
                      {statusLabels[c.invitation_status ?? 'not_invited']}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{stats.count}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(stats.lastAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/clients/${c.id}`} aria-label="Apri dettaglio">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">Nessun risultato per i filtri selezionati.</p>
      )}
    </div>
  );
}
