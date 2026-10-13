import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-black text-boca-amarillo">404</p>
      <h1 className="mt-2 text-xl font-bold text-boca-azul">No encontramos esa página</h1>
      <Link href="/" className="mt-4 inline-block text-sm text-boca-azul underline">
        Volver al listado de socios
      </Link>
    </div>
  );
}
