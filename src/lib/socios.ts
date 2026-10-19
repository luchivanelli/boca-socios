import type { Estado, EstadoCuota, MetodoPago } from "@prisma/client";
import { prisma } from "./prisma";

/** Solo lo que hace falta de cada cuota: evita traer id, socioId y fecha en cada fila. */
const PAGO_CAMPOS = { anio: true, mes: true, estado: true } as const;

export type Cuota = { anio: number; mes: number };
type RegistroCuota = { anio: number; mes: number; estado: EstadoCuota };

export async function getSocio(id: number) {
  return prisma.socio.findUnique({
    where: { id },
    include: { pagos: { select: PAGO_CAMPOS, orderBy: [{ anio: "asc" }, { mes: "asc" }] } },
  });
}

/**
 * Años con cuotas registradas (GROUP BY en la base, no trae todas las filas).
 * Devuelve la lista para el selector (descendente, con el año actual) y el primer año
 * desde el que se cuentan cuotas. Una sola consulta para ambas cosas.
 */
export async function getResumenAnios() {
  const filas = await prisma.pago.groupBy({ by: ["anio"], orderBy: { anio: "desc" } });
  const anioActual = new Date().getFullYear();
  const anios = new Set(filas.map((f) => f.anio));
  anios.add(anioActual);
  const lista = [...anios].sort((a, b) => b - a);
  return { anios: lista, anioInicio: Math.min(lista[lista.length - 1], anioActual) };
}

/**
 * Primer año desde el que se cuentan cuotas: el más antiguo con registros en el sistema.
 * Antes de ese año no se le debe nada a nadie.
 */
export async function getAnioInicio() {
  return (await getResumenAnios()).anioInicio;
}

/** Estado de cada mes de un año como array de 12 (índice 0 = enero): PAGO, NULO o null si está impago. */
export function estadosDelAnio(pagos: RegistroCuota[], anio: number): (EstadoCuota | null)[] {
  const estados: (EstadoCuota | null)[] = Array(12).fill(null);
  for (const p of pagos) if (p.anio === anio) estados[p.mes - 1] = p.estado;
  return estados;
}

/** Último mes que ya debería estar pago para el año dado (0 si el año es futuro). */
export function ultimoMesExigible(anio: number, hoy = new Date()) {
  const anioActual = hoy.getFullYear();
  if (anio < anioActual) return 12;
  if (anio > anioActual) return 0;
  return hoy.getMonth() + 1;
}

/** El socio paga por débito automático: no se marcan meses a mano y nunca es deudor. */
export function esDebitoAutomatico(socio: { metodoPago: MetodoPago }) {
  return socio.metodoPago === "DEBITO_AUTOMATICO";
}

/**
 * Cuotas adeudadas: todos los meses sin registro (ni PAGO ni NULO) desde enero de
 * `anioInicio` hasta el mes actual. La deuda se arrastra de un año al siguiente.
 * Ej.: en febrero 2027, si no pagó noviembre y diciembre 2026 ni enero 2027, debe 3 cuotas.
 * Devuelve [] para inactivos y para débito automático.
 */
export function calcularDeuda(
  socio: { estado: Estado; metodoPago: MetodoPago; pagos: RegistroCuota[] },
  anioInicio: number,
  hoy = new Date(),
): Cuota[] {
  if (socio.estado === "INACTIVO" || esDebitoAutomatico(socio)) return [];
  const registradas = new Set(socio.pagos.map((p) => `${p.anio}-${p.mes}`));
  const deuda: Cuota[] = [];
  for (let anio = anioInicio; anio <= hoy.getFullYear(); anio++) {
    const limite = ultimoMesExigible(anio, hoy);
    for (let mes = 1; mes <= limite; mes++) {
      if (!registradas.has(`${anio}-${mes}`)) deuda.push({ anio, mes });
    }
  }
  return deuda;
}

export type AltasBajasPorMes = { altas: number[]; bajas: number[] };

/** Cantidad de altas y bajas por mes (índice 0 = enero) según las fechas cargadas en cada ficha. */
export async function getAltasBajasPorMes(anio: number): Promise<AltasBajasPorMes> {
  const desde = new Date(Date.UTC(anio, 0, 1));
  const hasta = new Date(Date.UTC(anio + 1, 0, 1));
  const socios = await prisma.socio.findMany({
    where: {
      OR: [{ fechaAlta: { gte: desde, lt: hasta } }, { fechaBaja: { gte: desde, lt: hasta } }],
    },
    select: { fechaAlta: true, fechaBaja: true },
  });
  const altas = Array<number>(12).fill(0);
  const bajas = Array<number>(12).fill(0);
  for (const s of socios) {
    if (s.fechaAlta && s.fechaAlta.getUTCFullYear() === anio) altas[s.fechaAlta.getUTCMonth()]++;
    if (s.fechaBaja && s.fechaBaja.getUTCFullYear() === anio) bajas[s.fechaBaja.getUTCMonth()]++;
  }
  return { altas, bajas };
}

