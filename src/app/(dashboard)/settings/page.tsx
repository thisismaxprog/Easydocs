import { createClient } from '@/lib/supabase/server';
import { requireFirm } from '@/lib/get-firm-id';
import { SettingsForm } from './settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default async function SettingsPage() {
  const firmId = await requireFirm();
  const supabase = await createClient();
  const { data: firm } = await supabase.from('firms').select('name').eq('id', firmId).single();
  const { data: members } = await supabase
    .from('firm_members')
    .select('id, user_id, role, created_at')
    .eq('firm_id', firmId)
    .order('created_at');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground">
          Nome studio e membri.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Studio</CardTitle>
          <CardDescription>Nome dello studio visibile in app</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initialName={firm?.name ?? ''} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membri</CardTitle>
          <CardDescription>Persone con accesso allo studio (inviti in arrivo)</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {members?.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {m.role === 'owner' ? 'Proprietario' : 'Membro'} · ID: {m.user_id.slice(0, 8)}…
                </span>
                <span className="text-xs text-muted-foreground">Dal {new Date(m.created_at).toLocaleDateString('it')}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            L’invito di nuovi membri sarà disponibile in un aggiornamento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
