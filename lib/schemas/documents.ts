import { z } from 'zod';

export const documentRecordSchema = z.object({
  document: z.string(),
  typeDocument: z.string(),
  nomFichier: z.string().nullable(),
  dateUpload: z.string().nullable(),
  associeSinistre: z.string().nullable(),
});

export const documentsListSchema = z.array(documentRecordSchema);

export const documentDetailSchema = documentRecordSchema.partial();

export const createDocumentPayloadSchema = z.object({
  id: z.string().optional(),
  type: z.string().default('RapportExpertise'),
  nomFichier: z.string().optional(),
  dateUpload: z.string().optional(),
  associeSinistre: z.string().optional(),
});

export const updateDocumentPayloadSchema = z.object({
  typeDocument: z.string().optional(),
  nomFichier: z.string().optional(),
  dateUpload: z.string().optional(),
  associeSinistre: z.string().optional(),
});
