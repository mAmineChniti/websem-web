import {
  createEntityResponseSchema,
  statusMessageResponseSchema,
} from '@/lib/schemas/api';
import { personnesListSchema } from '@/lib/schemas/personnes';
import { createClient } from '@/lib/services/client';
import type {
  CreateEntityResponse,
  StatusMessageResponse,
} from '@/lib/types/api';
import type {
  CreatePersonnePayload,
  Personne,
  UpdatePersonnePayload,
} from '@/lib/types/personnes';

const cleanPersonnes = (data: unknown): Personne[] => {
  const parsed = personnesListSchema.parse(data);
  return parsed.filter(
    (p) =>
      p.personne !== 'aPourAssure' &&
      p.type !== 'ObjectProperty' &&
      p.type !== 'RapportExpertise'
  );
};

export async function listPersonnes(): Promise<Personne[]> {
  const data = await createClient().get('api/ontology/personnes').json();
  return cleanPersonnes(data);
}

export async function listPersonnesByRole(role: string): Promise<Personne[]> {
  const data = await createClient()
    .get('api/ontology/personnes', { searchParams: { role } })
    .json();
  return cleanPersonnes(data);
}

export async function createPersonne(
  payload: CreatePersonnePayload
): Promise<CreateEntityResponse> {
  const data = await createClient()
    .post('api/ontology/personnes', { json: payload })
    .json();
  return createEntityResponseSchema.parse(data);
}

export async function updatePersonne(
  id: string,
  payload: UpdatePersonnePayload
): Promise<StatusMessageResponse> {
  const data = await createClient()
    .put(`api/ontology/personnes/${encodeURIComponent(id)}`, {
      json: payload,
    })
    .json();
  return statusMessageResponseSchema.parse(data);
}

export async function updatePersonneRole(
  id: string,
  newRole: string
): Promise<StatusMessageResponse> {
  const data = await createClient()
    .patch(`api/ontology/personnes/${encodeURIComponent(id)}/role`, {
      json: { new_role: newRole },
    })
    .json();
  return statusMessageResponseSchema.parse(data);
}

export async function deletePersonne(
  id: string
): Promise<StatusMessageResponse> {
  const data = await createClient()
    .delete(`api/ontology/personnes/${encodeURIComponent(id)}`)
    .json();
  return statusMessageResponseSchema.parse(data);
}
