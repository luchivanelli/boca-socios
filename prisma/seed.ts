/**
 * Datos de ejemplo para probar la app: npm run db:seed
 * Solo inserta si la tabla de socios está vacía.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existentes = await prisma.socio.count();
  if (existentes > 0) {
    console.log(`Ya hay ${existentes} socios cargados, no se insertan datos de ejemplo.`);
    return;
  }

  const anio = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;
  const hasta = (n: number) => Array.from({ length: n }, (_, i) => ({ anio, mes: i + 1 }));

  await prisma.socio.create({
    data: {
      nombre: "Juan Román", apellido: "Riquelme", nroSocio: 10, dni: "26123456",
      localidad: "Don Torcuato", direccion: "Brandsen 805", telefono: "11 2345 6789",
      estado: "ACTIVO", carnet: true, metodoPago: "DEBITO_AUTOMATICO",
    },
  });
  await prisma.socio.create({
    data: {
      nombre: "Martín", apellido: "Palermo", nroSocio: 9, dni: "23456789",
      localidad: "La Plata", telefono: "221 456 7890",
      estado: "ACTIVO", carnet: true, metodoPago: "TRANSFERENCIA",
      pagos: { create: hasta(Math.max(0, mesActual - 3)) },
    },
  });
  await prisma.socio.create({
    data: {
      nombre: "Carlos", apellido: "Tevez", nroSocio: 32, dni: "30111222",
      localidad: "Ejército de los Andes", telefono: "11 6789 1234",
      estado: "ACTIVO", carnet: false, metodoPago: "COBRADOR",
      pagos: { create: hasta(Math.max(0, mesActual - 1)) },
    },
  });
  await prisma.socio.create({
    data: {
      nombre: "Sebastián", apellido: "Battaglia", nroSocio: 5, dni: "27999888",
      localidad: "Santa Fe", estado: "ACTIVO", carnet: false, metodoPago: "COBRADOR",
    },
  });
  await prisma.socio.create({
    data: {
      nombre: "Diego", apellido: "Maradona", nroSocio: 1, dni: "14276579",
      localidad: "Villa Fiorito", estado: "INACTIVO", carnet: true, metodoPago: "TRANSFERENCIA",
    },
  });

  console.log("Datos de ejemplo cargados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
