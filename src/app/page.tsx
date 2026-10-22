import Link from "next/link";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { Suspense } from "react";
import { Search, UserPlus } from "lucide-react";
import { DeudaBadge, EstadoBadge, MetodoPagoBadge } from "@/components/Badges";
import { CuotasSocio } from "@/components/CuotasSocio";
import { LeyendaCuotas } from "@/components/LeyendaCuotas";
import { AltasBajas } from "@/components/AltasBajas";
import { ExportarPdf } from "@/components/ExportarPdf";
import { PanelFiltros } from "@/components/PanelFiltros";
import { SelectAuto } from "@/components/SelectAuto";
import { Resumen } from "@/components/Resumen";
import { SelectorAnio } from "@/components/SelectorAnio";
import { Paginacion } from "@/components/Paginacion";
import { ScrollAlListado } from "@/components/ScrollAlListado";
import { ESTADO_LABEL, ESTADOS, EXPLICACION_SIN_CUOTA, MESES, METODO_PAGO_LABEL, METODOS_PAGO } from "@/lib/constants";
import { getListadoSocios } from "@/lib/listado";
import {
  FILTROS_CUOTAS,
  leerAnio,
  leerCuotas,
  leerEntero,
  leerEstado,
  leerMetodoPago,
  leerOrden,
  leerTexto,
  ORDEN_POR_DEFECTO,
  ORDENES,
  type FiltroCuotas,
  type SearchParams,
} from "@/lib/params";
import { getAltasBajasPorMes, getResumenAnios, ultimoMesExigible } from "@/lib/socios";

export const dynamic = "force-dynamic";

const POR_PAGINA = 50;

export default async function SociosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [sp, cabeceras] = await Promise.all([searchParams, headers()]);
  // Se renderiza una sola vista según el dispositivo: mandar tarjetas y tabla a la vez
  // duplicaba el HTML (12 casillas por socio en cada una).
  const vista = userAgent({ headers: cabeceras }).device.type === "mobile" ? "tarjetas" : "tabla";
  const anio = leerAnio(sp);
  const q = leerTexto(sp, "q");
  const estado = leerEstado(sp);
  const metodoPago = leerMetodoPago(sp);
  const orden = leerOrden(sp);
  const cuotas = leerCuotas(sp);

  const paginaPedida = Math.max(1, leerEntero(sp, "pagina", 1));

  const [{ filas, conteos, pagina, paginas }, { anios }, altasBajas] = await Promise.all([
    getListadoSocios({ q, estado, metodoPago, cuotas, orden }, { anio, pagina: paginaPedida, porPagina: POR_PAGINA }),
    getResumenAnios(),
    getAltasBajasPorMes(anio),
  ]);

  const mesExigible = ultimoMesExigible(anio);
  const filtrosActivos = [q, estado, metodoPago, cuotas, orden !== ORDEN_POR_DEFECTO].filter(Boolean).length;
  const hayFiltros = filtrosActivos > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-boca-azul sm:text-2xl">Socios</h1>
          <p className="text-sm text-slate-600">
            Tocá un mes para cambiar su estado: impago, pagado o nulo.
          </p>
          <div className="mt-1.5">
            <LeyendaCuotas />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <SelectorAnio anios={anios} anio={anio} />
          </Suspense>
          <ExportarPdf
            filtros={{ q, estado, metodoPago, orden, anio }}
            conteos={{ todos: conteos.total, "al-dia": conteos.alDia, deudores: conteos.deudores }}
            hayFiltros={Boolean(q || estado || metodoPago)}
          />
          <Link
            href="/socios/nuevo"
            className="hidden items-center gap-1.5 rounded-md bg-boca-azul px-4 py-2 text-sm font-semibold text-boca-amarillo shadow transition hover:bg-boca-azul-claro sm:inline-flex"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Nuevo socio
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Resumen titulo="Listados" valor={conteos.listados} />
        <Resumen titulo="Activos" valor={conteos.activos} />
        <Resumen titulo="Con deuda" valor={conteos.deudores} resaltar={conteos.deudores > 0} />
      </div>

      <AltasBajas anio={anio} datos={altasBajas} />

      {/* En celular el bloque es sticky; el envoltorio con el color de fondo deja un margen
          para que las tarjetas no se peguen al borde al pasar por debajo. */}
      <div className="sticky top-[60px] z-10 -mx-3 bg-[#f3f5fa] px-3 py-2 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0">
      <form className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm sm:gap-2 sm:p-3 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:items-end">
        <input type="hidden" name="anio" value={anio} />
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
              <label htmlFor="estado" className="mb-1 block text-xs font-medium text-slate-600">
                Alta
              </label>
              <SelectAuto id="estado" name="estado" defaultValue={estado ?? ""} className={selectClase}>
                <option value="">Todos</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_LABEL[e]}
                  </option>
                ))}
              </SelectAuto>
            </div>
            <div>
              <label htmlFor="metodo" className="mb-1 block text-xs font-medium text-slate-600">
                Método de pago
              </label>
              <SelectAuto id="metodo" name="metodo" defaultValue={metodoPago ?? ""} className={selectClase}>
                <option value="">Todos</option>
                {METODOS_PAGO.map((m) => (
                  <option key={m} value={m}>
                    {METODO_PAGO_LABEL[m]}
                  </option>
                ))}
              </SelectAuto>
            </div>
            <div>
              <label htmlFor="cuotas" className="mb-1 block text-xs font-medium text-slate-600">
                Cuotas
              </label>
              <SelectAuto id="cuotas" name="cuotas" defaultValue={cuotas ?? ""} className={selectClase}>
                <option value="">Todos</option>
                {(Object.keys(FILTROS_CUOTAS) as FiltroCuotas[]).map((c) => (
                  <option key={c} value={c}>
                    {FILTROS_CUOTAS[c]}
                  </option>
                ))}
              </SelectAuto>
            </div>
            <div>
              <label htmlFor="orden" className="mb-1 block text-xs font-medium text-slate-600">
                Ordenar por
              </label>
              <SelectAuto id="orden" name="orden" defaultValue={orden} className={selectClase}>
                {(Object.keys(ORDENES) as (keyof typeof ORDENES)[]).map((o) => (
                  <option key={o} value={o}>
                    {ORDENES[o]}
                  </option>
                ))}
              </SelectAuto>
            </div>
          </div>
          {hayFiltros && (
            <div className="flex items-center sm:pb-2">
              <Link href={`/?anio=${anio}`} className="text-sm text-slate-500 underline">
                Limpiar filtros
              </Link>
            </div>
          )}
        </PanelFiltros>
      </form>
      </div>

      {filas.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-10 text-center text-slate-500 shadow-sm">
          No hay socios que coincidan.{" "}
          <Link href="/socios/nuevo" className="font-semibold text-boca-azul underline">
            Cargar el primero
          </Link>
        </div>
      )}

      <ScrollAlListado clave={`${pagina}-${q ?? ""}-${estado ?? ""}-${metodoPago ?? ""}-${cuotas ?? ""}-${orden}`} />
      <div id="listado" className="scroll-mt-44 sm:scroll-mt-20" />

      {/* Celular: tarjetas */}
      {filas.length > 0 && vista === "tarjetas" && (
        <ul className="space-y-2">
          {filas.map(({ socio, estados, deuda, debito, inactivo }) => (
            <li
              key={socio.id}
              className={`rounded-lg border bg-white p-2.5 shadow-sm ${
                deuda > 0 ? "border-amber-300" : "border-slate-200"
              } ${inactivo ? "opacity-70" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <Link href={`/socios/${socio.id}?anio=${anio}`} className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded bg-boca-azul px-1.5 py-0.5 font-mono text-xs font-semibold text-boca-amarillo">
                    {socio.nroSocio}
                  </span>
                  <span className="truncate text-sm font-bold text-boca-azul">
                    {socio.apellido}, {socio.nombre}
                  </span>
                </Link>
                <DeudaBadge cantidad={deuda} inactivo={inactivo} debito={debito} metodo={socio.metodoPago} />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {inactivo && <EstadoBadge estado={socio.estado} />}
                <MetodoPagoBadge metodo={socio.metodoPago} />
              </div>
              <div className="mt-2">
                {debito ? (
                  <p className="rounded-md bg-boca-azul/5 px-2 py-1.5 text-xs text-boca-azul">
                    {EXPLICACION_SIN_CUOTA[socio.metodoPago]}
                  </p>
                ) : (
                  <CuotasSocio
                    socioId={socio.id}
                    anio={anio}
                    estados={estados}
                    mesExigible={mesExigible}
                    modo="grilla"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Escritorio: tabla */}
      {filas.length > 0 && vista === "tabla" && (
        <div id="tabla-socios" className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="tabla-socios w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-20 bg-boca-azul text-left text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="sticky left-0 z-30 w-14 min-w-14 bg-boca-azul px-2 py-2">Nº</th>
                <th className="sticky left-14 z-30 bg-boca-azul px-2 py-2 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.35)]">Socio</th>
                <th className="px-2 py-2">DNI</th>
                <th className="px-2 py-2">Localidad</th>
                <th className="px-2 py-2">Dirección</th>
                <th className="px-2 py-2">Alta</th>
                <th className="px-2 py-2">Pago</th>
                {MESES.map((m, i) => (
                  <th
                    key={m}
                    className={`px-0.5 py-2 text-center ${i + 1 > mesExigible ? "text-white/50" : "text-boca-amarillo"}`}
                  >
                    {m}
                  </th>
                ))}
                <th className="px-2 py-2">Deuda</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ socio, estados, deuda, debito, inactivo }) => (
                <tr
                  key={socio.id}
                  className={inactivo ? "text-slate-400" : undefined}
                >
                  <td className="sticky left-0 z-10 w-14 min-w-14 bg-white font-mono text-xs">
                    {socio.nroSocio}
                  </td>
                  <td className="sticky left-14 z-10 bg-white whitespace-nowrap shadow-[4px_0_6px_-4px_rgba(0,0,0,0.15)]">
                    <Link
                      href={`/socios/${socio.id}?anio=${anio}`}
                      className="font-semibold text-boca-azul hover:underline"
                    >
                      {socio.apellido}, {socio.nombre}
                    </Link>
                    {socio.telefono && (
                      <span className="block text-xs text-slate-500">{socio.telefono}</span>
                    )}
                  </td>
                  <td className="font-mono text-xs">{socio.dni}</td>
                  <td className="text-xs">{socio.localidad}</td>
                  <td className="text-xs">{socio.direccion ?? <span className="text-slate-300">—</span>}</td>
                  <td>
                    <EstadoBadge estado={socio.estado} />
                  </td>
                  <td className="whitespace-nowrap">
                    <MetodoPagoBadge metodo={socio.metodoPago} />
                  </td>
                  {debito ? (
                    <td colSpan={12} className="text-center text-xs text-boca-azul/70">
                      {EXPLICACION_SIN_CUOTA[socio.metodoPago]}
                    </td>
                  ) : (
                    <CuotasSocio
                      socioId={socio.id}
                      anio={anio}
                      estados={estados}
                      mesExigible={mesExigible}
                      modo="celdas"
                    />
                  )}
                  <td className="whitespace-nowrap">
                    <DeudaBadge cantidad={deuda} inactivo={inactivo} debito={debito} metodo={socio.metodoPago} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filas.length > 0 && (
        <Paginacion pagina={pagina} paginas={paginas} total={conteos.listados} porPagina={POR_PAGINA} sp={sp} />
      )}
    </div>
  );
}

const selectClase =
  "w-full text-sm sm:text-base rounded-md border border-slate-300 bg-white px-2 py-1.5 focus:border-boca-azul focus:outline-none focus:ring-2 focus:ring-boca-amarillo";
