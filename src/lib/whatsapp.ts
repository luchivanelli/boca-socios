import type { MetodoPago } from "@prisma/client";
import { METODO_PAGO_LABEL, NOMBRE_PENA } from "./constants";
import { describirCuotas } from "./cuotas";
import type { Cuota } from "./socios";

/**
 * Normaliza un teléfono argentino al formato que usa wa.me
 * (549 + código de área + número, sin el 0 ni el 15).
 *
 * Un celular sin 0 ni 15 tiene siempre 10 dígitos: código de área de 2 a 4 cifras
 * más número de 8 a 6 (11 + 8, 341 + 7, 3402 + 6). Como el largo del área no se
 * puede deducir del número, el "15" solo se quita cuando sobran exactamente 2 dígitos.
 *
 * Ej: "3415324882"     -> "5493415324882"  (341 + 5324882, se respeta tal cual)
 *     "3402533651"     -> "5493402533651"  (3402 + 533651)
 *     "0341 15 532-4882" -> "5493415324882"
 */
export function normalizarTelefono(telefono: string) {
  let digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("549") && digitos.length === 13) return digitos;
  if (digitos.startsWith("54") && digitos.length >= 12) digitos = digitos.slice(2);
  if (digitos.startsWith("0")) digitos = digitos.slice(1);
  if (digitos.length === 12) {
    // Sobran 2 dígitos: es el "15" después del código de área (de 2 a 4 cifras).
    digitos = digitos.replace(/^(\d{2,4})15(\d+)$/, "$1$2");
  }
  return `549${digitos}`;
}

export function linkWhatsApp(telefono: string, mensaje: string) {
  return `https://wa.me/${normalizarTelefono(telefono)}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajeDeuda(
  socio: { nombre: string; metodoPago: MetodoPago },
  cuotas: Cuota[],
) {
  const cantidad = cuotas.length;
  const texto = cantidad === 1 ? "1 cuota pendiente" : `${cantidad} cuotas pendientes`;
  return (
    `Hola ${socio.nombre}! Te escribimos de ${NOMBRE_PENA}. ` +
    `Te recordamos que tenés ${texto}: ${describirCuotas(cuotas)}. ` +
    `Tu forma de pago registrada es ${METODO_PAGO_LABEL[socio.metodoPago].toLowerCase()}. ` +
    `Cualquier duda escribinos por acá. ¡Gracias y vamos Boca!`
  );
}
