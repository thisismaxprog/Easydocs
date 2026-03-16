'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileUp, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UploadLinkPage() {
  const params = useParams();
  const token = params?.token as string;
  const [clientName, setClientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setInvalid(true);
      return;
    }
    fetch(`/api/upload-link?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid && data.clientName) {
          setClientName(data.clientName);
        } else {
          setInvalid(true);
        }
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !token) return;
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set('token', token);
    formData.set('file', file);
    try {
      const res = await fetch('/api/upload-link', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Caricamento fallito');
        setUploading(false);
        return;
      }
      setSuccess(true);
      setFile(null);
    } catch {
      setError('Errore di connessione');
    }
    setUploading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Caricamento…</p>
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-foreground">Link non valido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Il link di caricamento non è valido o è scaduto. Contatta il tuo commercialista per ottenere un nuovo link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Caricamento documenti per</p>
          <h1 className="text-2xl font-semibold text-foreground mt-1">{clientName}</h1>
          <p className="text-xs text-muted-foreground mt-2">Easydocs · Invio sicuro al tuo studio</p>
        </div>

        {success ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="font-medium text-foreground">Documento caricato</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Il file è stato ricevuto. Puoi caricarne un altro qui sotto oppure chiudere la pagina.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSuccess(false)}
            >
              Carica un altro file
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f && (f.type === 'application/pdf' || f.type.startsWith('image/'))) setFile(f);
              }}
            >
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                id="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">
                {file ? file.name : 'Trascina qui il file o clicca per scegliere'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPEG fino a 10 MB</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => document.getElementById('file')?.click()}
              >
                Scegli file
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Caricamento…
                </>
              ) : (
                'Invia documento'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
