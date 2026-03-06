import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';
import { getCurrentFirmId } from '@/lib/get-firm-id';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const firmId = await getCurrentFirmId();
  if (!firmId) redirect('/create-firm');

  let firmName: string | null = null;
  const { data: firm } = await supabase.from('firms').select('name').eq('id', firmId).single();
  firmName = firm?.name ?? null;

  return <AppShell firmName={firmName}>{children}</AppShell>;
}
