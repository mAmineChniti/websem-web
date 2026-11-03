export interface Clause {
  id: string;
  type: string;
  texte_clause: string;
  description: string | null;
  taux_franchise: number | null;
  contrat: string | null;
}

/** `getClause` returns an empty object when the entity does not exist. */
export type ClauseDetail = Partial<Clause>;

export interface CreateClausePayload {
  type_clause?: string;
  texte_clause: string;
  description?: string;
  taux_franchise?: number | null;
  contrat_id?: string;
}

export interface UpdateClausePayload {
  type_clause?: string;
  texte_clause?: string;
  description?: string;
  taux_franchise?: number | null;
  contrat_id?: string | null;
}

export const TYPES_CLAUSE = [
  'ClauseExclusion',
  'ClauseFranchise',
  'ClauseObligatoire',
] as const;

export type TypeClause = (typeof TYPES_CLAUSE)[number];
