'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

type Client = { id: string; name: string; vat_number: string | null; email: string | null; created_at: string };

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [q, setQ] = useState('');
  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.vat_number ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q.toLowerCase())
  );

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
        <Users className="h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Nessun cliente</p>
        <p className="text-xs text-muted-foreground">
          Aggiungi il primo cliente per associarlo ai documenti.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Cerca per nome, P.IVA, email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>P.IVA</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.vat_number ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{c.email ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">Nessun risultato per la ricerca.</p>
      )}
    </div>
  );
}
