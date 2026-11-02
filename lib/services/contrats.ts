import {
  createEntityResponseSchema,
  statusMessageResponseSchema,
} from '@/lib/schemas/api';
import { contratsListSchema } from '@/lib/schemas/contrats';
import { personnesListSchema } from '@/lib/schemas/personnes';
import { createClient } from '@/lib/services/client';
import type {
  CreateEntityResponse,
  StatusMessageResponse,
} from '@/lib/types/api';
import type {
  Contrat,
  CreateContratPayload,
  UpdateContratPayload,
} from '@/lib/types/contrats';
import type { Personne } from '@/lib/types/personnes';

const cleanContrats = (data: unknown): Contrat[] => {
  const parsed = contratsListSchema.parse(data);
  return parsed.filter(
    (c) =>
      c.contrat !== 'souscritContrat' &&
      c.contrat !== 'numeroContrat' &&
      c.typeContrat !== 'ObjectProperty' &&
      c.typeContrat !== 'FunctionalProperty' &&
      c.typeContrat !== 'DatatypeProperty'
  );
};

export async function listContrats(): Promise<Contrat[]> {
  const data = await createClient().get('api/ontology/contrats').json();
  return cleanContrats(data);
}

export async function listContratsByType(
  typeFilter: string
): Promise<Contrat[]> {
  const data = await createClient()
    .get('api/ontology/contrats', {
      searchParams: { type_filter: typeFilter },
    })
    .json();
  return cleanContrats(data);
}

export async function listPersonnesForSelect(): Promise<Personne[]> {
  const data = await createClient().get('api/ontology/personnes').json();
  return personnesListSchema.parse(data);
}

export async function createContrat(
  payload: CreateContratPayload
): Promise<CreateEntityResponse> {
  const data = await createClient()
    .post('api/ontology/contrats', { json: payload })
    .json();
  return createEntityResponseSchema.parse(data);
}

export async function updateContrat(
  id: string,
  payload: UpdateContratPayload
): Promise<StatusMessageResponse> {
  const data = await createClient()
    .put(`api/ontology/contrats/${encodeURIComponent(id)}`, {
      json: payload,
    })
    .json();
  return statusMessageResponseSchema.parse(data);
}

export async function deleteContrat(
  id: string
): Promise<StatusMessageResponse> {
  const data = await createClient()
    .delete(`api/ontology/contrats/${encodeURIComponent(id)}`)
    .json();
  return statusMessageResponseSchema.parse(data);
}
