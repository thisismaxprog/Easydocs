import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton className="h-12 w-full max-w-sm" />
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}
