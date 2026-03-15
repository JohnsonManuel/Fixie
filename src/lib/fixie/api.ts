import { getAuth } from 'firebase/auth';
import { getApps } from 'firebase/app';
import { API_BASE } from './config';
import { redirectToLogin } from './auth';

let sessionToken: string | null = null;

export function setSessionToken(token: string): void {
  sessionToken = token;
}

async function getToken(): Promise<string> {
  if (sessionToken) return sessionToken;
  if (getApps().length) {
    const user = getAuth().currentUser;
    if (user) return await user.getIdToken();
  }
  redirectToLogin();
  throw new Error('Not authenticated');
}

interface ApiError extends Error {
  status: number;
  detail: unknown;
}

export async function apiFetch<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken();
  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      redirectToLogin();
      throw new Error('Redirecting to login…');
    }
    const msg =
      (typeof data.detail === 'string' ? data.detail : (data.detail as { message?: string })?.message) ||
      `HTTP ${res.status}`;
    const err = new Error(msg) as ApiError;
    err.status = res.status;
    err.detail = data.detail;
    throw err;
  }
  return data as T;
}

export const apiGet    = <T>(path: string)               => apiFetch<T>('GET',    path);
export const apiPost   = <T>(path: string, body: unknown) => apiFetch<T>('POST',   path, body);
export const apiPatch  = <T>(path: string, body: unknown) => apiFetch<T>('PATCH',  path, body);
export const apiDelete = <T>(path: string)               => apiFetch<T>('DELETE', path);
