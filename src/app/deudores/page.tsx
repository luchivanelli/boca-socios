import Link from "next/link";
import { DeudaBadge, MetodoPagoBadge } from "@/components/Badges";
import { Resumen } from "@/components/Resumen";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { MESES_LARGO } from "@/lib/constants";
import { etiquetaCuota } from "@/lib/cuotas";
import { leerEntero, type SearchParams } from "@/lib/params";
import { calcularDeuda, getAnioInicio, getSocios } from "@/lib/socios";
import { mensajeDeuda } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function DeudoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const minimo = Math.max(1, leerEntero(sp, "min", 1));
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mesActual = MESES_LARGO[hoy.getMonth()];

  const [socios, anioInicio] = await Promise.all([
    getSocios({ estado: "ACTIVO" }),
    getAnioInicio(),
  ]);

  const deudores = socios
    .map((socio) => ({ socio, deuda: calcularDeuda(socio, anioInicio, hoy) }))
    .filter((f) => f.deuda.length >= minimo)
    .sort((a, b) => b.deuda.length - a.deuda.length || a.socio.apellido.localeCompare(b.socio.apellido));

  const sinTelefono = deudores.filter((d) => !d.socio.telefono).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-boca-azul sm:text-2xl">Deudores</h1>
          <p className="text-sm text-slate-600">
            Cuotas sin pagar hasta {mesActual.toLowerCase()} de {anio}, incluidas las de años
            anteriores. Los socios con débito automático no aparecen.
          </p>
        </div>
        <form className="flex w-full items-center gap-2 text-sm font-medium text-slate-700 sm:w-auto">
          <label htmlFor="min" className="whitespace-nowrap">
            Debe al menos
          </label>
          <select
            id="min"
            name="min"
            defaultValue={minimo}
            className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-2 text-base shadow-sm focus:border-boca-azul focus:outline-none focus:ring-2 focus:ring-boca-amarillo sm:py-1.5 sm:text-sm"
          >
            {[1, 2, 3, 4, 6].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "cuota" : "cuotas"}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-boca-azul px-3 py-2 text-sm font-semibold text-boca-azul transition hover:bg-boca-azul hover:text-boca-amarillo sm:py-1.5"
          >
            Aplicar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Resumen titulo="Deudores" valor={deudores.length} resaltar={deudores.length > 0} />
        <Resumen titulo="Sin teléfono" valor={sinTelefono} />
      </div>

      {deudores.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-10 text-center text-slate-500 shadow-sm">
          No hay socios activos con {minimo > 1 ? `${minimo} o más cuotas` : "cuotas"} pendientes. 💙💛
        </div>
      )}

      {/* Celular: tarjetas */}
      {deudores.length > 0 && (
        <ul className="space-y-3 md:hidden">
          {deudores.map(({ socio, deuda }) => (
            <li key={socio.id} className="rounded-lg border border-amber-300 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/socios/${socio.id}`} className="min-w-0">
                  <span className="block truncate text-base font-bold text-boca-azul">
                    {socio.apellido}, {socio.nombre}
                  </span>
                  <span className="block text-xs text-slate-500">
                    Socio Nº {socio.nroSocio} · {socio.localidad}
                  </span>
                </Link>
                <DeudaBadge cantidad={deuda.length} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <MetodoPagoBadge metodo={socio.metodoPago} />
                {deuda.map((c) => (
                  <span
                    key={`${c.anio}-${c.mes}`}
                    className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700"
                  >
                    {etiquetaCuota(c, anio)}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-500">
                  {socio.telefono ?? "Sin teléfono cargado"}
                </span>
                <WhatsAppButton
                  telefono={socio.telefono}
                  mensaje={mensajeDeuda(socio, deuda)}
                  texto="Avisar"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Escritorio: tabla */}
      {deudores.length > 0 && (
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-boca-azul text-left text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="px-3 py-2">Nº</th>
                <th className="px-3 py-2">Socio</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Pago</th>
                <th className="px-3 py-2">Deuda</th>
                <th className="px-3 py-2">Meses adeudados</th>
                <th className="px-3 py-2 text-right">Aviso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deudores.map(({ socio, deuda }) => (
                <tr key={socio.id} className="hover:bg-boca-amarillo-suave/40">
                  <td className="px-3 py-2 font-mono text-xs">{socio.nroSocio}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link
                      href={`/socios/${socio.id}`}
                      className="font-semibold text-boca-azul hover:underline"
                    >
                      {socio.apellido}, {socio.nombre}
                    </Link>
                    <span className="block text-xs text-slate-500">{socio.localidad}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {socio.telefono ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <MetodoPagoBadge metodo={socio.metodoPago} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <DeudaBadge cantidad={deuda.length} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {deuda.map((c) => (
                        <span
                          key={`${c.anio}-${c.mes}`}
                          className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700"
                        >
                          {etiquetaCuota(c, anio)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <WhatsAppButton
                      telefono={socio.telefono}
                      mensaje={mensajeDeuda(socio, deuda)}
                      texto="Avisar"
                      compacto
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
