'use client';

import { useState } from 'react';
import { createFirm } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function CreateFirmForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createFirm(formData);
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">Crea il tuo studio</CardTitle>
        <CardDescription>
          Inserisci il nome dello studio per iniziare.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 p-3">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome studio</Label>
            <Input
              id="name"
              name="name"
              placeholder="Studio Rossi & Associati"
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creazione…' : 'Crea studio'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
