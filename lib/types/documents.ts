/** Ontology individual stored under the Document classes. */
export interface DocumentRecord {
  document: string;
  typeDocument: string;
  nomFichier: string | null;
  dateUpload: string | null;
  associeSinistre: string | null;
}

/** `getDocument` returns an empty object when the entity does not exist. */
export type DocumentDetail = Partial<DocumentRecord>;

export interface CreateDocumentPayload {
  id?: string;
  type?: string;
  nomFichier?: string;
  dateUpload?: string;
  associeSinistre?: string;
}

export interface UpdateDocumentPayload {
  typeDocument?: string;
  nomFichier?: string;
  dateUpload?: string;
  associeSinistre?: string;
}
