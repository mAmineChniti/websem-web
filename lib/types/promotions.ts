import type { UserRole } from '@/lib/types/auth';

export type PromotionStatus = 'pending' | 'approved' | 'rejected';

/** Promotion request stored by the backend in promotions.json. */
export interface Promotion {
  id: string;
  ontology_id: string;
  current_name: string;
  requested_role: UserRole;
  message: string;
  status: PromotionStatus;
  created_at: string;
}

export interface CreatePromotionPayload {
  ontology_id: string;
  current_name: string;
  requested_role: UserRole;
  message?: string;
}

export interface CreatePromotionResponse {
  status: 'submitted';
  id: string;
}

export type ReviewPromotionResponse =
  { status: 'approved'; new_role: UserRole } | { status: 'rejected' };
