-- AlterTable
ALTER TABLE "Socio" ALTER COLUMN "fechaAlta" DROP NOT NULL,
ALTER COLUMN "fechaAlta" DROP DEFAULT;

-- Las fechas cargadas por el usuario son siempre día 1 (ver parsearMes). Las que no lo son
-- las puso el DEFAULT de la migración anterior, así que pasan a "sin definir".
UPDATE "Socio" SET "fechaAlta" = NULL WHERE EXTRACT(DAY FROM "fechaAlta") <> 1;
