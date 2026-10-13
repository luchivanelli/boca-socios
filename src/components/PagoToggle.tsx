"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Minus } from "lucide-react";
import type { EstadoCuota } from "@prisma/client";
import { marcarCuota } from "@/actions/socios";
import { MESES_LARGO } from "@/lib/constants";

type Props = {
  socioId: number;
  anio: number;
  mes: number;
  /** PAGO, NULO o null si está impago. */
  estado: EstadoCuota | null;
  /** Mes aún no exigible (futuro): se muestra atenuado. */
  futuro?: boolean;
  /** Tamaño grande con el nombre del mes (ficha del socio). */
  grande?: boolean;
};

/** Ciclo al tocar: impago -> pago -> nulo -> impago. */
function siguiente(estado: EstadoCuota | null): EstadoCuota | null {
  if (estado === null) return "PAGO";
  if (estado === "PAGO") return "NULO";
  return null;
}

const DESCRIPCION: Record<"PAGO" | "NULO" | "IMPAGO", string> = {
  IMPAGO: "sin pagar",
  PAGO: "pagado",
  NULO: "nulo (no corresponde cobrar)",
};

export function PagoToggle({ socioId, anio, mes, estado, futuro, grande }: Props) {
  const [optimista, setOptimista] = useOptimistic(estado);
  const [pendiente, startTransition] = useTransition();

  const nombreMes = MESES_LARGO[mes - 1];
  const actual = DESCRIPCION[optimista ?? "IMPAGO"];
  const proximo = DESCRIPCION[siguiente(optimista) ?? "IMPAGO"];
  const titulo = `${nombreMes} ${anio}: ${actual}. Tocá para marcar como ${proximo}.`;

  function onClick() {
    const nuevo = siguiente(optimista);
    startTransition(async () => {
      setOptimista(nuevo);
      await marcarCuota(socioId, anio, mes, nuevo);
    });
  }

  const base = grande
    ? "h-12 w-full gap-1.5 rounded-lg text-sm sm:text-base font-bold"
    : "h-8 w-full md:h-7 md:w-7 rounded text-sm font-bold";

  const estilo =
    optimista === "PAGO"
      ? "bg-boca-amarillo text-boca-azul border-boca-amarillo-oscuro shadow-sm"
      : optimista === "NULO"
        ? "bg-slate-200 text-slate-500 border-slate-300 line-through decoration-slate-400"
        : futuro
          ? "bg-slate-50 text-slate-500 border-dashed border-slate-200 active:border-boca-azul"
          : "bg-white text-slate-700 border-slate-300 active:bg-boca-amarillo-suave hover:border-boca-azul";

  const icono =
    optimista === "PAGO" ? (
      <Check className="h-4 w-4" aria-hidden />
    ) : optimista === "NULO" ? (
      <Minus className="h-4 w-4" aria-hidden />
    ) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pendiente}
      aria-label={titulo}
      title={titulo}
      data-estado={optimista ?? "IMPAGO"}
      className={`${base} ${estilo} inline-flex touch-manipulation select-none items-center justify-center border transition disabled:opacity-60`}
    >
      {grande ? (
        <>
          {icono}
          {nombreMes}
        </>
      ) : (
        (icono ?? <Check className="h-4 w-4 opacity-0" aria-hidden />)
      )}
    </button>
  );
}
