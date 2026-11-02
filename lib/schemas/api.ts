import { z } from 'zod';

export const statusMessageResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
});

export const createEntityResponseSchema = statusMessageResponseSchema.extend({
  id: z.string(),
});

export const ontologyEntityCreatedResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  message: z.string(),
});

export const booleanResponseSchema = z.boolean();
