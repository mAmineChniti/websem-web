import { z } from 'zod';

export const dommageSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  montant: z.number(),
  gravite: z.string(),
  sinistre: z.string().nullable(),
  date: z.string().nullable(),
  lieu: z.string().nullable(),
});

export const dommagesListSchema = z.array(dommageSchema);

export const dommageDetailSchema = dommageSchema.partial();

export const createDommagePayloadSchema = z.object({
  type_dommage: z.string().default('DommageMateriel'),
  description: z.string(),
  montant: z.number().default(0),
  gravite: z.string().default('Faible'),
  sinistre_id: z.string().optional(),
  date: z.string().optional(),
  lieu: z.string().optional(),
});

export const updateDommagePayloadSchema = z.object({
  type_dommage: z.string().optional(),
  description: z.string().optional(),
  montant: z.number().optional(),
  gravite: z.string().optional(),
  sinistre_id: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  lieu: z.string().nullable().optional(),
});

export const dommageMutationResponseSchema = z.object({
  message: z.string(),
  id: z.string().optional(),
});
