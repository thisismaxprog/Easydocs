'use client';

import { useToast } from '@/components/ui/use-toast';

export function useAppToast() {
  const { toast } = useToast();

  return {
    success: (title: string, description?: string) =>
      toast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) =>
      toast({ title, description, variant: 'destructive' }),
    message: (title: string, description?: string) =>
      toast({ title, description }),
  };
}
