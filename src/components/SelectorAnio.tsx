"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SelectorAnio({ anios, anio }: { anios: number[]; anio: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function cambiar(nuevo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("anio", nuevo);
    router.push(`${pathname}?${params.toString()}`);
  }

  const opciones = anios.includes(anio) ? anios : [anio, ...anios].sort((a, b) => b - a);

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      Año
      <select
        value={anio}
        onChange={(e) => cambiar(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-boca-azul shadow-sm focus:border-boca-azul focus:outline-none focus:ring-2 focus:ring-boca-amarillo"
      >
        {opciones.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </label>
  );
}
