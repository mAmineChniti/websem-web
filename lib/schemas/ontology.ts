import { z } from 'zod';

export const ontologyClassSchema = z.object({
  classe: z.string(),
  superClasse: z.string().nullable(),
});

export const ontologyClassesSchema = z.array(ontologyClassSchema);

export const ontologyClassInstanceSchema = z.object({
  individu: z.string(),
  nom: z.string().nullable(),
  prenom: z.string().nullable(),
});

export const ontologyClassInstancesSchema = z.array(
  ontologyClassInstanceSchema
);

export const ontologyPropertySchema = z.object({
  propriete: z.string(),
});

export const ontologyPropertiesSchema = z.array(ontologyPropertySchema);

export const reloadOntologyResponseSchema = z.object({
  message: z.string(),
  status: z.literal('ok'),
  triples: z.number().int(),
  path: z.string(),
});
