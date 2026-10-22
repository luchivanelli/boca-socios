import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SearchParams } from "@/lib/params";

type Props = {
  pagina: number;
  paginas: number;
  total: number;
  porPagina: number;
  /** Parámetros actuales de la URL: se conservan al cambiar de página. */
  sp: SearchParams;
};

function href(sp: SearchParams, pagina: number) {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(sp)) {
    if (clave === "pagina") continue;
    const v = Array.isArray(valor) ? valor[0] : valor;
    if (v) params.set(clave, v);
  }
  if (pagina > 1) params.set("pagina", String(pagina));
  const texto = params.toString();
  return texto ? `/?${texto}` : "/";
}

export function Paginacion({ pagina, paginas, total, porPagina, sp }: Props) {
  if (total === 0) return null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);

  // Números a mostrar: primera, última y las vecinas de la actual.
  const numeros = new Set<number>([1, paginas, pagina - 1, pagina, pagina + 1]);
  const visibles = [...numeros].filter((n) => n >= 1 && n <= paginas).sort((a, b) => a - b);

  const botonClase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-semibold transition";

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex-row"
    >
      <p className="text-xs text-slate-600">
        Mostrando <strong>{desde}</strong> a <strong>{hasta}</strong> de <strong>{total}</strong>{" "}
        {total === 1 ? "socio" : "socios"}
      </p>
      {paginas > 1 && (
        <div className="flex items-center gap-1">
          {pagina > 1 ? (
            <Link href={href(sp, pagina - 1)} scroll={false} aria-label="Página anterior" className={`${botonClase} border-slate-300 text-boca-azul hover:bg-boca-amarillo-suave`}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span className={`${botonClase} border-slate-200 text-slate-300`}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </span>
          )}
          {visibles.map((n, i) => (
            <span key={n} className="flex items-center gap-1">
              {i > 0 && visibles[i - 1] < n - 1 && <span className="px-1 text-slate-400">…</span>}
              {n === pagina ? (
                <span aria-current="page" className={`${botonClase} border-boca-azul bg-boca-azul text-boca-amarillo`}>
                  {n}
                </span>
              ) : (
                <Link href={href(sp, n)} scroll={false} className={`${botonClase} border-slate-300 text-boca-azul hover:bg-boca-amarillo-suave`}>
                  {n}
                </Link>
              )}
            </span>
          ))}
          {pagina < paginas ? (
            <Link href={href(sp, pagina + 1)} scroll={false} aria-label="Página siguiente" className={`${botonClase} border-slate-300 text-boca-azul hover:bg-boca-amarillo-suave`}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span className={`${botonClase} border-slate-200 text-slate-300`}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
