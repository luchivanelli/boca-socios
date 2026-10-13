import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { crearSocio } from "@/actions/socios";
import { SocioForm } from "@/components/SocioForm";

export default function NuevoSocioPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al listado
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-boca-azul">Nuevo socio</h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SocioForm action={crearSocio} textoBoton="Crear socio" />
      </div>
    </div>
  );
}
