import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, verificarToken, type Rol, type Sesion } from "./auth-token";

export function secretoSesion() {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 16) {
    throw new Error("Falta AUTH_SECRET en .env (mínimo 16 caracteres).");
  }
  return secreto;
}

type Usuario = { usuario: string; clave: string; rol: Rol };

/** Usuarios fijos definidos en .env. */
export function usuariosConfigurados(): Usuario[] {
  const lista: Usuario[] = [];
  if (process.env.ADMIN_USUARIO && process.env.ADMIN_CLAVE) {
    lista.push({ usuario: process.env.ADMIN_USUARIO, clave: process.env.ADMIN_CLAVE, rol: "admin" });
  }
  if (process.env.SUPERADMIN_USUARIO && process.env.SUPERADMIN_CLAVE) {
    lista.push({
      usuario: process.env.SUPERADMIN_USUARIO,
      clave: process.env.SUPERADMIN_CLAVE,
      rol: "superadmin",
    });
  }
  return lista;
}

/** Sesión actual leída de la cookie, o null si no hay o venció. */
export async function getSesion(): Promise<Sesion | null> {
  const jar = await cookies();
  return verificarToken(secretoSesion(), jar.get(COOKIE_SESION)?.value);
}

/** Redirige al login si no hay sesión, o al inicio si el rol no alcanza. */
export async function requerirSesion(rolMinimo?: Rol) {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");
  if (rolMinimo === "superadmin" && sesion.rol !== "superadmin") redirect("/");
  return sesion;
}

export const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  superadmin: "Super administrador",
};
