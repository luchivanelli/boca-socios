"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Gift, Maximize2, Minimize2, Play, RotateCcw, Trophy, X } from "lucide-react";
import { NOMBRE_PENA } from "@/lib/constants";

export type Participante = {
  id: number;
  nombre: string;
  apellido: string;
  nroSocio: number;
};

type Props = {
  participantes: Participante[];
  tituloPorDefecto: string;
};

type Fase = "girando" | "ganador" | "final";

const DURACION_GIRO_MS = 4200;
const PAUSA_GANADOR_MS = 4500;

/** Entero aleatorio en [0, max) con el generador criptográfico del navegador. */
function azar(max: number) {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
}

/** Elige `cantidad` participantes distintos, al azar, con un mezclado de Fisher-Yates. */
function elegirGanadores(lista: Participante[], cantidad: number) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = azar(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, cantidad);
}

export function Sorteo({ participantes, tituloPorDefecto }: Props) {
  const [titulo, setTitulo] = useState(tituloPorDefecto);
  const [cantidad, setCantidad] = useState(1);
  const [mostrarNro, setMostrarNro] = useState(true);
  const [ganadores, setGanadores] = useState<Participante[] | null>(null);
  // Cambia en cada sorteo: remonta el escenario para que arranque de cero.
  const [ronda, setRonda] = useState(0);

  const maximo = participantes.length;
  const cantidadValida = Math.min(Math.max(1, cantidad), Math.max(1, maximo));

  function iniciar() {
    if (maximo === 0) return;
    setGanadores(elegirGanadores(participantes, cantidadValida));
    setRonda((r) => r + 1);
  }

  return (
    <>
      <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3 rounded-md bg-boca-azul px-4 py-3 text-white">
          <div>
            <p className="text-xs uppercase tracking-wide text-boca-amarillo">Participantes</p>
            <p className="text-2xl font-bold">
              {maximo} {maximo === 1 ? "socio al día" : "socios al día"}
            </p>
          </div>
          <Gift className="h-10 w-10 text-boca-amarillo" aria-hidden />
        </div>

        {maximo === 0 && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No hay socios activos al día. Marcá las cuotas pagadas en el listado y volvé a intentar.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-slate-700">
              Título del sorteo
            </label>
            <input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={60}
              className={inputClase}
            />
          </div>
          <div>
            <label htmlFor="cantidad" className="mb-1 block text-sm font-medium text-slate-700">
              Cantidad de ganadores
            </label>
            <input
              id="cantidad"
              type="number"
              inputMode="numeric"
              min={1}
              max={Math.max(1, maximo)}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className={inputClase}
            />
            <p className="mt-1 text-xs text-slate-500">Un socio no puede salir dos veces.</p>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={mostrarNro}
                onChange={(e) => setMostrarNro(e.target.checked)}
                className="h-5 w-5 accent-boca-azul"
              />
              Mostrar número de socio
            </label>
          </div>
        </div>

        <details className="rounded-md border border-slate-200">
          <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-medium text-slate-700">
            Ver participantes
            <ChevronDown className="h-4 w-4" aria-hidden />
          </summary>
          <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto border-t border-slate-200 text-sm">
            {participantes.map((p) => (
              <li key={p.id} className="flex items-center gap-2 px-3 py-1.5">
                <span className="w-12 shrink-0 font-mono text-xs text-slate-500">{p.nroSocio}</span>
                {p.apellido}, {p.nombre}
              </li>
            ))}
          </ul>
        </details>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Consejo: grabá la pantalla del celular en vertical. La animación oculta el resto de la
            app y arranca sola.
          </p>
          <button
            type="button"
            onClick={iniciar}
            disabled={maximo === 0}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-boca-azul px-5 py-2.5 text-sm font-semibold text-boca-amarillo shadow transition hover:bg-boca-azul-claro disabled:opacity-60"
          >
            <Play className="h-4 w-4" aria-hidden />
            Iniciar sorteo
          </button>
        </div>
      </div>

      {ganadores && (
        <Escenario
          key={ronda}
          titulo={titulo.trim() || tituloPorDefecto}
          participantes={participantes}
          ganadores={ganadores}
          mostrarNro={mostrarNro}
          onRepetir={() => {
            setGanadores(elegirGanadores(participantes, cantidadValida));
            setRonda((r) => r + 1);
          }}
          onSalir={() => setGanadores(null)}
        />
      )}
    </>
  );
}

const inputClase =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-boca-azul focus:outline-none focus:ring-2 focus:ring-boca-amarillo";

type EscenarioProps = {
  titulo: string;
  participantes: Participante[];
  ganadores: Participante[];
  mostrarNro: boolean;
  onRepetir: () => void;
  onSalir: () => void;
};

/** Pantalla completa con la animación: gira nombres, revela cada ganador y cierra con la lista. */
function Escenario({ titulo, participantes, ganadores, mostrarNro, onRepetir, onSalir }: EscenarioProps) {
  const [fase, setFase] = useState<Fase>("girando");
  const [indice, setIndice] = useState(0);
  const [enPantalla, setEnPantalla] = useState<Participante>(participantes[0]);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const temporizador = useRef<number | null>(null);

  const ganador = ganadores[indice];
  const total = ganadores.length;

  // Fase "girando": los nombres pasan rápido y se van frenando hasta quedar en el ganador.
  useEffect(() => {
    if (fase !== "girando") return;
    const inicio = performance.now();
    let cancelado = false;

    const paso = () => {
      if (cancelado) return;
      const progreso = Math.min(1, (performance.now() - inicio) / DURACION_GIRO_MS);
      if (progreso >= 1) {
        setEnPantalla(ganador);
        setFase("ganador");
        return;
      }
      setEnPantalla(participantes[azar(participantes.length)]);
      // Curva ease-out: arranca a 45 ms por nombre y termina cerca de 420 ms.
      const espera = 45 + Math.pow(progreso, 2.2) * 380;
      temporizador.current = window.setTimeout(paso, espera);
    };
    paso();

    return () => {
      cancelado = true;
      if (temporizador.current) window.clearTimeout(temporizador.current);
    };
  }, [fase, ganador, participantes]);

  // Fase "ganador": pausa para que se lea y después sigue con el próximo o termina.
  useEffect(() => {
    if (fase !== "ganador") return;
    const id = window.setTimeout(() => {
      if (indice + 1 < total) {
        setIndice(indice + 1);
        setFase("girando");
      } else {
        setFase("final");
      }
    }, PAUSA_GANADOR_MS);
    return () => window.clearTimeout(id);
  }, [fase, indice, total]);

  // Escape sale del sorteo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSalir();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSalir]);

  const alternarPantallaCompleta = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setPantallaCompleta(false);
      } else {
        await document.documentElement.requestFullscreen();
        setPantallaCompleta(true);
      }
    } catch {
      // Algunos navegadores móviles no permiten pantalla completa; no es crítico.
    }
  }, []);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-boca-azul-oscuro text-white">
      {/* Controles discretos (quedan fuera del encuadre vertical en pantallas anchas) */}
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button
          type="button"
          onClick={alternarPantallaCompleta}
          aria-label={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}
          className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
        >
          {pantallaCompleta ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={onSalir}
          aria-label="Salir del sorteo"
          className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Encuadre 9:16 para que el video quede bien en Instagram */}
      <div className="relative flex h-full w-full max-w-[56.25vh] flex-col items-center justify-between overflow-hidden bg-boca-azul px-6 py-10 text-center shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-2 bg-boca-amarillo" />
        <div className="absolute inset-x-0 bottom-0 h-2 bg-boca-amarillo" />

        <header className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-boca-amarillo">{NOMBRE_PENA}</p>
          <h2 className="text-2xl font-black sm:text-3xl">{titulo}</h2>
          <p className="text-xs text-white/70">
            Participan {participantes.length} socios al día
          </p>
        </header>

        {fase === "final" ? (
          <Resultado ganadores={ganadores} mostrarNro={mostrarNro} />
        ) : (
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-boca-amarillo">
              {total > 1 ? `Ganador ${indice + 1} de ${total}` : "Ganador"}
            </p>
            <div
              key={fase === "ganador" ? `g-${indice}` : "giro"}
              className={`w-full rounded-2xl border-4 px-4 py-8 ${
                fase === "ganador"
                  ? "animate-revelar border-boca-amarillo bg-boca-amarillo text-boca-azul shadow-[0_0_60px_rgba(255,209,0,0.6)]"
                  : "border-white/20 bg-white/5"
              }`}
            >
              <p className="text-3xl font-black leading-tight break-words sm:text-5xl">
                {enPantalla.nombre}
              </p>
              <p className="mt-1 text-2xl font-bold break-words sm:text-4xl">{enPantalla.apellido}</p>
              {mostrarNro && (
                <p className={`mt-3 font-mono text-base ${fase === "ganador" ? "text-boca-azul/80" : "text-white/60"}`}>
                  Socio Nº {enPantalla.nroSocio}
                </p>
              )}
            </div>
            {fase === "ganador" && <Confeti semilla={indice} />}
            {fase === "ganador" && (
              <p className="text-lg font-bold text-boca-amarillo">¡Felicitaciones! 🎉</p>
            )}
          </div>
        )}

        <div />

        {fase === "final" && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 px-6">
            <button
              type="button"
              onClick={onRepetir}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Sortear de nuevo
            </button>
            <button
              type="button"
              onClick={onSalir}
              className="inline-flex items-center gap-1.5 rounded-md bg-boca-amarillo px-4 py-2 text-sm font-semibold text-boca-azul hover:bg-boca-amarillo-oscuro"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Resultado({ ganadores, mostrarNro }: { ganadores: Participante[]; mostrarNro: boolean }) {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
      <Trophy className="h-14 w-14 text-boca-amarillo" aria-hidden />
      <p className="text-sm font-semibold uppercase tracking-widest text-boca-amarillo">
        {ganadores.length === 1 ? "Ganador" : "Ganadores"}
      </p>
      <ol className="w-full space-y-2">
        {ganadores.map((g, i) => (
          <li
            key={g.id}
            style={{ animationDelay: `${i * 150}ms` }}
            className="animate-revelar flex items-center gap-3 rounded-xl bg-boca-amarillo px-4 py-3 text-left text-boca-azul"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-boca-azul font-bold text-boca-amarillo">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-lg font-black">
                {g.nombre} {g.apellido}
              </span>
              {mostrarNro && <span className="block font-mono text-xs text-boca-azul/70">Socio Nº {g.nroSocio}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const COLORES_CONFETI = ["#ffd100", "#ffffff", "#16418f", "#ffe766", "#e0b400"];

/** Papelitos que caen desde arriba; las posiciones se fijan por ganador para que no parpadeen. */
function Confeti({ semilla }: { semilla: number }) {
  const piezas = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const n = (i * 9301 + semilla * 49297 + 233) % 233280;
        const r = (k: number) => ((n * (k + 1)) % 1000) / 1000;
        return {
          left: `${r(1) * 100}%`,
          delay: `${r(2) * 1.2}s`,
          duration: `${2.2 + r(3) * 1.8}s`,
          size: `${6 + r(4) * 8}px`,
          color: COLORES_CONFETI[i % COLORES_CONFETI.length],
          rotate: `${r(5) * 360}deg`,
        };
      }),
    [semilla],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {piezas.map((p, i) => (
        <span
          key={i}
          className="animate-caer absolute -top-4 block rounded-sm"
          style={{
            left: p.left,
            width: p.size,
            height: `calc(${p.size} * 0.6)`,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}
    </div>
  );
}
