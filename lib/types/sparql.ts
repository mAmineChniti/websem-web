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

export type SparqlResult = SparqlSelectResult | SparqlAskResult;

export function isSparqlAskResult(
  result: SparqlResult
): result is SparqlAskResult {
  return result.type === 'ASK';
}

export function isSparqlSelectResult(
  result: SparqlResult
): result is SparqlSelectResult {
  return result.type !== 'ASK';
}
