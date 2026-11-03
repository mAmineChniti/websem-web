import {
  dommageDetailSchema,
  dommageMutationResponseSchema,
  dommagesListSchema,
} from '@/lib/schemas/dommages';
import { createClient } from '@/lib/services/client';
import type {
  CreateDommagePayload,
  Dommage,
  DommageDetail,
  UpdateDommagePayload,
} from '@/lib/types/dommages';

export async function listDommages(): Promise<Dommage[]> {
  const data = await createClient().get('api/dommages').json();
  return dommagesListSchema.parse(data);
}

export async function getDommage(id: string): Promise<DommageDetail> {
  const data = await createClient()
    .get(`api/dommages/${encodeURIComponent(id)}`)
    .json();
  return dommageDetailSchema.parse(data);
}

export async function createDommage(
  payload: CreateDommagePayload
): Promise<string | undefined> {
  const data = await createClient()
    .post('api/dommages', { json: payload })
    .json();
  const parsed = dommageMutationResponseSchema.parse(data);
  return parsed.id;
}

export async function updateDommage(
  id: string,
  payload: UpdateDommagePayload
): Promise<void> {
  const data = await createClient()
    .put(`api/dommages/${encodeURIComponent(id)}`, { json: payload })
    .json();
  dommageMutationResponseSchema.parse(data);
}

export async function deleteDommage(id: string): Promise<void> {
  const data = await createClient()
    .delete(`api/dommages/${encodeURIComponent(id)}`)
    .json();
  dommageMutationResponseSchema.parse(data);
}
