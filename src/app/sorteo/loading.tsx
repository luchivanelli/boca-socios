import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4" aria-busy aria-label="Cargando sorteo">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
