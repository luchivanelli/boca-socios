"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { login } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pendiente] = useActionState(login, null);

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
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          className={inputClase}
        />
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
