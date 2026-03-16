'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Upload, Download } from 'lucide-react';
import { getDocTypeLabel } from '@/lib/doc-type-labels';
import { UploadDocumentDialog } from '@/components/upload-document-dialog';
import { ExportCsvDialog } from './export-csv-dialog';

type Doc = {
  id: string;
  filename: string;
  status: string;
  doc_type: string | null;
  doc_date: string | null;
  total: number | null;
  created_at: string;
  client_id?: string | null;
  clients: { name?: string } | null;
};

type Client = { id: string; name: string };

export function DocumentsPageClient({
  initialDocuments,
  clients,
}: {
  initialDocuments: Doc[];
  clients: Client[];
}) {
  const [documents] = useState(initialDocuments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchSearch =
        !search ||
        d.filename.toLowerCase().includes(search.toLowerCase()) ||
        (d.clients as { name?: string } | null)?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchClient = clientFilter === 'all' || d.client_id === clientFilter;
      return matchSearch && matchStatus && matchClient;
    });
  }, [documents, search, statusFilter, clientFilter]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, d) => sum + (d.total != null ? Number(d.total) : 0), 0),
    [filtered]
  );

  const statusOptions = [
    'all',
    'uploaded',
    'processing',
    'extracted',
    'needs_review',
    'approved',
    'failed',
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documenti</h1>
          <p className="text-muted-foreground">
            Carica, revisiona e approva i documenti.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Carica
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Elenco documenti</CardTitle>
          <CardDescription>Filtra per ricerca, stato o cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Cerca per nome file o cliente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'Tutti gli stati' : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i clienti</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Nessun documento</p>
              <p className="text-xs text-muted-foreground">
                Carica il primo documento o modifica i filtri.
              </p>
              <Button className="mt-4" onClick={() => setUploadOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Carica documento
              </Button>
              <div className="mt-4 text-sm font-medium text-muted-foreground">
                Totale documenti: € 0,00
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card">File</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium sticky left-0 bg-card">
                        <Link href={`/documents/${doc.id}`} className="hover:underline truncate block max-w-[200px]">
                          {doc.filename}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(doc.clients as { name?: string } | null)?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={doc.status as 'processing' | 'needs_review' | 'approved' | 'failed' | 'uploaded' | 'extracted'}>{doc.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{getDocTypeLabel(doc.doc_type)}</TableCell>
                      <TableCell className="text-muted-foreground">{doc.doc_date ?? '—'}</TableCell>
                      <TableCell className="text-right">{doc.total != null ? `€ ${Number(doc.total).toFixed(2)}` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end border-t border-border bg-muted/30 px-4 py-3 text-sm font-medium">
                Totale documenti: € {totalAmount.toFixed(2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => router.refresh()}
      />
      <ExportCsvDialog open={exportOpen} onOpenChange={setExportOpen} clients={clients} />
    </div>
  );
}
