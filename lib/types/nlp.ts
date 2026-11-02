/** Request body for POST /api/ontology/nlp/ask. */
export interface NlpAskPayload {
  question: string;
}

export interface NlpTokenizationStep {
  library: string;
  tokens: string[];
  stems: string[];
  normalized: string;
}

export interface NlpEntity {
  text: string;
  label: string;
}

export interface NlpPosTag {
  token: string;
  pos: string;
  lemma: string;
}

export interface NlpSpacyStep {
  library: string;
  available: boolean;
  entities: NlpEntity[];
  pos_tags: NlpPosTag[];
  detected_names: string[];
  detected_dates: string[];
  detected_amounts: string[];
  noun_chunks?: string[];
}

export interface NlpIntentMatchStep {
  library: string;
  matched_intent: string;
  match_score: number;
  total_intents_available: number;
}

export interface NlpPipeline {
  step1_nltk: NlpTokenizationStep;
  step2_spacy: NlpSpacyStep;
  step3_intent: NlpIntentMatchStep;
}

/** Response returned by POST /api/ontology/nlp/ask. */
export interface NlpAskResult {
  question: string;
  intent: string;
  intent_description: string;
  match_score: number;
  sparql_query: string;
  results: Record<string, string | null>[];
  count: number;
  vars: string[];
  elapsed_ms: number;
  pipeline: NlpPipeline;
}

export interface NlpIntent {
  id: string;
  description: string;
  example_keywords: string[];
}

/** Response returned by GET /api/ontology/nlp/intents. */
export interface NlpIntentsResult {
  total: number;
  intents: NlpIntent[];
  pipeline_description: string[];
  libraries: string[];
}
