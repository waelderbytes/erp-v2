// JWT-Auth im Browser: Access-/Refresh-Token in localStorage (siehe README fuer
// die bewusste Einschraenkung ggue. httpOnly-Cookies - MVP, XSS-Risiko dokumentiert).
// Payload wird NUR lokal dekodiert (kein Verify - das macht ausschliesslich das
// Backend), rein fuer UI-Zwecke wie Rollen-basiertes Ein-/Ausblenden von
// Navigationspunkten.
const ACCESS_TOKEN_KEY = 'erp_access_token';
const REFRESH_TOKEN_KEY = 'erp_refresh_token';

export interface JwtPayload {
  sub: string;
  email: string;
  rollen: string[];
  berechtigungen: string[];
  exp: number;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function logout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const [, payloadB64] = token.split('.');
    return JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function getCurrentUser(): JwtPayload | null {
  const token = getAccessToken();
  return token ? decodeToken(token) : null;
}

export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.exp * 1000 > Date.now();
}

export async function login(email: string, passwort: string): Promise<void> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, passwort }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? 'Anmeldung fehlgeschlagen.');
  }
  const { accessToken, refreshToken } = await response.json();
  setTokens(accessToken, refreshToken);
}

// Wird von api.ts bei 401 versucht, BEVOR ausgeloggt wird - Access-Token laeuft
// nach 15 Minuten ab (siehe auth-service token.service.ts), ohne Refresh-Flow
// waere die UI alle 15 Minuten unbenutzbar.
export async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    const { accessToken, refreshToken: neuerRefreshToken } = await response.json();
    setTokens(accessToken, neuerRefreshToken);
    return true;
  } catch {
    return false;
  }
}
