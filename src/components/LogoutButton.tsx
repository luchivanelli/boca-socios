import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-white/80 transition hover:bg-boca-azul-claro hover:text-boca-amarillo sm:px-3"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </form>
  );
}
