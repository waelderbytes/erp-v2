// Zentraler fetch-Wrapper gegen /api/* (siehe nginx.conf: /api/auth/* -> auth-service,
// /api/* sonst -> erp-service). Haengt automatisch den Bearer-Token an und wirft bei
// Nicht-2xx-Antworten einen ApiError mit der Backend-Fehlermeldung (statt eines
// generischen "Failed to fetch"), damit Screens klare Meldungen anzeigen koennen.
import { getAccessToken, logout, tryRefresh } from './auth';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function doFetch(path: string, options: RequestInit): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  return fetch(`/api${path}`, { ...options, headers });
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await doFetch(path, options);

  if (response.status === 401) {
    // Access-Token laeuft nach 15 Minuten ab - erst versuchen, per Refresh-Token
    // (30 Tage gueltig) eine neue Session zu holen, bevor die Session als tot
    // gilt. Erst wenn AUCH das fehlschlaegt (z.B. Refresh-Token ebenfalls
    // abgelaufen/ungueltig), wirklich ausloggen.
    const erneuert = await tryRefresh();
    if (erneuert) {
      response = await doFetch(path, options);
    }
    if (response.status === 401) {
      logout();
      window.location.href = '/login';
      throw new ApiError('Sitzung abgelaufen, bitte erneut anmelden.', 401);
    }
  }

  if (!response.ok) {
    let message = `Fehler ${response.status}`;
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // Antwort war kein JSON - Standardmeldung behalten.
    }
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
