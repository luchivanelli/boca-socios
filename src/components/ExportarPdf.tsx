"use client";

import { useRef, useState } from "react";
import { FileDown, X } from "lucide-react";
import { NOMBRE_PENA } from "@/lib/constants";
import {
  COLUMNAS_EXPORTACION,
  COLUMNAS_POR_DEFECTO,
  filtrarPorTipo,
  TIPOS_EXPORTACION,
  valorColumna,
  type ClaveColumna,
  type SocioExportable,
  type TipoExportacion,
} from "@/lib/exportar";

type Props = {
  /** Socios del listado actual (ya con búsqueda y filtros aplicados). */
  filas: SocioExportable[];
  /** Descripción del filtro activo, para avisar que el PDF lo respeta. */
  hayFiltros: boolean;
};

export function ExportarPdf({ filas, hayFiltros }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [tipo, setTipo] = useState<TipoExportacion>("todos");
  const [columnas, setColumnas] = useState<ClaveColumna[]>(COLUMNAS_POR_DEFECTO);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seleccionadas = filtrarPorTipo(filas, tipo);

  function abrir() {
    setError(null);
    dialogo.current?.showModal();
  }

  function cerrar() {
    dialogo.current?.close();
  }

  function alternarColumna(clave: ClaveColumna) {
    setColumnas((actuales) =>
      actuales.includes(clave) ? actuales.filter((c) => c !== clave) : [...actuales, clave],
    );
  }

  async function descargar() {
    if (columnas.length === 0 || seleccionadas.length === 0) return;
    setGenerando(true);
    setError(null);
    try {
      await generarPdf(seleccionadas, columnas, tipo);
      cerrar();
    } catch (e) {
      console.error(e);
      setError("No se pudo generar el PDF. Probá de nuevo.");
    } finally {
      setGenerando(false);
    }
  }

  // Respeta el orden fijo de las columnas, no el orden en que se tildaron.
  const columnasOrdenadas = COLUMNAS_EXPORTACION.filter((c) => columnas.includes(c.clave));

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-md border border-boca-azul bg-white px-3 py-2 text-sm font-semibold text-boca-azul shadow-sm transition hover:bg-boca-azul hover:text-boca-amarillo"
      >
        <FileDown className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Exportar PDF</span>
        <span className="sm:hidden">PDF</span>
      </button>

      <dialog
        ref={dialogo}
        onClick={(e) => {
          // Click en el fondo (fuera del panel) cierra el modal.
          if (e.target === dialogo.current) cerrar();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-boca-azul-oscuro/60"
      >
        <form
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault();
            descargar();
          }}
          className="flex max-h-[85vh] flex-col"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-boca-azul px-4 py-3 text-white">
            <h2 className="text-base font-bold">Exportar listado a PDF</h2>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="rounded-md p-1 hover:bg-boca-azul-claro hover:text-boca-amarillo"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="space-y-5 overflow-y-auto px-4 py-4">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-800">Qué socios incluir</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(TIPOS_EXPORTACION) as TipoExportacion[]).map((t) => (
                  <label
                    key={t}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      tipo === t
                        ? "border-boca-azul bg-boca-azul/5 font-semibold text-boca-azul"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={t}
                      checked={tipo === t}
                      onChange={() => setTipo(t)}
                      className="accent-boca-azul"
                    />
                    {TIPOS_EXPORTACION[t]}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Se van a exportar <strong>{seleccionadas.length}</strong>{" "}
                {seleccionadas.length === 1 ? "socio" : "socios"}
                {hayFiltros ? " (respetando la búsqueda y los filtros aplicados en el listado)" : ""}.
              </p>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-800">Columnas a mostrar</legend>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                {COLUMNAS_EXPORTACION.map((c) => (
                  <label
                    key={c.clave}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={columnas.includes(c.clave)}
                      onChange={() => alternarColumna(c.clave)}
                      className="h-4 w-4 accent-boca-azul"
                    />
                    {c.etiqueta}
                  </label>
                ))}
              </div>
              {columnas.length === 0 && (
                <p className="mt-2 text-xs text-red-600">Elegí al menos una columna.</p>
              )}
            </fieldset>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cerrar}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={generando || columnas.length === 0 || seleccionadas.length === 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-boca-azul px-4 py-2 text-sm font-semibold text-boca-amarillo shadow transition hover:bg-boca-azul-claro disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" aria-hidden />
              {generando ? "Generando…" : `Descargar PDF (${columnasOrdenadas.length} col.)`}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

/**
 * Columnas cortas: ancho ajustado al contenido ("wrap"), así nunca se parte una palabra.
 * Columnas de texto largo: reparten el espacio restante con un mínimo razonable.
 */
const ESTILO_COLUMNA: Partial<Record<ClaveColumna, Record<string, unknown>>> = {
  nroSocio: { cellWidth: "wrap" },
  apellido: { cellWidth: "wrap" },
  nombre: { cellWidth: "wrap" },
  dni: { cellWidth: "wrap" },
  telefono: { cellWidth: "wrap" },
  estado: { cellWidth: "wrap" },
  carnet: { cellWidth: "wrap", halign: "center" },
  metodoPago: { cellWidth: "wrap" },
  fechaAlta: { cellWidth: "wrap", halign: "center" },
  deuda: { minCellWidth: 30 },
  localidad: { minCellWidth: 24 },
  direccion: { minCellWidth: 32 },
  observaciones: { minCellWidth: 40 },
};

/** Genera y descarga el PDF. Carga jsPDF bajo demanda para no inflar el bundle inicial. */
async function generarPdf(filas: SocioExportable[], columnas: ClaveColumna[], tipo: TipoExportacion) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const definicion = COLUMNAS_EXPORTACION.filter((c) => columnas.includes(c.clave));
  const anchas = definicion.some((c) => c.clave === "observaciones" || c.clave === "direccion");
  const apaisado = definicion.length > 6 || anchas;
  const muchasColumnas = definicion.length > 8;

  const doc = new jsPDF({ orientation: apaisado ? "landscape" : "portrait", unit: "mm", format: "a4" });
  const hoy = new Date();
  const fecha = hoy.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const azul: [number, number, number] = [11, 45, 107];
  const amarillo: [number, number, number] = [255, 209, 0];

  // Encabezado
  doc.setFillColor(...azul);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, "F");
  doc.setFillColor(...amarillo);
  doc.rect(0, 18, doc.internal.pageSize.getWidth(), 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(NOMBRE_PENA, 10, 8);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${TIPOS_EXPORTACION[tipo]} · ${filas.length} ${filas.length === 1 ? "socio" : "socios"} · ${fecha}`, 10, 14);

  autoTable(doc, {
    startY: 24,
    head: [definicion.map((c) => c.etiqueta)],
    body: filas.map((f) => definicion.map((c) => valorColumna(f, c.clave))),
    styles: {
      font: "helvetica",
      fontSize: muchasColumnas ? 8 : 9,
      cellPadding: muchasColumnas ? 1.5 : 2,
      textColor: [15, 23, 42],
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: { fillColor: azul, textColor: amarillo, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [243, 245, 250] },
    columnStyles: Object.fromEntries(definicion.map((c, i) => [i, ESTILO_COLUMNA[c.clave] ?? {}])),
    margin: { left: 10, right: 10, bottom: 14 },
    didDrawPage: (datos) => {
      const alto = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Página ${datos.pageNumber}`, doc.internal.pageSize.getWidth() - 10, alto - 6, {
        align: "right",
      });
    },
  });

  const sufijo = hoy.toISOString().slice(0, 10);
  doc.save(`socios-${tipo}-${sufijo}.pdf`);
}
