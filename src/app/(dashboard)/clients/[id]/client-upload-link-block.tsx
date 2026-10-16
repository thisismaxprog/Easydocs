'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Loader2, Check, RefreshCw } from 'lucide-react';
import { useAppToast } from '@/hooks/use-app-toast';
import { ensureClientUploadToken, regenerateClientUploadToken } from '@/app/actions';

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
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const { success, error } = useAppToast();

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

  async function handleRegenerate() {
    if (!confirmRegenerate) {
      setConfirmRegenerate(true);
      return;
    }
    setRegenerating(true);
    const res = await regenerateClientUploadToken(clientId);
    setRegenerating(false);
    setConfirmRegenerate(false);
    if (res.uploadToken) {
      setToken(res.uploadToken);
      success('Nuovo link generato', 'Il link precedente non funziona più. Invia al cliente quello nuovo.');
    } else {
      error('Errore', res.error ?? 'Impossibile rigenerare il link.');
    }
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
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={confirmRegenerate ? 'destructive' : 'ghost'}
          size="sm"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          {regenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {confirmRegenerate ? 'Conferma: disattiva il link attuale' : 'Rigenera link'}
        </Button>
        {confirmRegenerate && !regenerating && (
          <Button variant="ghost" size="sm" onClick={() => setConfirmRegenerate(false)}>
            Annulla
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Rigenera il link se l&apos;hai inviato alla persona sbagliata o non vuoi più ricevere file da questo indirizzo.
      </p>
    </div>
  );
}
