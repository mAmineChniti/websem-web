import { z } from 'zod';

export const sparqlExampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  difficulty: z.string(),
  description: z.string(),
  query: z.string(),
});

export const sparqlExamplesSchema = z.array(sparqlExampleSchema);

export const sparqlRowSchema = z.record(z.string(), z.string().nullable());

export const sparqlSelectResultSchema = z.object({
  vars: z.array(z.string()),
  count: z.number().int(),
  results: z.array(sparqlRowSchema),
  query: z.string(),
});

export const sparqlAskResultSchema = z.object({
  type: z.literal('ASK'),
  boolean: z.boolean(),
});

export const sparqlResultSchema = z.union([
  sparqlAskResultSchema,
  sparqlSelectResultSchema,
]);
