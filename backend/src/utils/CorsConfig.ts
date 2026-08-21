/**
 * Orígenes permitidos para CORS (HTTP y WebSocket).
 * Fuente única de verdad: variable de entorno CORS_ORIGIN (lista separada por comas).
 * Si no está definida o queda vacía, se permiten todos los orígenes (true).
 */

export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

export function resolveAllowedOrigins(): boolean | string[] {
  const raw = process.env['CORS_ORIGIN'] ?? '';
  const allowed = raw
    .split(',')
    .map(normalizeOrigin)
    .filter((origin) => origin.length > 0);

  return allowed.length > 0 ? allowed : true;
}

export function isOriginAllowed(origin: string | undefined, allowed: boolean | string[]): boolean {
  if (!origin) return true;
  if (allowed === true) return true;
  if (!Array.isArray(allowed)) return false;
  const normalized = normalizeOrigin(origin);
  return allowed.some((candidate) => candidate === '*' || candidate === normalized);
}
