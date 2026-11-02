/** Response returned by mutations that update or delete an ontology entity. */
export interface StatusMessageResponse {
  status: string;
  message: string;
}

/** Response returned when a person or contract is created. */
export interface CreateEntityResponse extends StatusMessageResponse {
  id: string;
}

/** Response returned by sinistre/garantie/document/dommage creation. */
export interface OntologyEntityCreatedResponse {
  id: string;
  type: string;
  message: string;
}
export type ApiRecord = Record<string, string | number | boolean | null>;
