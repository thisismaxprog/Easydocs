import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getCurrentFirmId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('firm_members')
    .select('firm_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();
  return data?.firm_id ?? null;
}

export async function requireFirm() {
  const firmId = await getCurrentFirmId();
  if (!firmId) redirect('/create-firm');
  return firmId;
}
