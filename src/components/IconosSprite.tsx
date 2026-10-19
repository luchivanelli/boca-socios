/**
 * Íconos de Lucide que se repiten cientos de veces en el listado (uno por casilla de mes).
 * Se definen una sola vez acá y cada casilla los referencia con <use>, lo que achica
 * muchísimo el HTML frente a incrustar el SVG completo en cada botón.
 */
export function IconosSprite() {
  return (
    <svg aria-hidden xmlns="http://www.w3.org/2000/svg" style={{ display: "none" }}>
      <symbol
        id="icono-check"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </symbol>
      <symbol
        id="icono-minus"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
      </symbol>
    </svg>
  );
}

/** Referencia a un ícono del sprite. */
export function Icono({ nombre, className = "h-4 w-4" }: { nombre: "check" | "minus"; className?: string }) {
  return (
    <svg className={className} aria-hidden>
      <use href={`#icono-${nombre}`} />
    </svg>
  );
}
