import { statsSchema } from '@/lib/schemas/stats';
import { createClient } from '@/lib/services/client';
import type { Stats } from '@/lib/types/stats';

export async function getStats(): Promise<Stats> {
  const data = await createClient().get('api/ontology/stats').json();
  return statsSchema.parse(data);
}
