import { z } from 'zod';

export const garantieSchema = z.object({
  garantie: z.string(),
  typeGarantie: z.string(),
  nomGarantie: z.string().nullable(),
  plafondGarantie: z.string().nullable(),
  tauxFranchise: z.string().nullable(),
});

export const garantiesListSchema = z.array(garantieSchema);

export const garantieDetailSchema = garantieSchema.partial();

export const createGarantiePayloadSchema = z.object({
  id: z.string().optional(),
  type: z.string().default('GarantieIncendie'),
  nomGarantie: z.string().optional(),
  plafondGarantie: z.number().optional(),
  franchise: z.number().optional(),
});

export const updateGarantiePayloadSchema = z.object({
  typeGarantie: z.string().optional(),
  nomGarantie: z.string().optional(),
  plafondGarantie: z.number().optional(),
  franchise: z.number().optional(),
});
