import {
  booleanResponseSchema,
  ontologyEntityCreatedResponseSchema,
} from '@/lib/schemas/api';
import {
  sinistreDetailSchema,
  sinistresListSchema,
} from '@/lib/schemas/sinistres';
import { createClient } from '@/lib/services/client';
import type { OntologyEntityCreatedResponse } from '@/lib/types/api';
import type {
  CreateSinistrePayload,
  Sinistre,
  SinistreDetail,
  UpdateSinistrePayload,
} from '@/lib/types/sinistres';

export async function listSinistres(): Promise<Sinistre[]> {
  const data = await createClient().get('api/ontology/sinistres').json();
  return sinistresListSchema.parse(data);
}

export async function getSinistre(id: string): Promise<SinistreDetail> {
  const data = await createClient()
    .get(`api/ontology/sinistres/${encodeURIComponent(id)}`)
    .json();
  return sinistreDetailSchema.parse(data);
}

export async function createSinistre(
  payload: CreateSinistrePayload
): Promise<OntologyEntityCreatedResponse> {
  const data = await createClient()
    .post('api/ontology/sinistres', { json: payload })
    .json();
  return ontologyEntityCreatedResponseSchema.parse(data);
}

export async function updateSinistre(
  id: string,
  payload: UpdateSinistrePayload
): Promise<boolean> {
  const data = await createClient()
    .put(`api/ontology/sinistres/${encodeURIComponent(id)}`, {
      json: payload,
    })
    .json();
  const updated = booleanResponseSchema.parse(data);
  if (!updated) {
    throw new Error('Le sinistre demandé est introuvable.');
  }
  return updated;
}

export async function deleteSinistre(id: string): Promise<boolean> {
  const data = await createClient()
    .delete(`api/ontology/sinistres/${encodeURIComponent(id)}`)
    .json();
  const deleted = booleanResponseSchema.parse(data);
  if (!deleted) {
    throw new Error('Le sinistre demandé est introuvable.');
  }
  return deleted;
}
