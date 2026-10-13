import type { Estado, EstadoCuota, MetodoPago, Prisma } from "@prisma/client";
import { ORDEN_POR_DEFECTO, type Orden } from "./params";
import { prisma } from "./prisma";

export type SocioConPagos = Prisma.SocioGetPayload<{ include: { pagos: true } }>;
export type Cuota = { anio: number; mes: number };
type RegistroCuota = { anio: number; mes: number; estado: EstadoCuota };

export type FiltrosSocios = {
  q?: string;
  estado?: Estado;
  metodoPago?: MetodoPago;
  orden?: Orden;
};

const ORDEN_PRISMA: Record<Orden, Prisma.SocioOrderByWithRelationInput[]> = {
  "apellido-asc": [{ apellido: "asc" }, { nombre: "asc" }],
  "apellido-desc": [{ apellido: "desc" }, { nombre: "desc" }],
  "nroSocio-asc": [{ nroSocio: "asc" }],
  "nroSocio-desc": [{ nroSocio: "desc" }],
};

/** Lista de socios con todos sus registros de cuotas (hacen falta para la deuda acumulada). */
export async function getSocios({
  q,
  estado,
  metodoPago,
  orden = ORDEN_POR_DEFECTO,
}: FiltrosSocios) {
  const where: Prisma.SocioWhereInput = {};
  if (estado) where.estado = estado;
  if (metodoPago) where.metodoPago = metodoPago;
  if (q && q.trim()) {
    const texto = q.trim();
    const numero = Number(texto);
    where.OR = [
      { nombre: { contains: texto, mode: "insensitive" } },
      { apellido: { contains: texto, mode: "insensitive" } },
      { dni: { contains: texto } },
      { localidad: { contains: texto, mode: "insensitive" } },
      ...(Number.isInteger(numero) ? [{ nroSocio: numero }] : []),
    ];
  }

  return prisma.socio.findMany({
    where,
    include: { pagos: true },
    orderBy: ORDEN_PRISMA[orden],
  });
}

export async function getSocio(id: number) {
  return prisma.socio.findUnique({
    where: { id },
    include: { pagos: { orderBy: [{ anio: "asc" }, { mes: "asc" }] } },
  });
}

/** Años con cuotas registradas, más el actual, para el selector de año. */
export async function getAniosDisponibles() {
  const filas = await prisma.pago.findMany({
    distinct: ["anio"],
    select: { anio: true },
    orderBy: { anio: "desc" },
  });
  const anios = new Set(filas.map((f) => f.anio));
  anios.add(new Date().getFullYear());
  return [...anios].sort((a, b) => b - a);
}

/**
 * Primer año desde el que se cuentan cuotas: el más antiguo con registros en el sistema.
 * Antes de ese año no se le debe nada a nadie.
 */
export async function getAnioInicio() {
  const primero = await prisma.pago.findFirst({
    select: { anio: true },
    orderBy: { anio: "asc" },
  });
  const anioActual = new Date().getFullYear();
  return Math.min(primero?.anio ?? anioActual, anioActual);
}

/** Estado de cada mes (1-12) de un año: PAGO, NULO o ausente si está impago. */
export function estadosDelAnio(pagos: RegistroCuota[], anio: number) {
  return new Map(pagos.filter((p) => p.anio === anio).map((p) => [p.mes, p.estado]));
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

export function nombreCompleto(s: { nombre: string; apellido: string }) {
  return `${s.apellido}, ${s.nombre}`;
}
