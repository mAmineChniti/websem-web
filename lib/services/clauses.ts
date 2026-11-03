import {
  clauseDetailSchema,
  clauseMutationResponseSchema,
  clausesListSchema,
} from '@/lib/schemas/clauses';
import { createClient } from '@/lib/services/client';
import type {
  Clause,
  ClauseDetail,
  CreateClausePayload,
  UpdateClausePayload,
} from '@/lib/types/clauses';

export async function listClauses(): Promise<Clause[]> {
  const data = await createClient().get('api/clauses').json();
  return clausesListSchema.parse(data);
}

export async function getClause(id: string): Promise<ClauseDetail> {
  const data = await createClient()
    .get(`api/clauses/${encodeURIComponent(id)}`)
    .json();
  return clauseDetailSchema.parse(data);
}

export async function createClause(
  payload: CreateClausePayload
): Promise<string | undefined> {
  const data = await createClient()
    .post('api/clauses', { json: payload })
    .json();
  const parsed = clauseMutationResponseSchema.parse(data);
  return parsed.id;
}

export async function updateClause(
  id: string,
  payload: UpdateClausePayload
): Promise<void> {
  const data = await createClient()
    .put(`api/clauses/${encodeURIComponent(id)}`, { json: payload })
    .json();
  clauseMutationResponseSchema.parse(data);
}

export async function deleteClause(id: string): Promise<void> {
  const data = await createClient()
    .delete(`api/clauses/${encodeURIComponent(id)}`)
    .json();
  clauseMutationResponseSchema.parse(data);
}
