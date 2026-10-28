import { CORS_ALLOWED_ORIGINS } from "./configEnv.js";

export function getAllowedOrigins(configured = CORS_ALLOWED_ORIGINS, environment = process.env.NODE_ENV) {
  const raw = configured || (environment === "production" ? "" : "http://localhost:5173");
  const origins = raw.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (!origins.length) {
    throw new Error("Configura CORS_ALLOWED_ORIGINS antes de iniciar el backend en producción.");
  }
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin) throw new Error();
    } catch {
      throw new Error("CORS_ALLOWED_ORIGINS debe contener orígenes http(s) separados por coma, sin rutas ni barras finales.");
    }
  }
  return origins;
}
