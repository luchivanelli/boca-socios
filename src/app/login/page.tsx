import Image from "next/image";
import { LoginForm } from "@/components/LoginForm";
import { NOMBRE_PENA } from "@/lib/constants";
import type { SearchParams } from "@/lib/params";
import logo from "../../../public/favicon-peña.png";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
        <div className="flex flex-col items-center gap-2 bg-boca-azul px-6 py-6 text-center text-white">
          <Image src={logo} alt="" width={64} height={64} priority className="h-16 w-16 rounded-full" />
          <h1 className="text-lg font-bold">{NOMBRE_PENA}</h1>
          <p className="text-xs text-boca-amarillo">Gestión de socios</p>
        </div>
        <div className="h-1.5 bg-boca-amarillo" />
        <div className="px-6 py-6">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
