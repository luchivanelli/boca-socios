import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // El router reutiliza por 30 s las páginas ya visitadas al navegar; las server actions
    // invalidan esa caché con revalidatePath, así que los datos modificados nunca quedan viejos.
    staleTimes: { dynamic: 30 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
