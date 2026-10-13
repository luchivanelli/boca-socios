"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

type Props = {
  /** Cantidad de filtros distintos del valor por defecto, para el contador del botón. */
  activos: number;
  children: React.ReactNode;
};

/**
 * En celular esconde los filtros detrás de un botón; en pantallas sm+ los muestra
 * en línea (el contenedor pasa a display: contents para no romper la grilla del form).
 */
export function PanelFiltros({ activos, children }: Props) {
  const [abierto, setAbierto] = useState(activos > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="panel-filtros"
        className="flex w-full items-center justify-between rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 sm:hidden"
      >
        <span className="inline-flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-boca-azul" aria-hidden />
          Filtros y orden
          {activos > 0 && (
            <span className="rounded-full bg-boca-amarillo px-1.5 text-xs font-bold text-boca-azul">
              {activos}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div id="panel-filtros" className={`${abierto ? "grid" : "hidden"} gap-2 sm:contents`}>
        {children}
      </div>
    </>
  );
}
