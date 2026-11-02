import { z } from 'zod';

import { userRoleSchema } from '@/lib/schemas/auth';

export const promotionStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
]);

export const promotionSchema = z.object({
  id: z.string(),
  ontology_id: z.string(),
  current_name: z.string(),
  requested_role: userRoleSchema,
  message: z.string(),
  status: promotionStatusSchema,
  created_at: z.string(),
});

export const promotionsListSchema = z.array(promotionSchema);

export const createPromotionPayloadSchema = z.object({
  ontology_id: z.string(),
  current_name: z.string(),
  requested_role: userRoleSchema,
  message: z.string().default(''),
});

export const createPromotionResponseSchema = z.object({
  status: z.literal('submitted'),
  id: z.string(),
});

export const reviewPromotionResponseSchema = z.union([
  z.object({
    status: z.literal('approved'),
    new_role: userRoleSchema,
  }),
  z.object({
    status: z.literal('rejected'),
  }),
]);
