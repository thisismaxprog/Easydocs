'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Loader2, Check } from 'lucide-react';
import { useAppToast } from '@/hooks/use-app-toast';
import { ensureClientUploadToken } from '@/app/actions';

export function ClientUploadLinkBlockClient({
  clientId,
  initialToken,
}: {
  clientId: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(!initialToken);
  const [copied, setCopied] = useState(false);
  const { success } = useAppToast();

  useEffect(() => {
    if (initialToken) return;
    ensureClientUploadToken(clientId).then((res) => {
      if (res.uploadToken) setToken(res.uploadToken);
      setLoading(false);
    });
  }, [clientId, initialToken]);

  function getUploadUrl(t: string) {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/upload/${t}`;
  }

  function handleCopy() {
    if (!token) return;
    const url = getUploadUrl(token);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      success('Link copiato', 'Il link di caricamento è stato copiato negli appunti.');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Generazione link…</span>
      </div>
    );
  }

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        Impossibile generare il link. Riprova più tardi.
      </p>
    );
  }

  const url = getUploadUrl(token);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground break-all font-mono bg-muted/50 p-2 rounded">
        {url}
      </p>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <Check className="mr-2 h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="mr-2 h-4 w-4" />
        )}
        {copied ? 'Copiato' : 'Copia link'}
      </Button>
    </div>
  );
}
