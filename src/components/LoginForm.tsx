"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { login } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pendiente] = useActionState(login, null);
  const [mostrarClave, setMostrarClave] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="usuario" className="mb-1 block text-sm font-medium text-slate-700">
          Usuario
        </label>
        <input
          id="usuario"
          name="usuario"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          className={inputClase}
        />
      </div>
      <div>
        <label htmlFor="clave" className="mb-1 block text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="clave"
            name="clave"
            type={mostrarClave ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${inputClase} pr-11`}
          />
          <button
            type="button"
            onClick={() => setMostrarClave((v) => !v)}
            aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={mostrarClave}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-boca-azul"
          >
            {mostrarClave ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={pendiente}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-boca-azul px-4 py-2.5 text-sm font-semibold text-boca-amarillo shadow transition hover:bg-boca-azul-claro disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        {pendiente ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

const inputClase =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-boca-azul focus:outline-none focus:ring-2 focus:ring-boca-amarillo";
