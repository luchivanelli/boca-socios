import type { Estado, MetodoPago } from "@prisma/client";
import { ESTADO_LABEL, METODO_PAGO_LABEL } from "@/lib/constants";

export function EstadoBadge({ estado }: { estado: Estado }) {
  const clase =
    estado === "ACTIVO"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${clase}`}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}

export function MetodoPagoBadge({ metodo }: { metodo: MetodoPago }) {
  const clase =
    metodo === "DEBITO_AUTOMATICO"
      ? "border-boca-azul bg-boca-azul text-boca-amarillo"
      : "border-boca-azul/20 bg-boca-azul/5 text-boca-azul";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${clase}`}>
      {METODO_PAGO_LABEL[metodo]}
    </span>
  );
}

export function CarnetBadge({ carnet }: { carnet: boolean }) {
  return carnet ? (
    <span className="inline-block rounded-full bg-boca-amarillo px-2 py-0.5 text-xs font-semibold text-boca-azul">
      Carnet
    </span>
  ) : (
    <span className="inline-block rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-400">
      Sin carnet
    </span>
  );
}

/** Estado de deuda de un socio: inactivos y débito automático no deben nada. */
export function DeudaBadge({
  cantidad,
  inactivo,
  debito,
}: {
  cantidad: number;
  inactivo?: boolean;
  debito?: boolean;
}) {
  if (inactivo) return <span className="text-xs text-slate-400">—</span>;
  if (debito) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full border border-boca-azul/20 bg-boca-azul/5 px-2 py-0.5 text-xs font-semibold text-boca-azul">
        Débito
      </span>
    );
  }
  if (cantidad === 0) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
        Al día
      </span>
    );
  }
  const clase =
    cantidad >= 3 ? "bg-red-100 text-red-800 border-red-200" : "bg-amber-100 text-amber-800 border-amber-200";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${clase}`}>
      Debe {cantidad} {cantidad === 1 ? "cuota" : "cuotas"}
    </span>
  );
}
