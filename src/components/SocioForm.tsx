"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import type { Socio } from "@prisma/client";
import type { FormState } from "@/actions/socios";
import { METODO_PAGO_LABEL, METODOS_PAGO } from "@/lib/constants";
import { mesISO } from "@/lib/cuotas";
import { CampoEstado } from "./CampoEstado";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  socio?: Socio;
  textoBoton: string;
};

export function SocioForm({ action, socio, textoBoton }: Props) {
  const [state, formAction, pendiente] = useActionState(action, null);
  const errores = state?.fieldErrors ?? {};

  return (
    <form
      // Al cambiar updatedAt el form se vuelve a montar con los valores recién guardados;
      // si no, los campos no controlados quedarían con el valor anterior a la edición.
      key={socio?.updatedAt.getTime() ?? "nuevo"}
      action={formAction}
      className="space-y-5"
    >
      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Cambios guardados.
          {state.anuladas
            ? ` Se anularon ${state.anuladas} ${state.anuladas === 1 ? "cuota anterior" : "cuotas anteriores"} al alta.`
            : ""}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre" name="nombre" error={errores.nombre}>
          <input
            name="nombre"
            defaultValue={socio?.nombre}
            required
            autoComplete="off"
            className={inputClase}
          />
        </Campo>
        <Campo label="Apellido" name="apellido" error={errores.apellido}>
          <input
            name="apellido"
            defaultValue={socio?.apellido}
            required
            autoComplete="off"
            className={inputClase}
          />
        </Campo>
        <Campo label="Nº de socio" name="nroSocio" error={errores.nroSocio}>
          <input
            name="nroSocio"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={socio?.nroSocio}
            required
            className={inputClase}
          />
        </Campo>
        <Campo label="DNI" name="dni" error={errores.dni}>
          <input
            name="dni"
            inputMode="numeric"
            defaultValue={socio?.dni}
            required
            placeholder="Solo números"
            className={inputClase}
          />
        </Campo>
        <Campo label="Localidad" name="localidad" error={errores.localidad}>
          <input name="localidad" defaultValue={socio?.localidad} required className={inputClase} />
        </Campo>
        <Campo label="Dirección (opcional)" name="direccion" error={errores.direccion}>
          <input name="direccion" defaultValue={socio?.direccion ?? ""} className={inputClase} />
        </Campo>
        <Campo
          label="Teléfono (opcional)"
          name="telefono"
          error={errores.telefono}
          ayuda="Con código de área, sin 0 ni 15. Ej: 11 2345 6789"
        >
          <input
            name="telefono"
            type="tel"
            defaultValue={socio?.telefono ?? ""}
            className={inputClase}
          />
        </Campo>
        <Campo label="Método de pago" name="metodoPago" error={errores.metodoPago}>
          <select
            name="metodoPago"
            defaultValue={socio?.metodoPago ?? "TRANSFERENCIA"}
            className={inputClase}
          >
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {METODO_PAGO_LABEL[m]}
              </option>
            ))}
          </select>
        </Campo>
        <CampoEstado
          estado={socio?.estado}
          fechaBaja={socio?.fechaBaja}
          errorEstado={errores.estado}
          errorFechaBaja={errores.fechaBaja}
          inputClase={inputClase}
        />
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="carnet"
              defaultChecked={socio?.carnet ?? false}
              className="h-5 w-5 accent-boca-azul"
            />
            Tiene carnet
          </label>
        </div>
        <Campo
          label="Fecha de alta (mes/año)"
          name="fechaAlta"
          error={errores.fechaAlta}
          ayuda="Las cuotas anteriores a este mes se anulan solas y no cuentan como deuda."
        >
          <input
            id="fechaAlta"
            name="fechaAlta"
            type="month"
            defaultValue={mesISO(socio?.fechaAlta ?? new Date())}
            placeholder="mm/aaaa"
            required
            className={inputClase}
          />
        </Campo>
      </div>

      <Campo label="Observaciones (opcional)" name="observaciones" error={errores.observaciones}>
        <textarea
          name="observaciones"
          rows={3}
          maxLength={1000}
          defaultValue={socio?.observaciones ?? ""}
          placeholder="Notas internas: acuerdos de pago, datos de contacto alternativos, etc."
          className={`${inputClase} resize-none`}
        />
      </Campo>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pendiente}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-boca-azul px-5 py-2.5 text-sm font-semibold text-boca-amarillo shadow transition hover:bg-boca-azul-claro disabled:opacity-60 sm:w-auto sm:py-2"
        >
          <Save className="h-4 w-4" aria-hidden />
          {pendiente ? "Guardando…" : textoBoton}
        </button>
      </div>
    </form>
  );
}

const inputClase =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-base text-slate-900 shadow-sm focus:border-boca-azul focus:outline-none focus:ring-2 focus:ring-boca-amarillo sm:py-2 sm:text-sm";

function Campo({
  label,
  name,
  error,
  ayuda,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : ayuda ? (
        <p className="mt-1 text-xs text-slate-500">{ayuda}</p>
      ) : null}
    </div>
  );
}
