import { z } from 'zod';

export const statsSchema = z.object({
  module: z.string(),
  personnes_count: z.number().int(),
  contrats_count: z.number().int(),
  assures_count: z.number().int(),
  agents_count: z.number().int(),
  experts_count: z.number().int(),
  beneficiaires_count: z.number().int(),
  classes_count: z.number().int(),
  total_triples: z.number().int(),
  sparql_examples_count: z.number().int(),
  ontology_uri: z.string(),
  rdf_format: z.string(),
});
