/**
 * Se ejecuta una vez al arrancar el servidor. Abre la conexión a la base de antemano
 * para que el primer pedido no pague el costo de conectar (≈1 s contra Neon).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { prisma } = await import("@/lib/prisma");
  try {
    await prisma.$connect();
  } catch (e) {
    console.error("No se pudo precalentar la conexión a la base:", e);
  }
}
