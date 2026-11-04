export interface SparqlExample {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  query: string;
}

/** Response for SELECT / CONSTRUCT / DESCRIBE queries. */
export interface SparqlSelectResult {
  /** SELECT results do not include a `type` discriminator. */
  type?: undefined;
  vars: string[];
  count: number;
  results: Record<string, string | null>[];
  query: string;
}

/** Response for ASK queries. */
export interface SparqlAskResult {
  type: 'ASK';
  boolean: boolean;
}

export interface SparqlUpdateResult {
  type: 'UPDATE';
  message: string;
  total_triples: number;
  query: string;
}

export interface SparqlGraphResult {
  type: 'CONSTRUCT' | 'DESCRIBE';
  count: number;
  results: string;
  query: string;
}

export type SparqlResult =
  SparqlSelectResult | SparqlAskResult | SparqlUpdateResult | SparqlGraphResult;

export function isSparqlAskResult(
  result: SparqlResult
): result is SparqlAskResult {
  return result.type === 'ASK';
}

export function isSparqlSelectResult(
  result: SparqlResult
): result is SparqlSelectResult {
  return 'results' in result && Array.isArray(result.results);
}
