export function Resumen({
  titulo,
  valor,
  resaltar,
}: {
  titulo: string;
  valor: number;
  resaltar?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 shadow-sm sm:p-3 ${
        resaltar ? "border-boca-amarillo bg-boca-amarillo-suave" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
        {titulo}
      </p>
      <p className="text-xl font-bold text-boca-azul sm:text-2xl">{valor}</p>
    </div>
  );
}
