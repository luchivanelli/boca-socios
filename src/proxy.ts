import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, requiereSuperadmin, verificarToken } from "@/lib/auth-token";

/**
 * Protege toda la app: sin sesión válida redirige al login; la sección Sorteo
 * queda reservada al superadmin. (En Next 16 este archivo reemplaza a middleware.ts.)
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const secreto = process.env.AUTH_SECRET ?? "";
  const sesion = await verificarToken(secreto, request.cookies.get(COOKIE_SESION)?.value);

  if (pathname === "/login") {
    return sesion ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  if (!sesion) {
    const destino = new URL("/login", request.url);
    destino.searchParams.set("next", pathname + search);
    const respuesta = NextResponse.redirect(destino);
    if (request.cookies.has(COOKIE_SESION)) respuesta.cookies.delete(COOKIE_SESION);
    return respuesta;
  }

  if (requiereSuperadmin(pathname) && sesion.rol !== "superadmin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Todo salvo archivos estáticos e imágenes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};
