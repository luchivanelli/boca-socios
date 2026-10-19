import { Sorteo, type Participante } from "@/components/Sorteo";
import { MESES_LARGO } from "@/lib/constants";
import { requerirSesion } from "@/lib/auth";
import { getTodosLosSocios } from "@/lib/listado";

export const dynamic = "force-dynamic";

export default async function SorteoPage() {
  await requerirSesion("superadmin");
  const hoy = new Date();
  // Participan solo los activos sin cuotas adeudadas (incluye débito automático).
  const filas = await getTodosLosSocios(
    { estado: "ACTIVO", cuotas: "al-dia", orden: "nroSocio-asc" },
    hoy.getFullYear(),
    hoy,
  );
  const participantes: Participante[] = filas.map(({ socio }) => ({
    id: socio.id,
    nombre: socio.nombre,
    apellido: socio.apellido,
    nroSocio: socio.nroSocio,
  }));

  const tituloPorDefecto = `Sorteo de ${MESES_LARGO[hoy.getMonth()].toLowerCase()}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-boca-azul sm:text-2xl">Sorteo</h1>
        <p className="text-sm text-slate-600">
          Participan únicamente los socios activos que están al día con las cuotas. La animación
          ocupa toda la pantalla en formato vertical, lista para grabar y subir a Instagram.
        </p>
      </div>
      <Sorteo participantes={participantes} tituloPorDefecto={tituloPorDefecto} />
    </div>
  );
}
