import type { Estado, MetodoPago } from "@prisma/client";
import { ESTADOS, METODOS_PAGO } from "./constants";

export type SearchParams = Record<string, string | string[] | undefined>;

function primero(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function leerAnio(sp: SearchParams) {
  const n = Number(primero(sp.anio));
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : new Date().getFullYear();
}

export function leerTexto(sp: SearchParams, clave: string) {
  return primero(sp[clave])?.trim() || undefined;
}

export function leerEstado(sp: SearchParams): Estado | undefined {
  const v = primero(sp.estado);
  return ESTADOS.includes(v as Estado) ? (v as Estado) : undefined;
}

export function leerMetodoPago(sp: SearchParams): MetodoPago | undefined {
  const v = primero(sp.metodo);
  return METODOS_PAGO.includes(v as MetodoPago) ? (v as MetodoPago) : undefined;
}

export const ORDENES = {
  "nroSocio-asc": "Nº de socio (menor a mayor)",
  "nroSocio-desc": "Nº de socio (mayor a menor)",
  "apellido-asc": "Alfabético (A → Z)",
  "apellido-desc": "Alfabético (Z → A)",
} as const;

/** Órdenes de la sección Deudores. */
export const ORDENES_DEUDORES = {
  "deuda-desc": "Más cuotas adeudadas",
  "deuda-asc": "Menos cuotas adeudadas",
  "apellido-asc": "Alfabético (A → Z)",
  "apellido-desc": "Alfabético (Z → A)",
} as const;

export type Orden = keyof typeof ORDENES | keyof typeof ORDENES_DEUDORES;
export type OrdenDeudores = keyof typeof ORDENES_DEUDORES;

export const ORDEN_POR_DEFECTO: Orden = "nroSocio-asc";
export const ORDEN_DEUDORES_POR_DEFECTO: OrdenDeudores = "deuda-desc";

export function leerOrden(sp: SearchParams): Orden {
  const v = primero(sp.orden);
  return v && v in ORDENES ? (v as Orden) : ORDEN_POR_DEFECTO;
}

export function leerOrdenDeudores(sp: SearchParams): OrdenDeudores {
  const v = primero(sp.orden);
  return v && v in ORDENES_DEUDORES ? (v as OrdenDeudores) : ORDEN_DEUDORES_POR_DEFECTO;
}

export const FILTROS_CUOTAS = {
  "al-dia": "Al día",
  deudores: "Deudores",
} as const;

export type FiltroCuotas = keyof typeof FILTROS_CUOTAS;

export function leerCuotas(sp: SearchParams): FiltroCuotas | undefined {
  const v = primero(sp.cuotas);
  return v && v in FILTROS_CUOTAS ? (v as FiltroCuotas) : undefined;
}

export function leerEntero(sp: SearchParams, clave: string, porDefecto: number) {
  const n = Number(primero(sp[clave]));
  return Number.isInteger(n) && n >= 0 ? n : porDefecto;
}
