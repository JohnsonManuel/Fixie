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
    if (user) return user.getIdToken();
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

export interface StreamDonePayload {
  conversation_id: string;
  pending_confirmation?: Record<string, unknown> | null;
  pending_approval?: Record<string, unknown> | null;
}

/**
 * POST to a streaming SSE endpoint. Calls `onToken` for every text_delta,
 * resolves with the final `done` payload, rejects on error events or HTTP failures.
 */
export async function apiStream(
  path: string,
  body: unknown,
  onToken: (text: string) => void,
): Promise<StreamDonePayload> {
  const token = await getToken();
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 401) { redirectToLogin(); throw new Error('Redirecting to login…'); }
    const data = await res.json().catch(() => ({}));
    const msg = (typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
    const err = new Error(msg) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  if (!res.body) throw new Error('No response body');

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      let event: Record<string, unknown>;
      try { event = JSON.parse(line.slice(6)); } catch { continue; }

      if (event.type === 'text_delta') {
        onToken(event.text as string);
      } else if (event.type === 'done') {
        return event as unknown as StreamDonePayload;
      } else if (event.type === 'error') {
        throw new Error((event.message as string) || 'Stream error');
      }
    }
  }

  throw new Error('Stream closed without a done event');
}

/** Upload a FormData payload (multipart). Does NOT set Content-Type so the browser adds the boundary. */
export async function apiUpload<T = unknown>(path: string, form: FormData): Promise<T> {
  const token = await getToken();
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) { redirectToLogin(); throw new Error('Redirecting to login…'); }
    const msg = (typeof data.detail === 'string' ? data.detail : `HTTP ${res.status}`);
    const err = new Error(msg) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}
