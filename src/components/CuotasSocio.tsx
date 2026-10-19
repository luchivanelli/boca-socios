"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { EstadoCuota } from "@prisma/client";
import { marcarCuota } from "@/actions/socios";
import { MESES, MESES_LARGO } from "@/lib/constants";
import { Icono } from "./IconosSprite";

export type EstadosMes = (EstadoCuota | null)[]; // índice 0 = enero; null = impago

type Props = {
  socioId: number;
  anio: number;
  estados: EstadosMes;
  /** Último mes exigible del año (los posteriores se muestran atenuados). */
  mesExigible: number;
  /**
   * celdas: 12 <td> para la tabla de escritorio.
   * grilla: fila compacta con etiquetas, para las tarjetas de celular.
   * grande: botones grandes con el nombre del mes, para la ficha.
   */
  modo: "celdas" | "grilla" | "grande";
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
  NULO: "nulo",
};

/**
 * Las 12 casillas de cuota de un socio en un único componente cliente: así el payload de
 * hidratación lleva una entrada por socio en vez de doce, y el HTML de cada botón es mínimo
 * (los estilos están en globals.css bajo .cuota).
 */
export function CuotasSocio({ socioId, anio, estados, mesExigible, modo }: Props) {
  const [optimistas, setOptimista] = useOptimistic(
    estados,
    (actual: EstadosMes, cambio: { indice: number; estado: EstadoCuota | null }) =>
      actual.map((e, i) => (i === cambio.indice ? cambio.estado : e)),
  );
  const [, startTransition] = useTransition();
  const [pendientes, setPendientes] = useState<Set<number>>(new Set());

  function tocar(indice: number) {
    const nuevo = siguiente(optimistas[indice]);
    setPendientes((p) => new Set(p).add(indice));
    startTransition(async () => {
      setOptimista({ indice, estado: nuevo });
      try {
        await marcarCuota(socioId, anio, indice + 1, nuevo);
      } finally {
        setPendientes((p) => {
          const s = new Set(p);
          s.delete(indice);
          return s;
        });
      }
    });
  }

  const boton = (i: number) => {
    const estado = optimistas[i];
    const futuro = i + 1 > mesExigible;
    const grande = modo === "grande";
    const titulo = `${grande ? MESES_LARGO[i] : MESES[i]} ${anio}: ${DESCRIPCION[estado ?? "IMPAGO"]}`;
    const icono =
      estado === "PAGO" ? <Icono nombre="check" /> : estado === "NULO" ? <Icono nombre="minus" /> : null;
    return (
      <button
        key={i}
        type="button"
        onClick={() => tocar(i)}
        disabled={pendientes.has(i)}
        title={titulo}
        data-estado={estado ?? "IMPAGO"}
        data-futuro={futuro ? "" : undefined}
        className={grande ? "cuota cuota-grande" : "cuota cuota-chica"}
      >
        {grande ? (
          <>
            {icono}
            {MESES_LARGO[i]}
          </>
        ) : (
          (icono ?? <Icono nombre="check" className="h-4 w-4 opacity-0" />)
        )}
      </button>
    );
  };

  if (modo === "celdas") {
    return (
      <>
        {MESES.map((_, i) => (
          <td key={i} className="mes">
            {boton(i)}
          </td>
        ))}
      </>
    );
  }

  if (modo === "grilla") {
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
            {boton(i)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {MESES.map((_, i) => boton(i))}
    </div>
  );
}
