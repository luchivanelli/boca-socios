import { Prisma, type Estado, type EstadoCuota, type MetodoPago } from "@prisma/client";
import { ORDEN_POR_DEFECTO, type FiltroCuotas, type Orden } from "./params";
import { prisma } from "./prisma";
import { calcularDeuda, type Cuota } from "./socios";

/**
 * Listado de socios calculado en la base: la deuda (cantidad de cuotas) y la grilla del año
 * se resuelven en SQL, así una página de 50 socios pesa unas decenas de KB en lugar de traer
 * todas las cuotas de todos los socios. Pensado para el plan gratuito de Neon.
 */

export type FiltrosListado = {
  q?: string;
  estado?: Estado;
  metodoPago?: MetodoPago;
  cuotas?: FiltroCuotas;
  orden?: Orden;
};

export type SocioListado = {
  id: number;
  nombre: string;
  apellido: string;
  nroSocio: number;
  dni: string;
  localidad: string;
  direccion: string | null;
  telefono: string | null;
  estado: Estado;
  carnet: boolean;
  metodoPago: MetodoPago;
  fechaAlta: Date;
  fechaBaja: Date | null;
  observaciones: string | null;
};

export type FilaListado = {
  socio: SocioListado;
  /** Estado de cada mes del año consultado (índice 0 = enero). */
  estados: (EstadoCuota | null)[];
  /** Cuotas adeudadas hasta hoy (0 para inactivos y débito automático). */
  deuda: number;
  debito: boolean;
  inactivo: boolean;
};

export type ConteosListado = {
  /** Socios que cumplen búsqueda y filtros, antes del filtro de cuotas. */
  total: number;
  /** Ídem pero aplicando también el filtro de cuotas: es lo que se pagina. */
  listados: number;
  activos: number;
  deudores: number;
  alDia: number;
};

type FilaSql = SocioListado & { deuda: number; cuotas: [number, EstadoCuota][] | null };

const ORDEN_SQL: Record<Orden, Prisma.Sql> = {
  "nroSocio-asc": Prisma.sql`"nroSocio" ASC`,
  "nroSocio-desc": Prisma.sql`"nroSocio" DESC`,
  "apellido-asc": Prisma.sql`apellido ASC, nombre ASC`,
  "apellido-desc": Prisma.sql`apellido DESC, nombre DESC`,
};

function condicionCuotas(cuotas?: FiltroCuotas): Prisma.Sql {
  if (cuotas === "deudores") return Prisma.sql`deuda > 0`;
  if (cuotas === "al-dia") return Prisma.sql`deuda = 0 AND estado = 'ACTIVO'`;
  return Prisma.sql`TRUE`;
}

/**
 * CTE "base": un socio por fila con su deuda y la grilla del año.
 * - inicio: primer año con cuotas en el sistema (antes no se debe nada).
 * - exigibles: meses desde enero de `inicio` hasta el mes actual.
 * - deuda: exigibles menos cuotas registradas (pagas o nulas) en ese rango.
 */
function cteBase(filtros: FiltrosListado, anio: number, hoy: Date) {
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  const condiciones: Prisma.Sql[] = [];
  if (filtros.estado) condiciones.push(Prisma.sql`s.estado = ${filtros.estado}::"Estado"`);
  if (filtros.metodoPago) {
    condiciones.push(Prisma.sql`s."metodoPago" = ${filtros.metodoPago}::"MetodoPago"`);
  }
  const texto = filtros.q?.trim();
  if (texto) {
    const like = `%${texto}%`;
    const numero = Number(texto);
    const porNumero = Number.isInteger(numero) ? Prisma.sql`OR s."nroSocio" = ${numero}::int` : Prisma.empty;
    condiciones.push(
      Prisma.sql`(s.nombre ILIKE ${like} OR s.apellido ILIKE ${like} OR s.localidad ILIKE ${like} OR s.dni LIKE ${like} ${porNumero})`,
    );
  }
  const where = condiciones.length > 0 ? Prisma.sql`WHERE ${Prisma.join(condiciones, " AND ")}` : Prisma.empty;

  return Prisma.sql`
    WITH inicio AS (
      SELECT LEAST(COALESCE(MIN(p.anio), ${anioActual}::int), ${anioActual}::int) AS anio FROM "Pago" p
    ),
    base AS (
      SELECT
        s.id, s.nombre, s.apellido, s."nroSocio", s.dni, s.localidad, s.direccion, s.telefono,
        s.estado::text AS estado, s.carnet, s."metodoPago"::text AS "metodoPago",
        s."fechaAlta", s."fechaBaja", s.observaciones,
        CASE
          WHEN s.estado = 'INACTIVO' OR s."metodoPago" = 'DEBITO_AUTOMATICO' THEN 0
          ELSE GREATEST(
            0,
            ((${anioActual}::int - i.anio) * 12 + ${mesActual}::int) - (
              SELECT COUNT(*)::int FROM "Pago" p
              WHERE p."socioId" = s.id
                AND p.anio >= i.anio
                AND (p.anio < ${anioActual}::int OR (p.anio = ${anioActual}::int AND p.mes <= ${mesActual}::int))
            )
          )
        END AS deuda,
        (
          SELECT json_agg(json_build_array(p.mes, p.estado) ORDER BY p.mes)
          FROM "Pago" p WHERE p."socioId" = s.id AND p.anio = ${anio}::int
        ) AS cuotas
      FROM "Socio" s CROSS JOIN inicio i
      ${where}
    )
  `;
}

function aFila(f: FilaSql): FilaListado {
  const estados: (EstadoCuota | null)[] = Array(12).fill(null);
  for (const [mes, estado] of f.cuotas ?? []) estados[mes - 1] = estado;
  const { deuda, cuotas: _cuotas, ...socio } = f;
  void _cuotas;
  return {
    socio,
    estados,
    deuda,
    debito: socio.metodoPago === "DEBITO_AUTOMATICO",
    inactivo: socio.estado === "INACTIVO",
  };
}

export async function getListadoSocios(
  filtros: FiltrosListado,
  opciones: { anio: number; pagina: number; porPagina: number; hoy?: Date },
) {
  const hoy = opciones.hoy ?? new Date();
  const base = cteBase(filtros, opciones.anio, hoy);
  const filtroCuotas = condicionCuotas(filtros.cuotas);
  const orden = ORDEN_SQL[filtros.orden ?? ORDEN_POR_DEFECTO];

  const [conteo] = await prisma.$queryRaw<
    { total: number; listados: number; activos: number; deudores: number; al_dia: number }[]
  >(Prisma.sql`
    ${base}
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE ${filtroCuotas})::int AS listados,
      COUNT(*) FILTER (WHERE estado = 'ACTIVO')::int AS activos,
      COUNT(*) FILTER (WHERE deuda > 0)::int AS deudores,
      COUNT(*) FILTER (WHERE deuda = 0 AND estado = 'ACTIVO')::int AS al_dia
    FROM base
  `);

  const paginas = Math.max(1, Math.ceil(conteo.listados / opciones.porPagina));
  const pagina = Math.min(Math.max(1, opciones.pagina), paginas);
  const offset = (pagina - 1) * opciones.porPagina;

  const filas = await prisma.$queryRaw<FilaSql[]>(Prisma.sql`
    ${base}
    SELECT * FROM base
    WHERE ${filtroCuotas}
    ORDER BY ${orden}
    LIMIT ${opciones.porPagina}::int OFFSET ${offset}::int
  `);

  const conteos: ConteosListado = {
    total: conteo.total,
    listados: conteo.listados,
    activos: conteo.activos,
    deudores: conteo.deudores,
    alDia: conteo.al_dia,
  };

  return { filas: filas.map(aFila), conteos, pagina, paginas };
}

/** Todas las filas que cumplen los filtros, sin paginar (exportación, deudores, sorteo). */
export async function getTodosLosSocios(filtros: FiltrosListado, anio: number, hoy = new Date()) {
  const base = cteBase(filtros, anio, hoy);
  const filas = await prisma.$queryRaw<FilaSql[]>(Prisma.sql`
    ${base}
    SELECT * FROM base
    WHERE ${condicionCuotas(filtros.cuotas)}
    ORDER BY ${ORDEN_SQL[filtros.orden ?? ORDEN_POR_DEFECTO]}
  `);
  return filas.map(aFila);
}

/**
 * Qué meses debe cada socio de la lista (para WhatsApp y el PDF). Trae las cuotas solo de
 * esos socios, en una consulta.
 */
export async function getDetalleDeuda(socioIds: number[], hoy = new Date()) {
  const detalle = new Map<number, Cuota[]>();
  if (socioIds.length === 0) return detalle;

  const [pagos, primero] = await Promise.all([
    prisma.pago.findMany({
      where: { socioId: { in: socioIds } },
      select: { socioId: true, anio: true, mes: true, estado: true },
    }),
    prisma.pago.findFirst({ select: { anio: true }, orderBy: { anio: "asc" } }),
  ]);
  const anioInicio = Math.min(primero?.anio ?? hoy.getFullYear(), hoy.getFullYear());

  const porSocio = new Map<number, { anio: number; mes: number; estado: EstadoCuota }[]>();
  for (const p of pagos) {
    const lista = porSocio.get(p.socioId) ?? [];
    lista.push(p);
    porSocio.set(p.socioId, lista);
  }
  for (const id of socioIds) {
    detalle.set(
      id,
      calcularDeuda({ estado: "ACTIVO", metodoPago: "TRANSFERENCIA", pagos: porSocio.get(id) ?? [] }, anioInicio, hoy),
    );
  }
  return detalle;
}
