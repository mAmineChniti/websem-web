import { z } from 'zod';

export const dommageSchema = z.object({
  dommage: z.string(),
  typeDommage: z.string(),
  description: z.string().nullable(),
  niveauGravite: z.string().nullable(),
  valeurBien: z.string().nullable(),
  associeSinistre: z.string().nullable(),
});

export const dommagesListSchema = z.array(dommageSchema);

export const dommageDetailSchema = dommageSchema.partial();

export const createDommagePayloadSchema = z.object({
  id: z.string().optional(),
  type: z.string().default('DommageMateriel'),
  description: z.string().optional(),
  niveauGravite: z.string().optional(),
  valeurBien: z.number().optional(),
  associeSinistre: z.string().optional(),
});

export const updateDommagePayloadSchema = z.object({
  typeDommage: z.string().optional(),
  description: z.string().optional(),
  niveauGravite: z.string().optional(),
  valeurBien: z.number().optional(),
  associeSinistre: z.string().optional(),
});
