import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateFirmForm } from './create-firm-form';

export default async function CreateFirmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('firm_members')
    .select('firm_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (membership?.firm_id) redirect('/overview');

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <CreateFirmForm />
      </div>
    </div>
  );
}
