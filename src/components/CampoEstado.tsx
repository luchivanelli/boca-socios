"use client";

import { useState } from "react";
import type { Estado } from "@prisma/client";
import { ESTADO_LABEL, ESTADOS } from "@/lib/constants";
import { mesISO } from "@/lib/cuotas";

type Props = {
  estado?: Estado;
  fechaBaja?: Date | null;
  errorEstado?: string;
  errorFechaBaja?: string;
  inputClase: string;
};

/**
 * Select de alta/baja. Cuando se elige "Inactivo" aparece el mes de baja,
 * que alimenta el recuento mensual de altas y bajas del listado.
 */
export function CampoEstado({ estado, fechaBaja, errorEstado, errorFechaBaja, inputClase }: Props) {
  const [actual, setActual] = useState<Estado>(estado ?? "ACTIVO");

  return (
    <>
      <div>
        <label htmlFor="estado" className="mb-1 block text-sm font-medium text-slate-700">
          Alta
        </label>
        <select
          id="estado"
          name="estado"
          value={actual}
          onChange={(e) => setActual(e.target.value as Estado)}
          className={inputClase}
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_LABEL[e]}
            </option>
          ))}
        </select>
        {errorEstado && <p className="mt-1 text-xs text-red-600">{errorEstado}</p>}
      </div>

      {actual === "INACTIVO" && (
        <div>
          <label htmlFor="fechaBaja" className="mb-1 block text-sm font-medium text-slate-700">
            Fecha de baja (mes/año)
          </label>
          <input
            id="fechaBaja"
            name="fechaBaja"
            type="month"
            defaultValue={mesISO(fechaBaja ?? new Date())}
            placeholder="mm/aaaa"
            required
            className={inputClase}
          />
          {errorFechaBaja ? (
            <p className="mt-1 text-xs text-red-600">{errorFechaBaja}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Mes en que dejó de ser socio.</p>
          )}
        </div>
      )}
    </>
  );
}
