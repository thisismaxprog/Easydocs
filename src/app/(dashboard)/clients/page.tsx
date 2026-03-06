import { createClient } from '@/lib/supabase/server';
import { requireFirm } from '@/lib/get-firm-id';
import { ClientsTable } from './clients-table';
import { AddClientDialog } from './add-client-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default async function ClientsPage() {
  const firmId = await requireFirm();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, vat_number, email, created_at')
    .eq('firm_id', firmId)
    .order('name');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clienti</h1>
          <p className="text-muted-foreground">
            Gestisci le aziende clienti dello studio.
          </p>
        </div>
        <AddClientDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anagrafica</CardTitle>
          <CardDescription>Elenco clienti associati allo studio</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientsTable clients={clients ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
