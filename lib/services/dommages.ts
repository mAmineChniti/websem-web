import {
  booleanResponseSchema,
  ontologyEntityCreatedResponseSchema,
} from '@/lib/schemas/api';
import {
  dommageDetailSchema,
  dommagesListSchema,
} from '@/lib/schemas/dommages';
import { createClient } from '@/lib/services/client';
import type { OntologyEntityCreatedResponse } from '@/lib/types/api';
import type {
  CreateDommagePayload,
  Dommage,
  DommageDetail,
  UpdateDommagePayload,
} from '@/lib/types/dommages';

export async function listDommages(): Promise<Dommage[]> {
  const data = await createClient().get('api/ontology/dommages').json();
  return dommagesListSchema.parse(data);
}

export async function getDommage(id: string): Promise<DommageDetail> {
  const data = await createClient()
    .get(`api/ontology/dommages/${encodeURIComponent(id)}`)
    .json();
  return dommageDetailSchema.parse(data);
}

export async function createDommage(
  payload: CreateDommagePayload
): Promise<OntologyEntityCreatedResponse> {
  const data = await createClient()
    .post('api/ontology/dommages', { json: payload })
    .json();
  return ontologyEntityCreatedResponseSchema.parse(data);
}

export async function updateDommage(
  id: string,
  payload: UpdateDommagePayload
): Promise<boolean> {
  const data = await createClient()
    .put(`api/ontology/dommages/${encodeURIComponent(id)}`, {
      json: payload,
    })
    .json();
  return booleanResponseSchema.parse(data);
}

export async function deleteDommage(id: string): Promise<boolean> {
  const data = await createClient()
    .delete(`api/ontology/dommages/${encodeURIComponent(id)}`)
    .json();
  return booleanResponseSchema.parse(data);
}
