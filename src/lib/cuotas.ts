import { MESES, MESES_LARGO } from "./constants";
import type { Cuota } from "./socios";

/** Valor "aaaa-mm" para un <input type="month"> (usa UTC porque la fecha se guarda como día 1). */
export function mesISO(fecha: Date) {
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "mm/aaaa" para mostrar la fecha de alta. */
export function formatearMes(fecha: Date) {
  return `${String(fecha.getUTCMonth() + 1).padStart(2, "0")}/${fecha.getUTCFullYear()}`;
}

/**
 * Interpreta "aaaa-mm" (input month) o "mm/aaaa" (escrito a mano) y devuelve
 * el día 1 de ese mes en UTC, o null si no es válido.
 */
export function parsearMes(texto: string): Date | null {
  const iso = /^(\d{4})-(\d{1,2})$/.exec(texto);
  const latino = /^(\d{1,2})\/(\d{4})$/.exec(texto);
  const [anio, mes] = iso
    ? [Number(iso[1]), Number(iso[2])]
    : latino
      ? [Number(latino[2]), Number(latino[1])]
      : [NaN, NaN];
  if (!Number.isInteger(anio) || !Number.isInteger(mes)) return null;
  if (anio < 2000 || anio > 2100 || mes < 1 || mes > 12) return null;
  return new Date(Date.UTC(anio, mes - 1, 1));
}

/** "Nov 2026" si es de otro año, "Nov" si es del año en curso. */
export function etiquetaCuota(cuota: Cuota, anioActual = new Date().getFullYear()) {
  const mes = MESES[cuota.mes - 1];
  return cuota.anio === anioActual ? mes : `${mes} ${cuota.anio}`;
}

/**
 * Lista legible agrupada por año, para mensajes:
 * "noviembre y diciembre de 2026, enero de 2027".
 */
export function describirCuotas(cuotas: Cuota[]) {
  const porAnio = new Map<number, string[]>();
  for (const c of cuotas) {
    const lista = porAnio.get(c.anio) ?? [];
    lista.push(MESES_LARGO[c.mes - 1].toLowerCase());
    porAnio.set(c.anio, lista);
  }
  return [...porAnio.entries()]
    .sort(([a], [b]) => a - b)
    .map(([anio, meses]) => `${unirConY(meses)} de ${anio}`)
    .join(", ");
}

function unirConY(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}
