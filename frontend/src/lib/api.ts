import { Platform } from 'react-native';

/**
 * Cliente HTTP de la API. La URL sale de EXPO_PUBLIC_API_URL (frontend/.env); en un teléfono
 * físico tiene que ser la IP de la computadora en la red local, no localhost.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** Error de la API con el mensaje en español que manda el servidor. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; role: 'admin' | 'taller' | 'ayudante' | 'cliente'; shopId: string | null };
}

// La sesión vive en memoria (para la demo): al cerrar la app hay que volver a entrar.
let session: Session | null = null;
let onExpired: (() => void) | null = null;

export const getSession = () => session;
export function setSession(s: Session | null) {
  session = s;
}
/** Se llama cuando la sesión ya no se puede renovar (el store vuelve al inicio). */
export function onSessionExpired(fn: () => void) {
  onExpired = fn;
}

const message = (body: unknown, status: number) => {
  if (status === 429) return 'Demasiados intentos seguidos. Espera un minuto e intenta de nuevo.';
  const m = (body as { message?: string | string[] } | null)?.message;
  if (Array.isArray(m)) return m.join('. ');
  if (m) return m;
  return status >= 500 ? 'El servidor tuvo un problema. Intenta de nuevo.' : 'No se pudo completar.';
};

async function parse(res: Response) {
  if (res.status === 204) return undefined;
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return text;
  }
}

let refreshing: Promise<boolean> | null = null;

/** Renueva la sesión una sola vez aunque varias peticiones fallen a la vez. */
function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const current = session;
    if (!current) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      if (!res.ok) return false;
      session = (await res.json()) as Session;
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function send(path: string, init: RequestInit, retry = true): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (session) headers.set('Authorization', `Bearer ${session.accessToken}`);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, `No hay conexión con el servidor (${API_URL}).`);
  }
  if (res.status === 401 && retry && session && (await refresh())) return send(path, init, false);
  const body = await parse(res);
  if (res.status === 401 && session) {
    session = null;
    onExpired?.();
  }
  if (!res.ok) throw new ApiError(res.status, message(body, res.status));
  return body;
}

export const api = {
  get: <T>(path: string) => send(path, { method: 'GET' }) as Promise<T>,
  post: <T>(path: string, body?: unknown) =>
    send(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }) as Promise<T>,
  put: <T>(path: string, body: unknown) =>
    send(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) as Promise<T>,
  patch: <T>(path: string, body: unknown) =>
    send(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) as Promise<T>,
  delete: (path: string) => send(path, { method: 'DELETE' }),

  /** Sube una foto local (file://, blob: o data:) como multipart en el campo `file`. */
  async upload<T>(path: string, uri: string, fields: Record<string, string> = {}) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    if (Platform.OS === 'web') {
      // En web la foto es un blob: o data: que hay que leer como archivo.
      const blob = await (await fetch(uri)).blob();
      form.append('file', blob, 'foto.jpg');
    } else {
      // React Native arma el archivo a partir de { uri, name, type }; el servidor detecta el tipo real.
      form.append('file', { uri, name: 'foto.jpg', type: 'image/jpeg' } as unknown as Blob);
    }
    return send(path, { method: 'POST', body: form }) as Promise<T>;
  },
};

/** Fuente para expo-image: las fotos de la API llevan el token; las locales van tal cual. */
export function imageSource(uri: string) {
  if (!uri.startsWith(API_URL) || !session) return { uri };
  return { uri, headers: { Authorization: `Bearer ${session.accessToken}` }, cacheKey: uri };
}

/** Lee una foto (local o de la API) como data-URI, para incrustarla en la hoja impresa. */
export async function fetchAsDataUri(uri: string): Promise<string | null> {
  if (uri.startsWith('data:')) return uri;
  try {
    const headers: Record<string, string> =
      uri.startsWith(API_URL) && session ? { Authorization: `Bearer ${session.accessToken}` } : {};
    const blob = await (await fetch(uri, { headers })).blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
