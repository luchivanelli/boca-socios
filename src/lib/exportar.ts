import type { Estado, MetodoPago } from "@prisma/client";
import { ESTADO_LABEL, METODO_PAGO_LABEL } from "./constants";
import { etiquetaCuota, formatearMes } from "./cuotas";
import type { FilaListado } from "./listado";
import type { Orden } from "./params";
import type { Cuota } from "./socios";

/** Fila lista para exportar: todo en texto plano para poder pasarla a un componente cliente. */
export type SocioExportable = {
  nroSocio: number;
  nombre: string;
  apellido: string;
  dni: string;
  localidad: string;
  direccion: string;
  telefono: string;
  estado: string;
  carnet: string;
  metodoPago: string;
  fechaAlta: string;
  observaciones: string;
  /** Cantidad de cuotas adeudadas (0 si está al día, es inactivo o paga por débito). */
  deudaCantidad: number;
  /** Meses adeudados en texto, ej. "Nov 2026, Ene, Feb". */
  deudaDetalle: string;
  inactivo: boolean;
  /** Débito automático o bebé. */
  debito: boolean;
};

export type TipoExportacion = "todos" | "al-dia" | "deudores";

export const TIPOS_EXPORTACION: Record<TipoExportacion, string> = {
  todos: "Todos los socios",
  "al-dia": "Socios al día",
  deudores: "Socios deudores",
};

/** Columnas que se pueden incluir en el PDF, en el orden en que aparecen. */
export const COLUMNAS_EXPORTACION = [
  { clave: "nroSocio", etiqueta: "Nº socio" },
  { clave: "apellido", etiqueta: "Apellido" },
  { clave: "nombre", etiqueta: "Nombre" },
  { clave: "dni", etiqueta: "DNI" },
  { clave: "telefono", etiqueta: "Teléfono" },
  { clave: "localidad", etiqueta: "Localidad" },
  { clave: "direccion", etiqueta: "Dirección" },
  { clave: "estado", etiqueta: "Alta" },
  { clave: "carnet", etiqueta: "Carnet" },
  { clave: "metodoPago", etiqueta: "Método de pago" },
  { clave: "deuda", etiqueta: "Deuda" },
  { clave: "fechaAlta", etiqueta: "Fecha de alta" },
  { clave: "observaciones", etiqueta: "Observaciones" },
] as const;

export type ClaveColumna = (typeof COLUMNAS_EXPORTACION)[number]["clave"];

export const COLUMNAS_POR_DEFECTO: ClaveColumna[] = ["nroSocio", "apellido", "nombre"];

/** Filtros del listado que viajan del modal a la server action de exportación. */
export type FiltrosExportacion = {
  q?: string;
  estado?: Estado;
  metodoPago?: MetodoPago;
  orden?: Orden;
  anio: number;
};

/** Pasa una fila del listado al formato plano del PDF. */
export function aExportable(fila: FilaListado, detalle: Cuota[], anioActual: number): SocioExportable {
  const { socio } = fila;
  return {
    nroSocio: socio.nroSocio,
    nombre: socio.nombre,
    apellido: socio.apellido,
    dni: socio.dni,
    localidad: socio.localidad,
    direccion: socio.direccion ?? "",
    telefono: socio.telefono ?? "",
    estado: ESTADO_LABEL[socio.estado],
    carnet: socio.carnet ? "Sí" : "No",
    metodoPago: METODO_PAGO_LABEL[socio.metodoPago],
    fechaAlta: formatearMes(socio.fechaAlta),
    observaciones: socio.observaciones ?? "",
    deudaCantidad: fila.deuda,
    deudaDetalle: detalle.map((c) => etiquetaCuota(c, anioActual)).join(", "),
    inactivo: fila.inactivo,
    debito: fila.debito,
  };
}

export function valorColumna(fila: SocioExportable, clave: ClaveColumna): string {
  if (clave === "deuda") {
    if (fila.inactivo) return "—";
    if (fila.debito) return fila.metodoPago;
    if (fila.deudaCantidad === 0) return "Al día";
    const cuotas = fila.deudaCantidad === 1 ? "1 cuota" : `${fila.deudaCantidad} cuotas`;
    return `${cuotas}: ${fila.deudaDetalle}`;
  }
  const valor = fila[clave];
  return typeof valor === "number" ? String(valor) : valor;
}
