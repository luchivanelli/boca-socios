import { Skeleton } from "@/components/Skeleton";

/** Esqueleto del listado de socios mientras llegan los datos. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy aria-label="Cargando socios">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-28" />
      <Skeleton className="h-20" />
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="hidden h-96 md:block" />
    </div>
  );
}
