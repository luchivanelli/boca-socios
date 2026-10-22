import type { Estado, EstadoCuota, MetodoPago } from "@prisma/client";

export const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export const MESES_LARGO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export const ESTADO_LABEL: Record<Estado, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
};

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  TRANSFERENCIA: "Transferencia",
  DEBITO_AUTOMATICO: "Débito automático",
  COBRADOR: "Cobrador",
  BEBE: "Bebé",
};

/** Métodos que no llevan cuotas: no se marcan meses y el socio nunca es deudor. */
export const METODOS_SIN_CUOTA: MetodoPago[] = ["DEBITO_AUTOMATICO", "BEBE"];

/** Explicación corta para mostrar en lugar de la grilla de meses. */
export const EXPLICACION_SIN_CUOTA: Partial<Record<MetodoPago, string>> = {
  DEBITO_AUTOMATICO: "Débito automático: la cuota se descuenta todos los meses, no se marcan pagos.",
  BEBE: "Bebé: no paga cuota, todos los meses quedan nulos.",
};

export const ESTADOS = Object.keys(ESTADO_LABEL) as Estado[];

export const ESTADOS_CUOTA: EstadoCuota[] = ["PAGO", "NULO"];
export const METODOS_PAGO = Object.keys(METODO_PAGO_LABEL) as MetodoPago[];

export const NOMBRE_PENA =
  process.env.NEXT_PUBLIC_NOMBRE_PENA ?? "Peña Boca Juniors";
