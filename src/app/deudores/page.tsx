import Link from "next/link";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { Search } from "lucide-react";
import { DeudaBadge, MetodoPagoBadge } from "@/components/Badges";
import { Paginacion } from "@/components/Paginacion";
import { PanelFiltros } from "@/components/PanelFiltros";
import { Resumen } from "@/components/Resumen";
import { ScrollAlListado } from "@/components/ScrollAlListado";
import { SelectAuto } from "@/components/SelectAuto";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { MESES_LARGO, METODO_PAGO_LABEL, METODOS_PAGO, METODOS_SIN_CUOTA } from "@/lib/constants";
import { etiquetaCuota } from "@/lib/cuotas";
import { getDetalleDeuda, getListadoSocios } from "@/lib/listado";
import {
  leerEntero,
  leerMetodoPago,
  leerOrdenDeudores,
  leerTexto,
  ORDEN_DEUDORES_POR_DEFECTO,
  ORDENES_DEUDORES,
  type OrdenDeudores,
  type SearchParams,
} from "@/lib/params";
import { mensajeDeuda } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const POR_PAGINA = 50;
const MINIMOS = [1, 2, 3, 4, 6];

export default async function DeudoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [sp, cabeceras] = await Promise.all([searchParams, headers()]);
  const vista = userAgent({ headers: cabeceras }).device.type === "mobile" ? "tarjetas" : "tabla";
  const q = leerTexto(sp, "q");
  const metodoPago = leerMetodoPago(sp);
  const minimo = Math.max(1, leerEntero(sp, "min", 1));
  const orden = leerOrdenDeudores(sp);
  const paginaPedida = Math.max(1, leerEntero(sp, "pagina", 1));

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mesActual = MESES_LARGO[hoy.getMonth()];

  // Solo los deudores salen de la base, de a 50; el detalle de meses se pide para esa página.
  const { filas, conteos, pagina, paginas } = await getListadoSocios(
    { q, estado: "ACTIVO", metodoPago, cuotas: "deudores", minDeuda: minimo, orden },
    { anio, pagina: paginaPedida, porPagina: POR_PAGINA, hoy },
  );
  const detalle = await getDetalleDeuda(filas.map((f) => f.socio.id), hoy);
  const deudores = filas.map((f) => ({ socio: f.socio, deuda: detalle.get(f.socio.id) ?? [] }));

  const filtrosActivos = [q, metodoPago, minimo > 1, orden !== ORDEN_DEUDORES_POR_DEFECTO].filter(Boolean).length;
  const hayFiltros = filtrosActivos > 0;
  const metodosConCuota = METODOS_PAGO.filter((m) => !METODOS_SIN_CUOTA.includes(m));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-boca-azul sm:text-2xl">Deudores</h1>
        <p className="text-sm text-slate-600">
          Cuotas sin pagar hasta {mesActual.toLowerCase()} de {anio}, incluidas las de años
          anteriores. Los socios con débito automático o bebés no aparecen.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Resumen titulo="Deudores" valor={conteos.listados} resaltar={conteos.listados > 0} />
        <Resumen titulo="Sin teléfono" valor={conteos.sinTelefono} />
      </div>

      <div className="sticky top-[62px] z-10 -mx-3 bg-[#f3f5fa] px-3 pb-2 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0">
        <form className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm sm:gap-2 sm:p-3 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
          <div>
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Buscar
            </label>
            <div className="flex gap-1.5">
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Nombre, DNI, nº de socio o localidad"
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-boca-azul focus:outline-none focus:ring-2 focus:ring-boca-amarillo"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-boca-azul px-2.5 text-sm font-semibold text-boca-azul transition hover:bg-boca-azul hover:text-boca-amarillo sm:px-4"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>
          </div>
          <PanelFiltros activos={filtrosActivos}>
            <div className="grid grid-cols-2 gap-2 sm:contents">
              <div>
                <label htmlFor="metodo" className="mb-1 block text-xs font-medium text-slate-600">
                  Método de pago
                </label>
                <SelectAuto id="metodo" name="metodo" defaultValue={metodoPago ?? ""} className={selectClase}>
                  <option value="">Todos</option>
                  {metodosConCuota.map((m) => (
                    <option key={m} value={m}>
                      {METODO_PAGO_LABEL[m]}
                    </option>
                  ))}
                </SelectAuto>
              </div>
              <div>
                <label htmlFor="min" className="mb-1 block text-xs font-medium text-slate-600">
                  Debe al menos
                </label>
                <SelectAuto id="min" name="min" defaultValue={minimo} className={selectClase}>
                  {MINIMOS.map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "cuota" : "cuotas"}
                    </option>
                  ))}
                </SelectAuto>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="orden" className="mb-1 block text-xs font-medium text-slate-600">
                  Ordenar por
                </label>
                <SelectAuto id="orden" name="orden" defaultValue={orden} className={selectClase}>
                  {(Object.keys(ORDENES_DEUDORES) as OrdenDeudores[]).map((o) => (
                    <option key={o} value={o}>
                      {ORDENES_DEUDORES[o]}
                    </option>
                  ))}
                </SelectAuto>
              </div>
            </div>
            {hayFiltros && (
              <div className="flex items-center sm:pb-2">
                <Link href="/deudores" className="text-sm text-slate-500 underline">
                  Limpiar filtros
                </Link>
              </div>
            )}
          </PanelFiltros>
        </form>
      </div>

      <ScrollAlListado clave={`${pagina}-${q ?? ""}-${metodoPago ?? ""}-${minimo}-${orden}`} />
      <div id="listado" className="scroll-mt-44 sm:scroll-mt-20" />

      {deudores.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-10 text-center text-slate-500 shadow-sm">
          {hayFiltros
            ? "No hay deudores que coincidan con la búsqueda o los filtros."
            : "No hay socios activos con cuotas pendientes. 💙💛"}
        </div>
      )}

      {/* Celular: tarjetas */}
      {deudores.length > 0 && vista === "tarjetas" && (
        <ul className="space-y-2">
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
      {deudores.length > 0 && vista === "tabla" && (
        <div id="tabla-socios" className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="tabla-socios w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-20 bg-boca-azul text-left text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="px-2 py-2">Nº</th>
                <th className="px-2 py-2">Socio</th>
                <th className="px-2 py-2">Teléfono</th>
                <th className="px-2 py-2">Pago</th>
                <th className="px-2 py-2">Deuda</th>
                <th className="px-2 py-2">Meses adeudados</th>
                <th className="px-2 py-2 text-right">Aviso</th>
              </tr>
            </thead>
            <tbody>
              {deudores.map(({ socio, deuda }) => (
                <tr key={socio.id}>
                  <td className="font-mono text-xs">{socio.nroSocio}</td>
                  <td className="whitespace-nowrap">
                    <Link
                      href={`/socios/${socio.id}`}
                      className="font-semibold text-boca-azul hover:underline"
                    >
                      {socio.apellido}, {socio.nombre}
                    </Link>
                    <span className="block text-xs text-slate-500">{socio.localidad}</span>
                  </td>
                  <td className="font-mono text-xs">
                    {socio.telefono ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="whitespace-nowrap">
                    <MetodoPagoBadge metodo={socio.metodoPago} />
                  </td>
                  <td className="whitespace-nowrap">
                    <DeudaBadge cantidad={deuda.length} />
                  </td>
                  <td>
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
                  <td className="text-right">
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

      {deudores.length > 0 && (
        <Paginacion
          pagina={pagina}
          paginas={paginas}
          total={conteos.listados}
          porPagina={POR_PAGINA}
          sp={sp}
          base="/deudores"
        />
      )}
    </div>
  );
}

const selectClase =
  "w-full text-sm sm:text-base rounded-md border border-slate-300 bg-white px-2 py-1.5 focus:border-boca-azul focus:outline-none focus:ring-2 focus:ring-boca-amarillo";
