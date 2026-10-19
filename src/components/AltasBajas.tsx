import { TrendingDown, TrendingUp } from "lucide-react";
import { MESES } from "@/lib/constants";
import type { AltasBajasPorMes } from "@/lib/socios";

type Props = {
  anio: number;
  datos: AltasBajasPorMes;
};

/** Recuento mensual de altas y bajas del año seleccionado. */
export function AltasBajas({ anio, datos }: Props) {
  const totalAltas = datos.altas.reduce((a, b) => a + b, 0);
  const totalBajas = datos.bajas.reduce((a, b) => a + b, 0);
  const saldo = totalAltas - totalBajas;
  const mesActual = new Date().getMonth();
  const esAnioActual = anio === new Date().getFullYear();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-boca-azul">Altas y bajas {anio}</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-semibold text-green-700">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden /> {totalAltas} {totalAltas === 1 ? "alta" : "altas"}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-red-700">
            <TrendingDown className="h-3.5 w-3.5" aria-hidden /> {totalBajas} {totalBajas === 1 ? "baja" : "bajas"}
          </span>
          <span className={`font-semibold ${saldo > 0 ? "text-green-700" : saldo < 0 ? "text-red-700" : "text-slate-500"}`}>
            Saldo {saldo > 0 ? `+${saldo}` : saldo}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-6 gap-1 md:grid-cols-12">
        {MESES.map((mes, i) => {
          const altas = datos.altas[i];
          const bajas = datos.bajas[i];
          const futuro = esAnioActual && i > mesActual;
          return (
            <div
              key={mes}
              className={`rounded-md border px-1 py-1.5 text-center ${
                futuro ? "border-dashed border-slate-200 text-slate-300" : "border-slate-200"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase text-slate-500">{mes}</p>
              <p className={`text-sm font-bold ${altas > 0 && !futuro ? "text-green-700" : "text-slate-300"}`}>
                +{altas}
              </p>
              <p className={`text-sm font-bold ${bajas > 0 && !futuro ? "text-red-700" : "text-slate-300"}`}>
                −{bajas}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Se cuentan las fechas de alta y de baja cargadas en la ficha de cada socio.
      </p>
    </section>
  );
}
