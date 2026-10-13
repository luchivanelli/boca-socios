"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { eliminarSocio } from "@/actions/socios";

export function EliminarSocioButton({ id, nombre }: { id: number; nombre: string }) {
  const [pendiente, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`¿Eliminar a ${nombre}? Se borrarán también sus pagos registrados.`)) return;
    startTransition(() => eliminarSocio(id));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pendiente}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 sm:w-auto sm:py-2"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      {pendiente ? "Eliminando…" : "Eliminar socio"}
    </button>
  );
}
