import { healthResponseSchema } from '@/lib/schemas/health';
import { createClient } from '@/lib/services/client';
import type { HealthResponse } from '@/lib/types/health';

export async function getHealth(): Promise<HealthResponse> {
  const data = await createClient().get('api/health').json();
  return healthResponseSchema.parse(data);
}
