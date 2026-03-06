import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireFirm } from '@/lib/get-firm-id';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Users, ArrowRight } from 'lucide-react';
import { OverviewUploadButton } from './upload-button';
import { formatDistanceToNow } from '@/lib/date-utils';

export default async function OverviewPage() {
  const firmId = await requireFirm();
  const supabase = await createClient();

  const [docsResult, logsResult, clientsCount, docsCount] = await Promise.all([
    supabase
      .from('documents')
      .select('id, filename, status, created_at, clients(name)')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, created_at')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('firm_id', firmId),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('firm_id', firmId),
  ]);

  const documents = docsResult.data ?? [];
  const logs = logsResult.data ?? [];
  const totalClients = clientsCount.count ?? 0;
  const totalDocs = docsCount.count ?? 0;
  const approvedCount =
    (await supabase.from('documents').select('id', { count: 'exact', head: true }).eq('firm_id', firmId).eq('status', 'approved')).count ?? 0;
  const needsReviewCount =
    (await supabase.from('documents').select('id', { count: 'exact', head: true }).eq('firm_id', firmId).eq('status', 'needs_review')).count ?? 0;

  const actionLabel: Record<string, string> = {
    'document.uploaded': 'Documento caricato',
    'document.approved': 'Documento approvato',
    'document.needs_review': 'In attesa di revisione',
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Riepilogo dell’attività del tuo studio.
          </p>
        </div>
        <OverviewUploadButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clienti
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Anagrafica clienti</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documenti
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocs}</div>
            <p className="text-xs text-muted-foreground">Totale caricati</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approvati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Pronti per export</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Da revisionare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{needsReviewCount}</div>
            <p className="text-xs text-muted-foreground">Verifica campi</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ultimi documenti</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/documents">
                Vedi tutti <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Nessun documento</p>
                <p className="text-xs text-muted-foreground">
                  Carica il primo documento per iniziare.
                </p>
                <OverviewUploadButton className="mt-4" />
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.clients as { name?: string } | null)?.name ?? 'Senza cliente'} · {formatDistanceToNow(doc.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={doc.status as 'processing' | 'needs_review' | 'approved' | 'failed' | 'uploaded' | 'extracted'}>{doc.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attività recente</CardTitle>
            <CardDescription>Ultime azioni nello studio</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna attività recente.</p>
            ) : (
              <ul className="space-y-3">
                {logs.map((log) => (
                  <li key={log.id} className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {actionLabel[log.action] ?? log.action}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{formatDistanceToNow(log.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
