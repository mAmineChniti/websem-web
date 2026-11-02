import {
  booleanResponseSchema,
  ontologyEntityCreatedResponseSchema,
} from '@/lib/schemas/api';
import {
  garantieDetailSchema,
  garantiesListSchema,
} from '@/lib/schemas/garanties';
import { createClient } from '@/lib/services/client';
import type { OntologyEntityCreatedResponse } from '@/lib/types/api';
import type {
  CreateGarantiePayload,
  Garantie,
  GarantieDetail,
  UpdateGarantiePayload,
} from '@/lib/types/garanties';

export async function listGaranties(): Promise<Garantie[]> {
  const data = await createClient().get('api/ontology/garanties').json();
  return garantiesListSchema.parse(data);
}

export async function getGarantie(id: string): Promise<GarantieDetail> {
  const data = await createClient()
    .get(`api/ontology/garanties/${encodeURIComponent(id)}`)
    .json();
  return garantieDetailSchema.parse(data);
}

export async function createGarantie(
  payload: CreateGarantiePayload
): Promise<OntologyEntityCreatedResponse> {
  const data = await createClient()
    .post('api/ontology/garanties', { json: payload })
    .json();
  return ontologyEntityCreatedResponseSchema.parse(data);
}

export async function updateGarantie(
  id: string,
  payload: UpdateGarantiePayload
): Promise<boolean> {
  const data = await createClient()
    .put(`api/ontology/garanties/${encodeURIComponent(id)}`, {
      json: payload,
    })
    .json();
  return booleanResponseSchema.parse(data);
}

export async function deleteGarantie(id: string): Promise<boolean> {
  const data = await createClient()
    .delete(`api/ontology/garanties/${encodeURIComponent(id)}`)
    .json();
  return booleanResponseSchema.parse(data);
}
