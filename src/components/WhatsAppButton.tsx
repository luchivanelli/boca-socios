import { linkWhatsApp } from "@/lib/whatsapp";

type Props = {
  telefono: string | null;
  mensaje: string;
  texto?: string;
  compacto?: boolean;
};

export function WhatsAppButton({ telefono, mensaje, texto = "Avisar por WhatsApp", compacto }: Props) {
  const clase = compacto
    ? "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
    : "inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold sm:w-auto sm:py-2";

  if (!telefono) {
    return (
      <span
        title="El socio no tiene teléfono cargado"
        className={`${clase} cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400`}
      >
        <IconoWhatsApp /> Sin teléfono
      </span>
    );
  }

  return (
    <a
      href={linkWhatsApp(telefono, mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${clase} bg-[#25D366] text-white shadow-sm transition hover:bg-[#1ebe5b]`}
    >
      <IconoWhatsApp /> {texto}
    </a>
  );
}

function IconoWhatsApp() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 1.67c4.56 0 8.24 3.7 8.24 8.24s-3.68 8.24-8.24 8.24c-1.52 0-3-.41-4.29-1.19l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.2 8.24-8.2m-3.3 4.1c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.29 3.69 2.1.83 2.52.66 2.98.62.46-.04 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.17-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.56.12-.17.25-.65.81-.79.98-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.5Z" />
    </svg>
  );
}
