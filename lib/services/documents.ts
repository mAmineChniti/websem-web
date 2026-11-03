import {
  booleanResponseSchema,
  ontologyEntityCreatedResponseSchema,
} from '@/lib/schemas/api';
import {
  documentDetailSchema,
  documentsListSchema,
} from '@/lib/schemas/documents';
import { createClient } from '@/lib/services/client';
import type { OntologyEntityCreatedResponse } from '@/lib/types/api';
import type {
  CreateDocumentPayload,
  DocumentDetail,
  DocumentRecord,
  UpdateDocumentPayload,
} from '@/lib/types/documents';

export async function listDocuments(): Promise<DocumentRecord[]> {
  const data = await createClient().get('api/ontology/documents').json();
  return documentsListSchema.parse(data);
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const data = await createClient()
    .get(`api/ontology/documents/${encodeURIComponent(id)}`)
    .json();
  return documentDetailSchema.parse(data);
}

export async function createDocument(
  payload: CreateDocumentPayload
): Promise<OntologyEntityCreatedResponse> {
  const data = await createClient()
    .post('api/ontology/documents', { json: payload })
    .json();
  return ontologyEntityCreatedResponseSchema.parse(data);
}

export async function updateDocument(
  id: string,
  payload: UpdateDocumentPayload
): Promise<boolean> {
  const data = await createClient()
    .put(`api/ontology/documents/${encodeURIComponent(id)}`, {
      json: payload,
    })
    .json();
  return booleanResponseSchema.parse(data);
}

export async function deleteDocument(id: string): Promise<boolean> {
  const data = await createClient()
    .delete(`api/ontology/documents/${encodeURIComponent(id)}`)
    .json();
  return booleanResponseSchema.parse(data);
}
