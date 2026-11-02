import { authResponseSchema, currentUserSchema } from '@/lib/schemas/auth';
import { createClient } from '@/lib/services/client';
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/lib/types/auth';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await createClient()
    .post('api/ontology/auth/login', { json: payload })
    .json();
  return authResponseSchema.parse(data);
}

export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const data = await createClient()
    .post('api/ontology/auth/register', { json: payload })
    .json();
  return authResponseSchema.parse(data);
}

/**
 * Fetch the authenticated user.
 *
 * When no token is provided, the client falls back to the `hestia-token`
 * cookie written by the login flow.
 */
export async function me(token?: string): Promise<AuthUser> {
  const data = await createClient(token).get('api/ontology/auth/me').json();
  return currentUserSchema.parse(data);
}
