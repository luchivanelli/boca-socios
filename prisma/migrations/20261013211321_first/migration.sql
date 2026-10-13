-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TRANSFERENCIA', 'DEBITO_AUTOMATICO', 'COBRADOR');

-- CreateTable
CREATE TABLE "Socio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "nroSocio" INTEGER NOT NULL,
    "dni" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "estado" "Estado" NOT NULL DEFAULT 'ACTIVO',
    "carnet" BOOLEAN NOT NULL DEFAULT false,
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'TRANSFERENCIA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "socioId" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Socio_nroSocio_key" ON "Socio"("nroSocio");

-- CreateIndex
CREATE UNIQUE INDEX "Socio_dni_key" ON "Socio"("dni");

-- CreateIndex
CREATE INDEX "Socio_apellido_nombre_idx" ON "Socio"("apellido", "nombre");

-- CreateIndex
CREATE INDEX "Pago_anio_mes_idx" ON "Pago"("anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_socioId_anio_mes_key" ON "Pago"("socioId", "anio", "mes");

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
