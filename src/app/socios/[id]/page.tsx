import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { actualizarSocio } from "@/actions/socios";
import { DeudaBadge, EstadoBadge } from "@/components/Badges";
import { LeyendaCuotas } from "@/components/LeyendaCuotas";
import { EliminarSocioButton } from "@/components/EliminarSocioButton";
import { PagoToggle } from "@/components/PagoToggle";
import { SelectorAnio } from "@/components/SelectorAnio";
import { SocioForm } from "@/components/SocioForm";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { MESES_LARGO } from "@/lib/constants";
import { describirCuotas, formatearMes } from "@/lib/cuotas";
import { leerAnio, type SearchParams } from "@/lib/params";
import {
  calcularDeuda,
  esDebitoAutomatico,
  estadosDelAnio,
  getAnioInicio,
  getAniosDisponibles,
  getSocio,
  ultimoMesExigible,
} from "@/lib/socios";
import { mensajeDeuda } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function SocioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id: idTexto }, sp] = await Promise.all([params, searchParams]);
  const id = Number(idTexto);
  if (!Number.isInteger(id)) notFound();

  const anio = leerAnio(sp);
  const [socio, anios, anioInicio] = await Promise.all([
    getSocio(id),
    getAniosDisponibles(),
    getAnioInicio(),
  ]);
  if (!socio) notFound();

  const hoy = new Date();
  const estados = estadosDelAnio(socio.pagos, anio);
  const mesExigible = ultimoMesExigible(anio, hoy);
  const deuda = calcularDeuda(socio, anioInicio, hoy);
  const debito = esDebitoAutomatico(socio);
  const inactivo = socio.estado === "INACTIVO";
  const actualizar = actualizarSocio.bind(null, socio.id);

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/?anio=${anio}`}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al listado
          </Link>
          <h1 className="mt-1 text-xl font-bold text-boca-azul sm:text-2xl">
            {socio.apellido}, {socio.nombre}
          </h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="font-mono">Socio Nº {socio.nroSocio}</span>
            <span className="font-mono">DNI {socio.dni}</span>
            <span className="font-mono">
              Alta {socio.fechaAlta ? formatearMes(socio.fechaAlta) : "sin definir"}
            </span>
            <EstadoBadge estado={socio.estado} />
            <DeudaBadge cantidad={deuda.length} inactivo={inactivo} debito={debito} />
          </p>
        </div>
        {deuda.length > 0 && (
          <div className="w-full sm:w-auto">
            <WhatsAppButton
              telefono={socio.telefono}
              mensaje={mensajeDeuda(socio, deuda)}
            />
          </div>
        )}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {debito ? (
          <>
            <h2 className="text-lg font-bold text-boca-azul">Cuotas</h2>
            <p className="mt-2 rounded-md bg-boca-azul/5 px-3 py-2 text-sm text-boca-azul">
              Este socio paga por <strong>débito automático</strong>: la cuota se le descuenta
              todos los meses, así que no hace falta marcar pagos ni figura como deudor. Si cambia
              el método de pago, acá va a aparecer la grilla de meses.
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-boca-azul">Cuotas {anio}</h2>
                <p className="text-sm text-slate-600">
                  {inactivo
                    ? "Socio inactivo: no se le cuentan cuotas adeudadas."
                    : deuda.length === 0
                      ? "Al día con las cuotas hasta el mes actual."
                      : `Adeuda ${deuda.length === 1 ? "1 cuota" : `${deuda.length} cuotas`}: ${describirCuotas(deuda)}.`}
                </p>
              </div>
              <Suspense>
                <SelectorAnio anios={anios} anio={anio} />
              </Suspense>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {MESES_LARGO.map((_, i) => (
                <PagoToggle
                  key={i}
                  socioId={socio.id}
                  anio={anio}
                  mes={i + 1}
                  estado={estados.get(i + 1) ?? null}
                  futuro={i + 1 > mesExigible}
                  grande
                />
              ))}
            </div>
            <div className="mt-3">
              <LeyendaCuotas />
            </div>
          </>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-lg font-bold text-boca-azul">Datos del socio</h2>
        <SocioForm action={actualizar} socio={socio} textoBoton="Guardar cambios" />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Eliminar al socio borra también su historial de pagos. Si solo dejó de participar,
          marcalo como <strong>Inactivo</strong>.
        </p>
        <EliminarSocioButton id={socio.id} nombre={`${socio.nombre} ${socio.apellido}`} />
      </section>
    </div>
  );
}
