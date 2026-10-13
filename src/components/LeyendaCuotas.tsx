import { Check, Minus } from "lucide-react";

/** Referencia de los tres estados de una cuota. */
export function LeyendaCuotas() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-4 w-4 rounded border border-slate-300 bg-white" />
        Impago
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-boca-amarillo-oscuro bg-boca-amarillo text-boca-azul">
          <Check className="h-3 w-3" aria-hidden />
        </span>
        Pagado
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-slate-200 text-slate-500">
          <Minus className="h-3 w-3" aria-hidden />
        </span>
        Nulo (no se cobra, ej. antes del alta)
      </span>
    </div>
  );
}
