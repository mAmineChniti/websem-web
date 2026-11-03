export interface Dommage {
  dommage: string;
  typeDommage: string;
  description: string | null;
  niveauGravite: string | null;
  valeurBien: string | null;
  associeSinistre: string | null;
}

/** `getDommage` returns an empty object when the entity does not exist. */
export type DommageDetail = Partial<Dommage>;

export interface CreateDommagePayload {
  id?: string;
  type?: string;
  description?: string;
  niveauGravite?: string;
  valeurBien?: number;
  associeSinistre?: string;
}

export interface UpdateDommagePayload {
  typeDommage?: string;
  description?: string;
  niveauGravite?: string;
  valeurBien?: number;
  associeSinistre?: string;
}
