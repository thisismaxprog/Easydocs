import { Skeleton } from '@/components/ui/skeleton';

export default function ClientsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}
