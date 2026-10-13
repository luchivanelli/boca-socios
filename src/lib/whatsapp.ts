import type { MetodoPago } from "@prisma/client";
import { METODO_PAGO_LABEL, NOMBRE_PENA } from "./constants";
import { describirCuotas } from "./cuotas";
import type { Cuota } from "./socios";

/**
 * Normaliza un teléfono argentino al formato que usa wa.me
 * (549 + código de área + número, sin el 0 ni el 15).
 * Ej: "011 15-2345-6789" -> "5491123456789"
 */
export function normalizarTelefono(telefono: string) {
  let digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("549")) return digitos;
  if (digitos.startsWith("54")) digitos = digitos.slice(2);
  if (digitos.startsWith("0")) digitos = digitos.slice(1);
  // Quita el "15" de celulares escritos como "11 15 xxxx xxxx" o "351 15 xxx xxxx"
  digitos = digitos.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");
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
