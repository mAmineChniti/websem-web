import {
  createPromotionResponseSchema,
  promotionsListSchema,
  reviewPromotionResponseSchema,
} from '@/lib/schemas/promotions';
import { createClient } from '@/lib/services/client';
import type {
  CreatePromotionPayload,
  CreatePromotionResponse,
  Promotion,
  ReviewPromotionResponse,
} from '@/lib/types/promotions';

export async function listPromotions(): Promise<Promotion[]> {
  const data = await createClient().get('api/ontology/promotions').json();
  return promotionsListSchema.parse(data);
}

export async function createPromotion(
  payload: CreatePromotionPayload
): Promise<CreatePromotionResponse> {
  const data = await createClient()
    .post('api/ontology/promotions', { json: payload })
    .json();
  return createPromotionResponseSchema.parse(data);
}

export async function approvePromotion(
  id: string
): Promise<ReviewPromotionResponse> {
  const data = await createClient()
    .patch(`api/ontology/promotions/${encodeURIComponent(id)}/approve`)
    .json();
  return reviewPromotionResponseSchema.parse(data);
}

export async function rejectPromotion(
  id: string
): Promise<ReviewPromotionResponse> {
  const data = await createClient()
    .patch(`api/ontology/promotions/${encodeURIComponent(id)}/reject`)
    .json();
  return reviewPromotionResponseSchema.parse(data);
}

export async function reviewPromotion(
  id: string,
  action: 'approve' | 'reject'
): Promise<ReviewPromotionResponse> {
  return action === 'approve' ? approvePromotion(id) : rejectPromotion(id);
}
