/**
 * Token de sesión firmado con HMAC-SHA256 (Web Crypto, así sirve tanto en el proxy
 * de borde como en Node). Formato: "<rol>.<vencimiento>.<firma>".
 * No guarda nada en la base: los usuarios viven en variables de entorno.
 */

export const ROLES = ["admin", "superadmin"] as const;
export type Rol = (typeof ROLES)[number];

export type Sesion = { rol: Rol; vence: number };

export const COOKIE_SESION = "sesion";
export const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function clave(secreto: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function firmar(secreto: string, datos: string) {
  const k = await clave(secreto);
  return hex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(datos)));
}

/** Comparación en tiempo constante para no filtrar información por tiempos de respuesta. */
export function igualesSeguro(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function crearToken(secreto: string, rol: Rol, ahora = Date.now()) {
  const vence = ahora + DURACION_SESION_MS;
  const cuerpo = `${rol}.${vence}`;
  return `${cuerpo}.${await firmar(secreto, cuerpo)}`;
}

export async function verificarToken(
  secreto: string,
  token: string | undefined,
  ahora = Date.now(),
): Promise<Sesion | null> {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [rol, venceTexto, firma] = partes;
  const vence = Number(venceTexto);
  if (!ROLES.includes(rol as Rol) || !Number.isFinite(vence) || vence < ahora) return null;
  const esperada = await firmar(secreto, `${rol}.${vence}`);
  if (!igualesSeguro(firma, esperada)) return null;
  return { rol: rol as Rol, vence };
}

/** Rutas que solo puede ver el superadmin. */
export function requiereSuperadmin(pathname: string) {
  return pathname === "/sorteo" || pathname.startsWith("/sorteo/");
}
