import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { NavEscritorio, NavMovil } from "@/components/NavLinks";
import { LogoutButton } from "@/components/LogoutButton";
import { IconosSprite } from "@/components/IconosSprite";
import { getSesion } from "@/lib/auth";
import Image from "next/image";
import { NOMBRE_PENA } from "@/lib/constants";
import logo from "../../public/favicon-peña.png";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${NOMBRE_PENA} · Socios`,
  description: "Administración de socios y cuotas de la peña",
};

export const viewport: Viewport = {
  themeColor: "#0b2d6b",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getSesion();
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <IconosSprite />
        {!sesion ? (
          <main className="mx-auto w-full max-w-[96rem] flex-1 px-3 py-6 sm:px-4">{children}</main>
        ) : (
          <>
        <header className="sticky top-0 z-40 bg-boca-azul text-white shadow-md">
          <div className="mx-auto flex max-w-[96rem] items-center justify-between gap-3 px-4 py-2.5">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src={logo}
                alt={`Escudo de ${NOMBRE_PENA}`}
                width={36}
                height={36}
                priority
                className="h-9 sm:w-11 w-9 sm:h-11 rounded-full"
              />
              <span className="leading-tight">
                <span className="block text-sm font-bold sm:text-lg">{NOMBRE_PENA}</span>
                <span className="block text-xs text-boca-amarillo sm:text-base">Gestión de socios</span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <NavEscritorio rol={sesion.rol} />
              <LogoutButton />
            </div>
          </div>
          <div className="franja-boca" />
        </header>

        <main className="mx-auto w-full max-w-[96rem] flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 sm:pb-6">
          {children}
        </main>

        <footer className="hidden border-t border-slate-200 py-4 text-center text-xs text-slate-500 sm:block">
          {NOMBRE_PENA} · 💙💛
        </footer>

        <NavMovil rol={sesion.rol} />
          </>
        )}
      </body>
    </html>
  );
}
