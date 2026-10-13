-- CreateEnum
CREATE TYPE "EstadoCuota" AS ENUM ('PAGO', 'NULO');

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "estado" "EstadoCuota" NOT NULL DEFAULT 'PAGO';
