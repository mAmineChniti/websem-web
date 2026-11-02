import { nlpAskResultSchema, nlpIntentsResultSchema } from '@/lib/schemas/nlp';
import { createClient } from '@/lib/services/client';
import type {
  NlpAskPayload,
  NlpAskResult,
  NlpIntentsResult,
} from '@/lib/types/nlp';

export async function askNlp(payload: NlpAskPayload): Promise<NlpAskResult> {
  const data = await createClient()
    .post('api/ontology/nlp/ask', { json: payload })
    .json();
  return nlpAskResultSchema.parse(data);
}

export async function listNlpIntents(): Promise<NlpIntentsResult> {
  const data = await createClient().get('api/ontology/nlp/intents').json();
  return nlpIntentsResultSchema.parse(data);
}
