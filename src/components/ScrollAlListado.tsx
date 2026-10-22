"use client";

import { useEffect, useRef } from "react";

/**
 * Al cambiar de página del listado: vuelve la tabla a su inicio (el contenedor con scroll
 * propio conserva la posición entre navegaciones) y lleva la ventana al comienzo del listado,
 * no al tope de la página. No hace nada en la primera carga.
 */
export function ScrollAlListado({ clave }: { clave: string }) {
  const anterior = useRef(clave);

  useEffect(() => {
    if (anterior.current === clave) return;
    anterior.current = clave;
    document.getElementById("tabla-socios")?.scrollTo({ top: 0, left: 0 });
    document.getElementById("listado")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [clave]);

  return null;
}
