/**
 * Importa socios desde src/socios.xlsx (hoja "2026").
 *
 *   npx tsx scripts/importar-socios.mts                 -> simulación: no escribe nada
 *   npx tsx scripts/importar-socios.mts --aplicar       -> inserta en una transacción
 *   opciones: --metodo-vacio=TRANSFERENCIA|COBRADOR     (método para filas sin dato; default TRANSFERENCIA)
 *
 * Reglas:
 * - Se saltan los socios cuyo nº de socio ya existe en la base.
 * - LOCALIDAD con número = dirección (localidad "Arroyo Seco"); sin número = localidad; vacía = "".
 * - Meses con X = cuota PAGA del año de la hoja. Cualquier texto que mencione baja/renuncia/fallecimiento
 *   (en meses, columna S o ALTA) = socio INACTIVO con fecha de baja (mes detectado o el actual).
 * - Columna S: COBRADOR / transferencia / débito automático se mapean; el resto va a Observaciones.
 * - ALTA: fecha (serie de Excel o "FEC. ALTA dd/mm/aa") = fecha de alta; otro texto va a Observaciones.
 *   Sin fecha: el primer mes con X del año (los meses previos quedan NULOS, no como deuda) o enero
 *   si no hay ninguna X. Nunca el mes actual: la app anularía las cuotas impagas anteriores al editar.
 * - Con fecha de alta dentro del año de la hoja, los meses previos sin X quedan NULOS (misma regla de la app).
 * - CARNET: "SI" o cualquier "TANDA" = tiene carnet; "NO" o vacío = no. El texto de tanda va a Observaciones.
 * - Teléfono: se guarda si tiene al menos 8 dígitos; si es texto, va a Observaciones.
 * - DNI: solo dígitos; "completar" o vacío = "".
 */
import { PrismaClient, type Estado, type EstadoCuota, type MetodoPago } from "@prisma/client";
import XLSX from "xlsx";
import { capitalizar } from "../src/lib/texto";

const ARCHIVO = "src/socios.xlsx";
const HOJA = "2026";
const ANIO = 2026;

const aplicar = process.argv.includes("--aplicar");
const metodoVacio = (process.argv.find((a) => a.startsWith("--metodo-vacio="))?.split("=")[1] ??
  "TRANSFERENCIA") as MetodoPago;

const MESES_NOMBRE = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

type Fila = {
  nroSocio: number;
  nombre: string;
  apellido: string;
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
  pagos: { anio: number; mes: number; estado: EstadoCuota }[];
  avisos: string[];
};

const hoy = new Date();
const mesActual = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), 1));

function texto(v: unknown) {
  return String(v ?? "").trim();
}

/** Serie de fecha de Excel (ej. 45769) -> Date UTC del día 1 de ese mes. */
function mesDesdeSerie(v: unknown): Date | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 30000 || n > 60000) return null;
  const d = XLSX.SSF.parse_date_code(n);
  if (!d) return null;
  return new Date(Date.UTC(d.y, d.m - 1, 1));
}

/** "dd/mm/aa" o "dd/mm/aaaa" -> Date UTC del día 1 del mes. */
function mesDesdeTexto(t: string): Date | null {
  const m = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(t);
  if (!m) return null;
  const mes = Number(m[2]);
  let anio = Number(m[3]);
  if (anio < 100) anio += 2000;
  if (mes < 1 || mes > 12) return null;
  return new Date(Date.UTC(anio, mes - 1, 1));
}

/** "ABRIL 2026", "FEB. 2026" -> Date UTC del día 1. */
function mesDesdeNombre(t: string): Date | null {
  const bajo = t.toLowerCase();
  for (let i = 0; i < 12; i++) {
    if (bajo.includes(MESES_LARGO[i]) || new RegExp(`\\b${MESES_NOMBRE[i]}\\b`).test(bajo)) {
      const anio = /\b(20\d{2})\b/.exec(bajo);
      return new Date(Date.UTC(anio ? Number(anio[1]) : ANIO, i, 1));
    }
  }
  return null;
}

function esBaja(t: string) {
  return /baja|renunci|falleci/i.test(t);
}

function metodoDesde(t: string): MetodoPago | null {
  const b = t.toLowerCase();
  if (/cobrador/.test(b)) return "COBRADOR";
  if (/tran?s?f/.test(b)) return "TRANSFERENCIA";
  if (/d[eé]bito|\bda\b/.test(b)) return "DEBITO_AUTOMATICO";
  return null;
}

function parsearFila(f: unknown[]): Fila | null {
  const nroSocio = Number(texto(f[2]));
  if (!Number.isInteger(nroSocio) || nroSocio <= 0) return null;

  const avisos: string[] = [];
  const observaciones: string[] = [];

  const nombre = capitalizar(texto(f[0]));
  const apellido = capitalizar(texto(f[1]));

  let dni = texto(f[3]).replace(/\D/g, "");
  if (!/^\d{6,9}$/.test(dni)) {
    if (texto(f[3])) observaciones.push(`DNI en planilla: "${texto(f[3])}"`);
    dni = "";
    avisos.push("sin DNI válido");
  }

  const loc = texto(f[4]);
  let localidad = "";
  let direccion: string | null = null;
  if (/\d/.test(loc)) {
    direccion = capitalizar(loc);
    localidad = "Arroyo Seco";
  } else if (loc) {
    localidad = capitalizar(loc);
  } else {
    avisos.push("sin localidad");
  }

  // Meses: X = pago; texto = nota (y posible baja)
  const pagos: Fila["pagos"] = [];
  let estado: Estado = "ACTIVO";
  let fechaBaja: Date | null = null;
  for (let i = 0; i < 12; i++) {
    const celda = texto(f[5 + i]);
    if (!celda) continue;
    if (/^x$/i.test(celda)) {
      pagos.push({ anio: ANIO, mes: i + 1, estado: "PAGO" });
    } else {
      observaciones.push(celda);
      if (esBaja(celda)) {
        estado = "INACTIVO";
        fechaBaja = mesDesdeNombre(celda) ?? fechaBaja;
      }
    }
  }

  // Teléfono
  const telCrudo = texto(f[17]);
  let telefono: string | null = null;
  if (telCrudo) {
    const digitos = telCrudo.replace(/\D/g, "");
    if (digitos.length >= 8 && digitos.length === telCrudo.replace(/[\s\-().+]/g, "").length) {
      telefono = digitos;
      if (digitos.length !== 10) avisos.push(`teléfono de ${digitos.length} dígitos`);
    } else {
      observaciones.push(`Teléfono en planilla: "${telCrudo}"`);
      avisos.push("teléfono no numérico");
    }
  }

  // Columna S: método de pago o nota
  const colS = texto(f[18]);
  let metodoPago: MetodoPago | null = null;
  if (colS) {
    const serie = mesDesdeSerie(colS);
    const metodo = metodoDesde(colS);
    if (serie) {
      const d = XLSX.SSF.parse_date_code(Number(colS));
      observaciones.push(`Fecha en planilla: ${String(d.d).padStart(2, "0")}/${String(d.m).padStart(2, "0")}/${d.y}`);
    } else if (metodo && /^(cobrador|tran[a-z]*|transf\.? ?fede|fede)$/i.test(colS)) {
      metodoPago = metodo;
    } else {
      if (metodo) metodoPago = metodo;
      observaciones.push(colS);
    }
    if (esBaja(colS)) {
      estado = "INACTIVO";
      fechaBaja = mesDesdeNombre(colS) ?? fechaBaja;
    }
  }
  if (!metodoPago) {
    metodoPago = metodoVacio;
    if (!colS) avisos.push("sin método de pago");
  }

  // ALTA: fecha de alta o nota
  const alta = texto(f[19]);
  let fechaAlta: Date | null = null;
  if (alta) {
    fechaAlta = mesDesdeSerie(alta) ?? (/alta/i.test(alta) ? mesDesdeTexto(alta) : null);
    if (!fechaAlta) {
      observaciones.push(alta);
      const metodo = metodoDesde(alta);
      if (metodo && !colS) metodoPago = metodo;
    }
    if (esBaja(alta)) {
      estado = "INACTIVO";
      fechaBaja = mesDesdeNombre(alta) ?? fechaBaja;
    }
  }

  // CARNET
  const carnetCrudo = texto(f[20]);
  const carnet = /^si/i.test(carnetCrudo) || /tanda/i.test(carnetCrudo);
  if (carnetCrudo && !/^(si|no)$/i.test(carnetCrudo)) observaciones.push(`Carnet: ${carnetCrudo}`);

  if (estado === "INACTIVO" && !fechaBaja) fechaBaja = mesActual;

  // Fecha de alta y cuotas previas al ingreso
  const mesesConX = pagos.map((p) => p.mes);
  if (!fechaAlta) {
    const primerMes = mesesConX.length > 0 ? Math.min(...mesesConX) : 1;
    fechaAlta = new Date(Date.UTC(ANIO, primerMes - 1, 1));
    if (primerMes > 1) avisos.push("alta deducida del primer mes pagado");
  }
  if (fechaAlta.getUTCFullYear() === ANIO) {
    const mesAlta = fechaAlta.getUTCMonth() + 1;
    for (let mes = 1; mes < mesAlta; mes++) {
      if (!mesesConX.includes(mes)) pagos.push({ anio: ANIO, mes, estado: "NULO" });
    }
  }

  return {
    nroSocio,
    nombre,
    apellido,
    dni,
    localidad,
    direccion,
    telefono,
    estado,
    carnet,
    metodoPago,
    fechaAlta,
    fechaBaja,
    observaciones: observaciones.length ? observaciones.join(" · ") : null,
    pagos,
    avisos,
  };
}

async function main() {
  const ws = XLSX.readFile(ARCHIVO).Sheets[HOJA];
  if (!ws) throw new Error(`No existe la hoja ${HOJA}`);
  const crudas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" }).slice(1);
  const filas = crudas.map(parsearFila).filter((f): f is Fila => f !== null);

  const prisma = new PrismaClient();
  const existentes = await prisma.socio.findMany({ select: { nroSocio: true, dni: true } });
  const nrosExistentes = new Set(existentes.map((s) => s.nroSocio));

  const saltadas = filas.filter((f) => nrosExistentes.has(f.nroSocio));
  const nuevas = filas.filter((f) => !nrosExistentes.has(f.nroSocio));

  // Resumen
  const cuenta = <T,>(arr: T[], fn: (x: T) => string) => {
    const m = new Map<string, number>();
    for (const x of arr) m.set(fn(x), (m.get(fn(x)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  console.log(`Filas en planilla: ${filas.length} | ya existen (se saltan): ${saltadas.length} | a insertar: ${nuevas.length}`);
  console.log("Estado:", cuenta(nuevas, (f) => f.estado));
  console.log("Método de pago:", cuenta(nuevas, (f) => f.metodoPago));
  console.log("Carnet:", cuenta(nuevas, (f) => String(f.carnet)));
  console.log("Localidad:", cuenta(nuevas, (f) => f.localidad || "(vacía)").slice(0, 12));
  console.log("Con dirección:", nuevas.filter((f) => f.direccion).length, "| con teléfono:", nuevas.filter((f) => f.telefono).length, "| con observaciones:", nuevas.filter((f) => f.observaciones).length);
  console.log("Fecha de alta:", cuenta(nuevas, (f) => f.fechaAlta.toISOString().slice(0, 7)).slice(0, 8));
  console.log("Fecha de baja:", cuenta(nuevas.filter((f) => f.fechaBaja), (f) => f.fechaBaja!.toISOString().slice(0, 7)));
  console.log("Cuotas 2026 pagas:", nuevas.reduce((a, f) => a + f.pagos.filter((p) => p.estado === "PAGO").length, 0), "| nulas (previas al alta):", nuevas.reduce((a, f) => a + f.pagos.filter((p) => p.estado === "NULO").length, 0));
  console.log("Avisos:", cuenta(nuevas.flatMap((f) => f.avisos), (a) => a));

  const dnis = new Map<string, number[]>();
  for (const f of nuevas) if (f.dni) dnis.set(f.dni, [...(dnis.get(f.dni) ?? []), f.nroSocio]);
  const dniRepetidos = [...dnis.entries()].filter(([, n]) => n.length > 1);
  console.log("DNI repetidos entre nuevos:", dniRepetidos.map(([d, n]) => `${d} -> socios ${n.join(", ")}`));
  const dniEnBase = new Set(existentes.map((s) => s.dni));
  console.log("DNI que ya existen en la base:", nuevas.filter((f) => f.dni && dniEnBase.has(f.dni)).map((f) => `${f.dni} (socio ${f.nroSocio})`));

  console.log("\nInactivos detectados:");
  for (const f of nuevas.filter((f) => f.estado === "INACTIVO")) {
    console.log(`  ${f.nroSocio} ${f.apellido}, ${f.nombre} | baja ${f.fechaBaja?.toISOString().slice(0, 7)} | ${f.observaciones}`);
  }
  console.log("\nEjemplos de observaciones:");
  for (const f of nuevas.filter((f) => f.observaciones).slice(0, 15)) console.log(`  ${f.nroSocio}: ${f.observaciones}`);

  if (!aplicar) {
    console.log("\nSimulación: no se escribió nada. Agregá --aplicar para insertar.");
    await prisma.$disconnect();
    return;
  }

  const resultado = await prisma.$transaction(
    async (tx) => {
      await tx.socio.createMany({
        data: nuevas.map((f) => ({
          nroSocio: f.nroSocio,
          nombre: f.nombre,
          apellido: f.apellido,
          dni: f.dni,
          localidad: f.localidad,
          direccion: f.direccion,
          telefono: f.telefono,
          estado: f.estado,
          carnet: f.carnet,
          metodoPago: f.metodoPago,
          fechaAlta: f.fechaAlta,
          fechaBaja: f.fechaBaja,
          observaciones: f.observaciones,
        })),
      });
      const ids = await tx.socio.findMany({
        where: { nroSocio: { in: nuevas.map((f) => f.nroSocio) } },
        select: { id: true, nroSocio: true },
      });
      const idPorNro = new Map(ids.map((s) => [s.nroSocio, s.id]));
      const cuotas = nuevas.flatMap((f) =>
        f.pagos.map((p) => ({ socioId: idPorNro.get(f.nroSocio)!, anio: p.anio, mes: p.mes, estado: p.estado })),
      );
      const pagos = await tx.pago.createMany({ data: cuotas });
      return { socios: ids.length, cuotas: pagos.count };
    },
    { timeout: 5 * 60 * 1000 },
  );
  console.log(`\nInsertados ${resultado.socios} socios y ${resultado.cuotas} cuotas.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
