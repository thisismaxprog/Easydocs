import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireFirm } from '@/lib/get-firm-id';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Copy, Link2 } from 'lucide-react';
import { ClientDetailActions } from './client-detail-actions';
import { ClientUploadLinkBlockClient } from './client-upload-link-block';
import { formatDistanceToNow } from '@/lib/date-utils';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const firmId = await requireFirm();
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .single();

  if (error || !client) notFound();

  const { data: documents } = await supabase
    .from('documents')
    .select('id, filename, status, source_type, created_at')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  const displayName = client.company_name || client.name || 'Cliente';
  const contactEmail = client.contact_email || client.email;
  const statusLabels: Record<string, string> = {
    not_invited: 'Non invitato',
    invited: 'Inviato',
    accepted: 'Accettato',
    expired: 'Scaduto',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients" aria-label="Torna ai clienti">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
            <p className="text-muted-foreground text-sm">
              Scheda cliente · Documenti e link di caricamento
            </p>
          </div>
        </div>
        <ClientDetailActions client={client} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dati anagrafici</CardTitle>
            <CardDescription>Informazioni sul cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">P.IVA</span>
              <span>{client.vat_number || '—'}</span>
              <span className="text-muted-foreground">Codice fiscale</span>
              <span>{client.tax_code || '—'}</span>
              <span className="text-muted-foreground">Codice interno</span>
              <span>{client.internal_code || '—'}</span>
              <span className="text-muted-foreground">Referente</span>
              <span>{client.contact_name || '—'}</span>
              <span className="text-muted-foreground">Email</span>
              <span>{contactEmail || '—'}</span>
              <span className="text-muted-foreground">Telefono</span>
              <span>{client.phone || '—'}</span>
              <span className="text-muted-foreground">Stato invito</span>
              <Badge variant="secondary">{statusLabels[client.invitation_status] ?? client.invitation_status}</Badge>
            </div>
            {client.notes && (
              <div>
                <span className="text-muted-foreground">Note</span>
                <p className="mt-1">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Link di caricamento
            </CardTitle>
            <CardDescription>
              Invia questo link al cliente per permettergli di caricare documenti in modo sicuro. I file verranno associati automaticamente a questo cliente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientUploadLinkBlock clientId={client.id} uploadToken={client.upload_token} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documenti caricati
          </CardTitle>
          <CardDescription>
            Ultimi documenti ricevuti per questo cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!documents?.length ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Nessun documento</p>
              <p className="text-xs text-muted-foreground">
                I documenti caricati tramite il link di caricamento appariranno qui.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(doc.created_at)} · {doc.status}
                          {doc.source_type === 'upload_link' && ' · Link cliente'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{doc.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClientUploadLinkBlock({
  clientId,
  uploadToken,
}: {
  clientId: string;
  uploadToken: string | null;
}) {
  return (
    <ClientUploadLinkBlockClient
      clientId={clientId}
      initialToken={uploadToken}
    />
  );
}
