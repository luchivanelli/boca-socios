"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, crearToken, DURACION_SESION_MS, igualesSeguro } from "@/lib/auth-token";
import { secretoSesion, usuariosConfigurados } from "@/lib/auth";

export type LoginState = { error?: string } | null;

function destinoSeguro(valor: FormDataEntryValue | null) {
  const destino = typeof valor === "string" ? valor : "";
  // Solo rutas internas: evita redirecciones a otros sitios.
  return destino.startsWith("/") && !destino.startsWith("//") ? destino : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const usuario = String(formData.get("usuario") ?? "").trim();
  const clave = String(formData.get("clave") ?? "");

  const encontrado = usuariosConfigurados().find(
    (u) => igualesSeguro(u.usuario, usuario) && igualesSeguro(u.clave, clave),
  );
  if (!encontrado) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const jar = await cookies();
  jar.set(COOKIE_SESION, await crearToken(secretoSesion(), encontrado.rol), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_MS / 1000,
  });

  redirect(destinoSeguro(formData.get("next")));
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE_SESION);
  redirect("/login");
}
