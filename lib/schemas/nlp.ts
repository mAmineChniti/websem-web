import { z } from 'zod';

export const nlpAskPayloadSchema = z.object({
  question: z.string().min(1, 'La question est requise'),
});

export const nlpTokenizationStepSchema = z.object({
  library: z.string(),
  tokens: z.array(z.string()),
  stems: z.array(z.string()),
  normalized: z.string(),
});

export const nlpEntitySchema = z.object({
  text: z.string(),
  label: z.string(),
});

export const nlpPosTagSchema = z.object({
  token: z.string(),
  pos: z.string(),
  lemma: z.string(),
});

export const nlpSpacyStepSchema = z.object({
  library: z.string(),
  available: z.boolean(),
  entities: z.array(nlpEntitySchema),
  pos_tags: z.array(nlpPosTagSchema),
  detected_names: z.array(z.string()),
  detected_dates: z.array(z.string()),
  detected_amounts: z.array(z.string()),
  noun_chunks: z.array(z.string()).optional(),
});

export const nlpIntentMatchStepSchema = z.object({
  library: z.string(),
  matched_intent: z.string(),
  match_score: z.number(),
  total_intents_available: z.number().int(),
});

export const nlpPipelineSchema = z.object({
  step1_nltk: nlpTokenizationStepSchema,
  step2_spacy: nlpSpacyStepSchema,
  step3_intent: nlpIntentMatchStepSchema,
});

export const nlpAskResultSchema = z.object({
  question: z.string(),
  intent: z.string(),
  intent_description: z.string(),
  match_score: z.number(),
  sparql_query: z.string(),
  results: z.array(z.record(z.string(), z.string().nullable())),
  count: z.number().int(),
  vars: z.array(z.string()),
  elapsed_ms: z.number(),
  pipeline: nlpPipelineSchema,
});

export const nlpIntentSchema = z.object({
  id: z.string(),
  description: z.string(),
  example_keywords: z.array(z.string()),
});

export const nlpIntentsResultSchema = z.object({
  total: z.number().int(),
  intents: z.array(nlpIntentSchema),
  pipeline_description: z.array(z.string()),
  libraries: z.array(z.string()),
});
