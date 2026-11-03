import { z } from 'zod';

export const clauseSchema = z.object({
  id: z.string(),
  type: z.string(),
  texte_clause: z.string(),
  description: z.string().nullable(),
  taux_franchise: z.number().nullable(),
  contrat: z.string().nullable(),
});

export const clausesListSchema = z.array(clauseSchema);

export const clauseDetailSchema = clauseSchema.partial();

export const createClausePayloadSchema = z.object({
  type_clause: z.string().default('ClauseExclusion'),
  texte_clause: z.string().min(1),
  description: z.string().nullable().optional(),
  taux_franchise: z.number().nullable().optional(),
  contrat_id: z.string().nullable().optional(),
});

export const updateClausePayloadSchema = z.object({
  type_clause: z.string().optional(),
  texte_clause: z.string().optional(),
  description: z.string().nullable().optional(),
  taux_franchise: z.number().nullable().optional(),
  contrat_id: z.string().nullable().optional(),
});

export const clauseMutationResponseSchema = z.object({
  message: z.string(),
  id: z.string().optional(),
});
