import { z } from 'zod';

export const contratSchema = z.object({
  contrat: z.string(),
  typeContrat: z.string(),
  numeroContrat: z.string().nullable(),
  dateDebut: z.string().nullable(),
  dateFin: z.string().nullable(),
  montantPrime: z.string().nullable(),
  assure: z.string().nullable(),
  habitation: z.string().nullable().optional(),
  garanties: z.string().nullable().optional(),
  beneficiaire: z.string().nullable().optional(),
  franchise: z.string().nullable().optional(),
});

export const contratsListSchema = z.array(contratSchema);

export const createContratPayloadSchema = z.object({
  type: z.string().default('ContratProprietaire'),
  numeroContrat: z.string(),
  dateDebut: z.string(),
  dateFin: z.string(),
  montantPrime: z.number(),
  assure: z.string().default('Assure1'),
  habitation: z.string().nullable().optional(),
  garanties: z.string().nullable().optional(),
  beneficiaire: z.string().nullable().optional(),
  franchise: z.number().optional(),
});

export const updateContratPayloadSchema = createContratPayloadSchema.partial();
