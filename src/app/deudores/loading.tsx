import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy aria-label="Cargando deudores">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="hidden h-80 md:block" />
    </div>
  );
}
