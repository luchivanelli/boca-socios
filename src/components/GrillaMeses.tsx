import type { EstadoCuota } from "@prisma/client";
import { MESES } from "@/lib/constants";
import { PagoToggle } from "./PagoToggle";

type Props = {
  socioId: number;
  anio: number;
  estados: Map<number, EstadoCuota>;
  mesExigible: number;
};

/** Grilla compacta de 12 meses con etiqueta, pensada para tarjetas en celular. */
export function GrillaMeses({ socioId, anio, estados, mesExigible }: Props) {
  return (
    <div className="grid grid-cols-12 gap-1">
      {MESES.map((m, i) => (
        <div key={m} className="flex min-w-0 flex-col items-center gap-0.5">
          <span
            className={`text-[9px] font-semibold uppercase leading-none ${
              i + 1 > mesExigible ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {m}
          </span>
          <PagoToggle
            socioId={socioId}
            anio={anio}
            mes={i + 1}
            estado={estados.get(i + 1) ?? null}
            futuro={i + 1 > mesExigible}
          />
        </div>
      ))}
    </div>
  );
}
