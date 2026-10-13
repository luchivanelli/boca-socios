"use client";

import { useState } from "react";
import { mesISO } from "@/lib/cuotas";

type Props = {
  /** Fecha de alta guardada, o null/undefined si está indefinida o el socio es nuevo. */
  fechaAlta?: Date | null;
  /** true en el alta de un socio nuevo: la casilla de anular arranca marcada. */
  esNuevo: boolean;
  error?: string;
  inputClase: string;
};

/**
 * Casilla "Tiene fecha de alta". Solo si está marcada se muestran el selector de mes
 * y la opción de anular los meses anteriores. Sin marcar, la fecha queda indefinida.
 */
export function CamposFechaAlta({ fechaAlta, esNuevo, error, inputClase }: Props) {
  const [conFecha, setConFecha] = useState(Boolean(fechaAlta));

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="conFechaAlta"
          checked={conFecha}
          onChange={(e) => setConFecha(e.target.checked)}
          className="h-5 w-5 accent-boca-azul"
        />
        Registrar fecha de alta
        <span className="text-xs font-normal text-slate-500">(si no, queda indefinida)</span>
      </label>

      {conFecha && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="fechaAlta" className="mb-1 block text-sm font-medium text-slate-700">
              Fecha de alta (mes/año)
            </label>
            <input
              id="fechaAlta"
              name="fechaAlta"
              type="month"
              defaultValue={mesISO(fechaAlta ?? new Date())}
              placeholder="mm/aaaa"
              required
              className={inputClase}
            />
            {error ? (
              <p className="mt-1 text-xs text-red-600">{error}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Mes en que ingresó a la peña.</p>
            )}
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm font-medium text-slate-700 sm:pt-6">
            <input
              type="checkbox"
              name="anularAnteriores"
              defaultChecked={esNuevo}
              className="mt-0.5 h-5 w-5 shrink-0 accent-boca-azul"
            />
            <span>
              Anular meses anteriores a la fecha de alta
              <span className="block text-xs font-normal text-slate-500">
                Las cuotas previas al ingreso quedan como nulas y no cuentan como deuda. No
                modifica las que ya estén pagadas.
              </span>
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
