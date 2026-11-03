import { z } from 'zod';

import { USER_ROLES } from '@/lib/types/auth';

export const userRoleSchema = z.enum(USER_ROLES);

/** Login payload schema (mirrors backend LoginRequest) */
export const loginPayloadSchema = z.object({
  email: z.email('Email invalide').transform((val) => val.trim().toLowerCase()),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type LoginPayload = z.infer<typeof loginPayloadSchema>;

/** Register payload schema (mirrors backend RegisterRequest) */
export const registerPayloadSchema = z.object({
  email: z.email('Email invalide').transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  cin: z.string().min(1, 'Le CIN est requis'),
  telephone: z.string().min(1, 'Le téléphone est requis'),
  adresse: z.string().min(1, "L'adresse est requise"),
  role: userRoleSchema.default('Assure'),
});

export type RegisterPayload = z.infer<typeof registerPayloadSchema>;

/** User object returned by login, register and /api/ontology/auth/me */
export const currentUserSchema = z.object({
  email: z.email(),
  nom: z.string(),
  prenom: z.string(),
  role: userRoleSchema,
  cin: z.string(),
  telephone: z.string(),
  adresse: z.string(),
  ontology_id: z.string(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

/** Auth response schema (login/register) */
export const authResponseSchema = z.object({
  token: z.string(),
  user: currentUserSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

/** Change role request schema (PATCH /personnes/{id}/role) */
export const changeRoleSchema = z.object({
  new_role: userRoleSchema,
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

/** User session schema for client-side state */
export const userSessionSchema = z.object({
  name: z.string(),
  email: z.email(),
  isConnected: z.boolean(),
  role: userRoleSchema,
  token: z.string().optional(),
  ontology_id: z.string().optional(),
});

export type UserSession = z.infer<typeof userSessionSchema>;
