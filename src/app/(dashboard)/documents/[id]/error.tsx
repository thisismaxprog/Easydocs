'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function DocumentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Document detail error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <FileQuestion className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-semibold text-foreground">Impossibile aprire il documento</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        Si è verificato un errore nel caricamento. Puoi riprovare o tornare all’elenco documenti.
      </p>
      {error?.message && (
        <p className="mt-3 text-xs text-muted-foreground max-w-lg font-mono bg-muted/50 px-3 py-2 rounded break-all">
          {error.message}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Riprova</Button>
        <Button variant="outline" asChild>
          <Link href="/documents">Torna ai documenti</Link>
        </Button>
      </div>
    </div>
  );
}
