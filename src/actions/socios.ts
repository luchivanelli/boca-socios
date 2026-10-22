"use server";

import { Prisma, type Estado, type EstadoCuota, type MetodoPago } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ESTADOS, ESTADOS_CUOTA, METODOS_PAGO } from "@/lib/constants";
import { parsearMes } from "@/lib/cuotas";
import { capitalizar } from "@/lib/texto";
import { getAnioInicio } from "@/lib/socios";
import { getDetalleDeuda, getTodosLosSocios } from "@/lib/listado";
import { aExportable, type FiltrosExportacion, type SocioExportable, type TipoExportacion } from "@/lib/exportar";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  /** Cuotas marcadas como nulas al guardar (si se pidió anular meses anteriores). */
  anuladas?: number;
} | null;

type DatosSocio = {
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

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function validar(formData: FormData): { datos?: DatosSocio; errores: Record<string, string> } {
  const errores: Record<string, string> = {};

  const nombre = capitalizar(texto(formData, "nombre"));
  const apellido = capitalizar(texto(formData, "apellido"));
  const nroSocioTexto = texto(formData, "nroSocio");
  const dni = texto(formData, "dni").replace(/\./g, "");
  const localidad = capitalizar(texto(formData, "localidad"));
  const direccion = capitalizar(texto(formData, "direccion"));
  const telefono = texto(formData, "telefono");
  const estado = texto(formData, "estado") as Estado;
  const metodoPago = texto(formData, "metodoPago") as MetodoPago;
  const carnet = formData.get("carnet") === "on";
  const observaciones = texto(formData, "observaciones");

  if (!nombre) errores.nombre = "El nombre es obligatorio.";
  if (!apellido) errores.apellido = "El apellido es obligatorio.";

  const nroSocio = Number(nroSocioTexto);
  if (!nroSocioTexto || !Number.isInteger(nroSocio) || nroSocio <= 0) {
    errores.nroSocio = "Ingresá un número de socio válido.";
  }

  if (!/^\d{6,9}$/.test(dni)) errores.dni = "Ingresá un DNI válido (solo números).";
  if (!localidad) errores.localidad = "La localidad es obligatoria.";
  if (observaciones.length > 1000) errores.observaciones = "Máximo 1000 caracteres.";
  if (!ESTADOS.includes(estado)) errores.estado = "Estado inválido.";
  if (!METODOS_PAGO.includes(metodoPago)) errores.metodoPago = "Método de pago inválido.";
  if (telefono && telefono.replace(/\D/g, "").length < 8) {
    errores.telefono = "El teléfono parece incompleto.";
  }

  const fechaAlta = parsearMes(texto(formData, "fechaAlta"));
  if (!fechaAlta) errores.fechaAlta = "Ingresá el mes de alta como mm/aaaa.";

  // La fecha de baja solo existe para inactivos; al reactivar se borra.
  const fechaBaja = estado === "INACTIVO" ? parsearMes(texto(formData, "fechaBaja")) : null;
  if (estado === "INACTIVO" && !fechaBaja) errores.fechaBaja = "Ingresá el mes de baja como mm/aaaa.";

  if (Object.keys(errores).length > 0 || !fechaAlta) return { errores };

  return {
    errores,
    datos: {
      nombre,
      apellido,
      nroSocio,
      dni,
      localidad,
      direccion: direccion || null,
      telefono: telefono || null,
      estado,
      carnet,
      metodoPago,
      fechaAlta,
      fechaBaja,
      observaciones: observaciones || null,
    },
  };
}

/**
 * Marca como NULO todas las cuotas anteriores al mes de alta que todavía no tengan
 * registro, desde el primer año con cuotas en el sistema. No pisa pagos ni nulos existentes.
 */
async function anularMesesAnteriores(socioId: number, fechaAlta: Date) {
  const anioInicio = await getAnioInicio();
  const anioAlta = fechaAlta.getUTCFullYear();
  const mesAlta = fechaAlta.getUTCMonth() + 1;

  const cuotas: { socioId: number; anio: number; mes: number; estado: EstadoCuota }[] = [];
  for (let anio = anioInicio; anio <= anioAlta; anio++) {
    const ultimoMes = anio === anioAlta ? mesAlta - 1 : 12;
    for (let mes = 1; mes <= ultimoMes; mes++) {
      cuotas.push({ socioId, anio, mes, estado: "NULO" });
    }
  }
  if (cuotas.length === 0) return 0;

  const resultado = await prisma.pago.createMany({ data: cuotas, skipDuplicates: true });
  return resultado.count;
}

function errorDeUnicidad(e: unknown): FormState | undefined {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const campos = (e.meta?.target as string[] | undefined) ?? [];
    if (campos.includes("nroSocio")) {
      return { fieldErrors: { nroSocio: "Ya existe un socio con ese número." } };
    }
    if (campos.includes("dni")) {
      return { fieldErrors: { dni: "Ya existe un socio con ese DNI." } };
    }
    return { error: "Ya existe un socio con esos datos." };
  }
  return undefined;
}

export async function crearSocio(_prev: FormState, formData: FormData): Promise<FormState> {
  const { datos, errores } = validar(formData);
  if (!datos) return { fieldErrors: errores };

  let nuevoId: number;
  try {
    const socio = await prisma.socio.create({ data: datos });
    nuevoId = socio.id;
  } catch (e) {
    return errorDeUnicidad(e) ?? { error: "No se pudo crear el socio. Intentá de nuevo." };
  }

  // Las cuotas anteriores al mes de alta no corresponden: quedan nulas automáticamente.
  await anularMesesAnteriores(nuevoId, datos.fechaAlta);

  revalidatePath("/");
  revalidatePath("/deudores");
  redirect(`/socios/${nuevoId}`);
}

export async function actualizarSocio(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { datos, errores } = validar(formData);
  if (!datos) return { fieldErrors: errores };

  try {
    await prisma.socio.update({ where: { id }, data: datos });
  } catch (e) {
    return errorDeUnicidad(e) ?? { error: "No se pudo guardar. Intentá de nuevo." };
  }

  // Idempotente: solo agrega nulos en meses sin registro, no pisa pagos ni nulos existentes.
  const anuladas = await anularMesesAnteriores(id, datos.fechaAlta);

  revalidatePath("/");
  revalidatePath("/deudores");
  revalidatePath(`/socios/${id}`);
  return { ok: true, anuladas };
}

export async function eliminarSocio(id: number) {
  await prisma.socio.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/deudores");
  redirect("/");
}

/**
 * Fija el estado de la cuota de un mes: PAGO, NULO (no corresponde cobrarla)
 * o null para volver a impago.
 */
export async function marcarCuota(
  socioId: number,
  anio: number,
  mes: number,
  estado: EstadoCuota | null,
) {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new Error("Mes inválido");
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw new Error("Año inválido");
  if (estado !== null && !ESTADOS_CUOTA.includes(estado)) throw new Error("Estado inválido");

  if (estado) {
    await prisma.pago.upsert({
      where: { socioId_anio_mes: { socioId, anio, mes } },
      create: { socioId, anio, mes, estado },
      update: { estado, fecha: new Date() },
    });
  } else {
    await prisma.pago.deleteMany({ where: { socioId, anio, mes } });
  }

  revalidatePath("/");
  revalidatePath("/deudores");
  revalidatePath(`/socios/${socioId}`);
}

/**
 * Devuelve los socios a exportar al PDF según los filtros del listado y el tipo elegido.
 * Se llama recién al descargar, así la página del listado no carga de más.
 */
export async function exportarSocios(
  filtros: FiltrosExportacion,
  tipo: TipoExportacion,
): Promise<SocioExportable[]> {
  const hoy = new Date();
  const filas = await getTodosLosSocios(
    {
      q: filtros.q,
      estado: filtros.estado,
      metodoPago: filtros.metodoPago,
      orden: filtros.orden,
      cuotas: tipo === "todos" ? undefined : tipo,
    },
    filtros.anio,
    hoy,
  );
  const detalle = await getDetalleDeuda(
    filas.filter((f) => f.deuda > 0).map((f) => f.socio.id),
    hoy,
  );
  return filas.map((f) => aExportable(f, detalle.get(f.socio.id) ?? [], hoy.getFullYear()));
}
