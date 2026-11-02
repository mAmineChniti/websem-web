import { z } from 'zod';

export const ontologySearchResultSchema = z.object({
  entite: z.string(),
  type: z.string(),
  propriete: z.string(),
  valeur: z.string(),
});

export const ontologySearchResultsSchema = z.array(ontologySearchResultSchema);
