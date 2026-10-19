import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6" aria-busy aria-label="Cargando socio">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-56" />
      <Skeleton className="h-[28rem]" />
    </div>
  );
}
