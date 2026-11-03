import { ontologySearchResultsSchema } from '@/lib/schemas/search';
import { createClient } from '@/lib/services/client';
import type { OntologySearchResult } from '@/lib/types/search';

export async function searchOntology(
  query: string,
  limit?: number
): Promise<OntologySearchResult[]> {
  const data = await createClient()
    .get('api/ontology/search', {
      searchParams: {
        q: query,
        ...(limit === null ? {} : { limit }),
      },
    })
    .json();
  return ontologySearchResultsSchema.parse(data);
}
