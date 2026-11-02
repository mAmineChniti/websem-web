import { z } from 'zod';

export const sinistreSchema = z.object({
  sinistre: z.string(),
  typeSinistre: z.string(),
  dateSinistre: z.string().nullable(),
  lieuSinistre: z.string().nullable(),
  descriptionSinistre: z.string().nullable(),
  statut: z.string().nullable(),
  dateDeclaration: z.string().nullable(),
  causeSinistre: z.string().nullable(),
  contrat: z.string().nullable(),
  assure: z.string().nullable(),
  assureNom: z.string().nullable(),
});

export const sinistresListSchema = z.array(sinistreSchema);

export const sinistreDetailSchema = sinistreSchema.partial();

export const createSinistrePayloadSchema = z.object({
  type: z.string().default('SinistreIncendie'),
  dateSinistre: z.string(),
  lieuSinistre: z.string().default(''),
  descriptionSinistre: z.string().default(''),
  montantDomage: z.number().nullable().optional(),
  contrat: z.string().default(''),
  statut: z.string().default('Declara'),
  causeSinistre: z.string().nullable().optional(),
});

export const updateSinistrePayloadSchema = z.object({
  typeSinistre: z.string().optional(),
  dateSinistre: z.string().optional(),
  lieuSinistre: z.string().optional(),
  descriptionSinistre: z.string().optional(),
  montantDomage: z.number().optional(),
  contrat: z.string().optional(),
  statut: z.string().optional(),
  causeSinistre: z.string().optional(),
});
