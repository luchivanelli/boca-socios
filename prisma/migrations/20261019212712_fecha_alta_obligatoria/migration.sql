-- Los socios sin fecha de alta quedan con el mes actual (día 1): la fecha exacta no importa
-- para los cargados antes de empezar a usar la app, solo evita que se les cuenten cuotas previas.
UPDATE "Socio" SET "fechaAlta" = date_trunc('month', CURRENT_DATE)::date WHERE "fechaAlta" IS NULL;

-- AlterTable
ALTER TABLE "Socio" ALTER COLUMN "fechaAlta" SET NOT NULL;
