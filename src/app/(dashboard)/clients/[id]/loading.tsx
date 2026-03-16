import { Skeleton } from '@/components/ui/skeleton';

export default function ClientDetailLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
      <Skeleton className="h-72 rounded-lg" />
    </div>
  );
}
