'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-semibold text-foreground">Qualcosa è andato storto</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        Si è verificato un errore. Puoi riprovare o tornare alla dashboard.
      </p>
      <Button className="mt-6" onClick={reset}>
        Riprova
      </Button>
    </div>
  );
}
