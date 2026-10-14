import { Sorteo, type Participante } from "@/components/Sorteo";
import { MESES_LARGO } from "@/lib/constants";
import { requerirSesion } from "@/lib/auth";
import { calcularDeuda, getAnioInicio, getSocios } from "@/lib/socios";

export const dynamic = "force-dynamic";

export default async function SorteoPage() {
  await requerirSesion("superadmin");
  const hoy = new Date();
  const [socios, anioInicio] = await Promise.all([
    getSocios({ estado: "ACTIVO", orden: "nroSocio-asc" }),
    getAnioInicio(),
  ]);

  // Participan solo los activos sin cuotas adeudadas (incluye débito automático).
  const participantes: Participante[] = socios
    .filter((s) => calcularDeuda(s, anioInicio, hoy).length === 0)
    .map((s) => ({ id: s.id, nombre: s.nombre, apellido: s.apellido, nroSocio: s.nroSocio }));

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
