import { getCookie } from 'cookies-next';
import ky, { HTTPError, type KyInstance } from 'ky';

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

export const AUTH_TOKEN_COOKIE = 'hestia-token';

/**
 * Resolve the bearer token used by the API client.
 *
 * Services are called from client components, so the token is read from the
 * same cookie that the auth flow writes on successful login/register.
 */
export function getAuthToken(): string | undefined {
  if (globalThis.window === undefined) {
    return undefined;
  }

  let token: unknown;

  try {
    token = getCookie(AUTH_TOKEN_COOKIE);
  } catch {
    return undefined;
  }

  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

function extractErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const detail = (data as { detail?: unknown }).detail;

  if (typeof detail === 'string') {
    return detail;
  }

  // FastAPI validation errors expose `detail` as an array of issues.
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg);
        }
        return String(item);
      })
      .filter(Boolean);

    return messages.length > 0 ? messages.join(', ') : undefined;
  }

  return undefined;
}

export function createClient(token?: string): KyInstance {
  return ky.create({
    // ky v2 renamed `prefixUrl` to `prefix`.
    prefix: `${API_URL}/`,
    timeout: 30_000,
    hooks: {
      beforeRequest: [
        ({ request }) => {
          const bearer = token ?? getAuthToken();
          if (bearer) {
            request.headers.set('Authorization', `Bearer ${bearer}`);
          }
        },
      ],
      beforeError: [
        ({ error }) => {
          if (error instanceof HTTPError) {
            const message = extractErrorMessage(error.data);
            if (message) {
              error.message = message;
            }
          }
          return error;
        },
      ],
    },
  });
}

export const api = createClient();
