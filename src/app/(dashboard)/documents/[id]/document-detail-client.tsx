'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DOC_TYPE_OPTIONS, getDocTypeLabel } from '@/lib/doc-type-labels';
import { updateDocumentFields, updateDocumentStatus } from '@/app/actions';
import { useAppToast } from '@/hooks/use-app-toast';
const formSchema = z.object({
  doc_type: z.string().optional(),
  doc_date: z.string().optional(),
  doc_number: z.string().optional(),
  total: z.union([z.string(), z.number()]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Doc = {
  id: string;
  filename: string;
  status: string;
  mime_type?: string | null;
  doc_type: string | null;
  doc_date: string | null;
  doc_number: string | null;
  total: number | null;
  clients: { name?: string } | null;
};

type Extraction = {
  extracted_json: Record<string, unknown>;
  confidence: number | null;
  issues: string[] | null;
};
type AuditLog = { id: string; action: string; created_at: string };

export function DocumentDetailClient({
  document: doc,
  extraction: ext,
  auditLogs,
  signedUrl,
}: {
  document: Doc;
  extraction: Extraction | null;
  auditLogs: AuditLog[];
  signedUrl: string | null;
}) {
  const router = useRouter();
  const { success, error } = useAppToast();
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  if (!doc?.id) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <p className="text-muted-foreground">Dati documento non disponibili.</p>
        <Button variant="outline" asChild>
          <Link href="/documents">Torna ai documenti</Link>
        </Button>
      </div>
    );
  }

  const json = ext?.extracted_json && typeof ext.extracted_json === 'object' ? ext.extracted_json : null;
  const safeStr = (v: unknown) => (v != null && typeof v === 'string' ? v : v != null ? String(v) : '');
  const safeNum = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : typeof v === 'string' ? Number(v) : null);
  const totalFromJson = safeNum(json?.total_amount);

  const defaultValues: FormValues = {
    doc_type: doc.doc_type ?? safeStr(json?.doc_type) ?? '',
    doc_date: doc.doc_date ?? safeStr(json?.doc_date) ?? '',
    doc_number: doc.doc_number ?? safeStr(json?.doc_number) ?? '',
    total: doc.total != null ? String(doc.total) : (totalFromJson != null ? String(totalFromJson) : ''),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  async function onSave(values: FormValues) {
    setSaving(true);
    const result = await updateDocumentFields(doc.id, {
      doc_type: values.doc_type && values.doc_type !== '__none__' ? values.doc_type : undefined,
      doc_date: values.doc_date || undefined,
      doc_number: values.doc_number || undefined,
      total: values.total ? Number(values.total) : undefined,
    });
    setSaving(false);
    if (result?.error) {
      error('Errore', result.error);
      return;
    }
    success('Salvato', 'Modifiche applicate.');
    router.refresh();
  }

  async function onApprove() {
    setApproving(true);
    const result = await updateDocumentStatus(doc.id, 'approved');
    setApproving(false);
    if (result?.error) {
      error('Errore', result.error);
      return;
    }
    success('Documento approvato', 'Pronto per l’export.');
    router.refresh();
  }

  async function onNeedsReview() {
    const result = await updateDocumentStatus(doc.id, 'needs_review');
    if (result?.error) {
      error('Errore', result.error);
      return;
    }
    success('Stato aggiornato', 'In attesa di revisione.');
    router.refresh();
  }

  const conf = typeof ext?.confidence === 'number' && !Number.isNaN(ext.confidence) ? ext.confidence : 0;
  const actionLabels: Record<string, string> = {
    'document.uploaded': 'Caricato',
    'document.processing': 'In elaborazione',
    'document.approved': 'Approvato',
    'document.needs_review': 'Da revisionare',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/documents"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">{doc.filename}</h1>
          <p className="text-sm text-muted-foreground">{(doc.clients as { name?: string } | null)?.name ?? 'Senza cliente'}</p>
        </div>
        <Badge variant={doc.status as 'processing' | 'needs_review' | 'approved' | 'failed' | 'uploaded' | 'extracted'}>{doc.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Anteprima</CardTitle>
            <CardDescription>File caricato</CardDescription>
          </CardHeader>
          <CardContent>
            {signedUrl ? (
              doc.mime_type?.startsWith('image/') ? (
                <img src={signedUrl} alt={doc.filename} className="max-w-full rounded border border-border" />
              ) : (
                <iframe src={signedUrl} title={doc.filename} className="w-full h-[500px] rounded border border-border" />
              )
            ) : (
              <p className="text-sm text-muted-foreground">Anteprima non disponibile.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Tabs defaultValue="fields">
            <TabsList>
              <TabsTrigger value="fields">Campi estratti</TabsTrigger>
              <TabsTrigger value="audit">Cronologia</TabsTrigger>
            </TabsList>
            <TabsContent value="fields" className="space-y-4">
              {ext && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Confidenza:</span>
                  <div className="h-2 flex-1 max-w-[120px] rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${conf >= 0.8 ? 'bg-emerald-500' : conf >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${conf * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground">{Math.round(conf * 100)}%</span>
                </div>
              )}
              {ext?.issues && ext.issues.length > 0 && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <ul className="list-disc list-inside">
                    {ext.issues.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
              <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo documento</Label>
                    <Controller
                      name="doc_type"
                      control={form.control}
                      render={({ field }) => {
                        const selectValue = field.value && field.value !== '' ? field.value : '__none__';
                        return (
                          <Select
                            value={selectValue}
                            onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona tipo">
                                {selectValue !== '__none__' ? getDocTypeLabel(String(selectValue)) : null}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">—</SelectItem>
                              {DOC_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data (YYYY-MM-DD)</Label>
                    <Input {...form.register('doc_date')} placeholder="2024-01-15" />
                  </div>
                  <div className="space-y-2">
                    <Label>Numero documento</Label>
                    <Input {...form.register('doc_number')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Totale (€)</Label>
                    <Input type="number" step="0.01" {...form.register('total')} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border sticky bottom-0 bg-card">
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvataggio…' : 'Salva'}
                  </Button>
                  {doc.status !== 'approved' && (
                    <Button type="button" variant="secondary" onClick={onApprove} disabled={approving}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approva
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={onNeedsReview}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Da revisionare
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="audit">
              <ul className="space-y-2 text-sm">
                {(Array.isArray(auditLogs) ? auditLogs : []).length === 0 ? (
                  <li className="text-muted-foreground">Nessuna attività.</li>
                ) : (
                  (Array.isArray(auditLogs) ? auditLogs : []).map((log) => (
                    <li key={log.id} className="flex justify-between">
                      <span>{actionLabels[log.action] ?? log.action}</span>
                      <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString('it')}</span>
                    </li>
                  ))
                )}
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
