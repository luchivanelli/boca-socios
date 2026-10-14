"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Gift, UserPlus, Users, type LucideIcon } from "lucide-react";
import type { Rol } from "@/lib/auth-token";

type Enlace = { href: string; label: string; Icono: LucideIcon; soloSuperadmin?: boolean };

const links: Enlace[] = [
  { href: "/", label: "Socios", Icono: Users },
  { href: "/deudores", label: "Deudores", Icono: AlertTriangle },
  { href: "/sorteo", label: "Sorteo", Icono: Gift, soloSuperadmin: true },
  { href: "/socios/nuevo", label: "Nuevo", Icono: UserPlus },
];

function enlacesPara(rol: Rol) {
  return links.filter((l) => !l.soloSuperadmin || rol === "superadmin");
}

function activo(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || (pathname.startsWith("/socios/") && pathname !== "/socios/nuevo");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegación de escritorio (en el encabezado). */
export function NavEscritorio({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
      {enlacesPara(rol).map(({ href, label, Icono }) => (
        <Link
          key={href}
          href={href}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 transition hover:bg-boca-azul-claro hover:text-boca-amarillo ${
            activo(pathname, href) ? "bg-boca-azul-claro text-boca-amarillo" : "text-white"
          }`}
        >
          <Icono className="h-4 w-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior fija para celular. */
export function NavMovil({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const enlaces = enlacesPara(rol);
  return (
    <nav
      style={{ gridTemplateColumns: `repeat(${enlaces.length}, minmax(0, 1fr))` }}
      className="fixed inset-x-0 bottom-0 z-30 grid border-t-4 border-boca-amarillo bg-boca-azul pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      {enlaces.map(({ href, label, Icono }) => {
        const esActivo = activo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-2 text-xs font-semibold ${
              esActivo ? "bg-boca-azul-claro text-boca-amarillo" : "text-white/80"
            }`}
          >
            <Icono className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
