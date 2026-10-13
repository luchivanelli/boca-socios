import Link from "next/link";
import { Suspense } from "react";
import { Search, UserPlus } from "lucide-react";
import { DeudaBadge, EstadoBadge, MetodoPagoBadge } from "@/components/Badges";
import { GrillaMeses } from "@/components/GrillaMeses";
import { PagoToggle } from "@/components/PagoToggle";
import { LeyendaCuotas } from "@/components/LeyendaCuotas";
import { ExportarPdf } from "@/components/ExportarPdf";
import { PanelFiltros } from "@/components/PanelFiltros";
import { SelectAuto } from "@/components/SelectAuto";
import { Resumen } from "@/components/Resumen";
import { SelectorAnio } from "@/components/SelectorAnio";
import { ESTADO_LABEL, ESTADOS, MESES, METODO_PAGO_LABEL, METODOS_PAGO } from "@/lib/constants";
import { etiquetaCuota, formatearMes } from "@/lib/cuotas";
import type { SocioExportable } from "@/lib/exportar";
import {
  leerAnio,
  leerEstado,
  leerMetodoPago,
  leerOrden,
  leerTexto,
  ORDEN_POR_DEFECTO,
  ORDENES,
  type Orden,
  type SearchParams,
} from "@/lib/params";
import {
  calcularDeuda,
  esDebitoAutomatico,
  estadosDelAnio,
  getAnioInicio,
  getAniosDisponibles,
  getSocios,
  ultimoMesExigible,
} from "@/lib/socios";

export const dynamic = "force-dynamic";

export default async function SociosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const anio = leerAnio(sp);
  const q = leerTexto(sp, "q");
  const estado = leerEstado(sp);
  const metodoPago = leerMetodoPago(sp);
  const orden = leerOrden(sp);

  const [socios, anios, anioInicio] = await Promise.all([
    getSocios({ q, estado, metodoPago, orden }),
    getAniosDisponibles(),
    getAnioInicio(),
  ]);

  const mesExigible = ultimoMesExigible(anio);
  const filas = socios.map((socio) => ({
    socio,
    estados: estadosDelAnio(socio.pagos, anio),
    deuda: calcularDeuda(socio, anioInicio),
    debito: esDebitoAutomatico(socio),
    inactivo: socio.estado === "INACTIVO",
  }));
  const anioActual = new Date().getFullYear();
  const exportables: SocioExportable[] = filas.map(({ socio, deuda, debito, inactivo }) => ({
    nroSocio: socio.nroSocio,
    nombre: socio.nombre,
    apellido: socio.apellido,
    dni: socio.dni,
    localidad: socio.localidad,
    direccion: socio.direccion ?? "",
    telefono: socio.telefono ?? "",
    estado: ESTADO_LABEL[socio.estado],
    carnet: socio.carnet ? "Sí" : "No",
    metodoPago: METODO_PAGO_LABEL[socio.metodoPago],
    fechaAlta: socio.fechaAlta ? formatearMes(socio.fechaAlta) : "",
    observaciones: socio.observaciones ?? "",
    deudaCantidad: deuda.length,
    deudaDetalle: deuda.map((c) => etiquetaCuota(c, anioActual)).join(", "),
    inactivo,
    debito,
  }));
  const activos = filas.filter((f) => !f.inactivo).length;
  const deudores = filas.filter((f) => f.deuda.length > 0).length;
  const filtrosActivos = [q, estado, metodoPago, orden !== ORDEN_POR_DEFECTO].filter(Boolean).length;
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
          <ExportarPdf filas={exportables} hayFiltros={hayFiltros} />
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
        <Resumen titulo="Listados" valor={socios.length} />
        <Resumen titulo="Activos" valor={activos} />
        <Resumen titulo="Con deuda" valor={deudores} resaltar={deudores > 0} />
      </div>

      {/* En celular el bloque es sticky; el envoltorio con el color de fondo deja un margen
          para que las tarjetas no se peguen al borde al pasar por debajo. */}
      <div className="sticky top-[70px] z-10 -mx-3 bg-[#f3f5fa] px-3 pb-4 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0">
      <form className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm sm:gap-2 sm:p-3 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
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
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="orden" className="mb-1 block text-xs font-medium text-slate-600">
                Ordenar por
              </label>
              <SelectAuto id="orden" name="orden" defaultValue={orden} className={selectClase}>
                {(Object.keys(ORDENES) as Orden[]).map((o) => (
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

      {/* Celular: tarjetas */}
      {filas.length > 0 && (
        <ul className="space-y-2 md:hidden">
          {filas.map(({ socio, estados, deuda, debito, inactivo }) => (
            <li
              key={socio.id}
              className={`rounded-lg border bg-white p-2.5 shadow-sm ${
                deuda.length > 0 ? "border-amber-300" : "border-slate-200"
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
                <DeudaBadge cantidad={deuda.length} inactivo={inactivo} debito={debito} />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {inactivo && <EstadoBadge estado={socio.estado} />}
                <MetodoPagoBadge metodo={socio.metodoPago} />
              </div>
              <div className="mt-2">
                {debito ? (
                  <p className="rounded-md bg-boca-azul/5 px-2 py-1.5 text-xs text-boca-azul">
                    Débito automático: la cuota se descuenta todos los meses, no se marcan pagos.
                  </p>
                ) : (
                  <GrillaMeses
                    socioId={socio.id}
                    anio={anio}
                    estados={estados}
                    mesExigible={mesExigible}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Escritorio: tabla */}
      {filas.length > 0 && (
        <div className="hidden max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-20 bg-boca-azul text-left text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="sticky left-0 z-30 w-14 min-w-14 bg-boca-azul px-2 py-2">Nº</th>
                <th className="sticky left-14 z-30 bg-boca-azul px-2 py-2 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.35)]">Socio</th>
                <th className="px-2 py-2">DNI</th>
                <th className="px-2 py-2">Localidad</th>
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
            <tbody className="[&>tr>td]:border-b [&>tr>td]:border-slate-100">
              {filas.map(({ socio, estados, deuda, debito, inactivo }) => (
                <tr
                  key={socio.id}
                  className={`group ${inactivo ? "text-slate-400" : ""}`}
                >
                  <td className="sticky left-0 z-10 w-14 min-w-14 bg-white px-2 py-1.5 font-mono text-xs group-hover:bg-[#fffbe3]">
                    {socio.nroSocio}
                  </td>
                  <td className="sticky left-14 z-10 bg-white px-2 py-1.5 whitespace-nowrap shadow-[4px_0_6px_-4px_rgba(0,0,0,0.15)] group-hover:bg-[#fffbe3]">
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
                  <td className="group-hover:bg-[#fffbe3] px-2 py-1.5 font-mono text-xs">{socio.dni}</td>
                  <td className="group-hover:bg-[#fffbe3] px-2 py-1.5 text-xs">{socio.localidad}</td>
                  <td className="group-hover:bg-[#fffbe3] px-2 py-1.5">
                    <EstadoBadge estado={socio.estado} />
                  </td>
                  <td className="group-hover:bg-[#fffbe3] px-2 py-1.5 whitespace-nowrap">
                    <MetodoPagoBadge metodo={socio.metodoPago} />
                  </td>
                  {debito ? (
                    <td colSpan={12} className="group-hover:bg-[#fffbe3] px-2 py-1.5 text-center text-xs text-boca-azul/70">
                      Se descuenta todos los meses por débito automático
                    </td>
                  ) : (
                    MESES.map((_, i) => (
                      <td key={i} className="group-hover:bg-[#fffbe3] px-0.5 py-1.5 text-center">
                        <PagoToggle
                          socioId={socio.id}
                          anio={anio}
                          mes={i + 1}
                          estado={estados.get(i + 1) ?? null}
                          futuro={i + 1 > mesExigible}
                        />
                      </td>
                    ))
                  )}
                  <td className="group-hover:bg-[#fffbe3] px-2 py-1.5 whitespace-nowrap">
                    <DeudaBadge cantidad={deuda.length} inactivo={inactivo} debito={debito} />
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

const selectClase =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 focus:border-boca-azul focus:outline-none focus:ring-2 focus:ring-boca-amarillo";
