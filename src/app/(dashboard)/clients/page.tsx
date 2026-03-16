import { createClient } from '@/lib/supabase/server';
import { requireFirm } from '@/lib/get-firm-id';
import { ClientsTable } from './clients-table';
import { AddClientDialog } from './add-client-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Upload } from 'lucide-react';

export default async function ClientsPage() {
  const firmId = await requireFirm();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company_name, vat_number, tax_code, contact_email, email, invitation_status, upload_token, created_at')
    .eq('firm_id', firmId)
    .order('name');

  const { data: docs } = await supabase
    .from('documents')
    .select('client_id, created_at')
    .eq('firm_id', firmId);

  const docStats: Record<string, { count: number; lastAt: string | null }> = {};
  docs?.forEach((d) => {
    const cid = d.client_id ?? '_none_';
    if (!docStats[cid]) docStats[cid] = { count: 0, lastAt: null };
    docStats[cid].count += 1;
    if (d.created_at && (!docStats[cid].lastAt || d.created_at > docStats[cid].lastAt)) {
      docStats[cid].lastAt = d.created_at;
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clienti</h1>
          <p className="text-muted-foreground">
            Gestisci le aziende e i clienti dello studio.
          </p>
        </div>
        <div className="flex gap-2">
          <AddClientDialog />
          <Button variant="outline" asChild>
            <Link href="/documents">
              <Upload className="mr-2 h-4 w-4" />
              Carica documento
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anagrafica clienti</CardTitle>
          <CardDescription>Elenco clienti associati allo studio. Clicca su un cliente per dettagli e link di caricamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientsTable
            clients={clients ?? []}
            docStats={docStats}
          />
        </CardContent>
      </Card>
    </div>
  );
}
