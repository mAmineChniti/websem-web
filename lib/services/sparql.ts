import { sparqlExamplesSchema, sparqlResultSchema } from '@/lib/schemas/sparql';
import { createClient } from '@/lib/services/client';
import type { SparqlExample, SparqlResult } from '@/lib/types/sparql';

export async function listSparqlExamples(): Promise<SparqlExample[]> {
  const data = await createClient().get('api/ontology/sparql/examples').json();
  return sparqlExamplesSchema.parse(data);
}

export async function runSparql(query: string): Promise<SparqlResult> {
  const data = await createClient()
    .post('api/ontology/sparql', { json: { query } })
    .json();
  return sparqlResultSchema.parse(data);
}
