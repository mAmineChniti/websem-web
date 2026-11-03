export interface Dommage {
  id: string;
  type: string;
  description: string;
  montant: number;
  gravite: string;
  sinistre: string | null;
  date: string | null;
  lieu: string | null;
}

/** `getDommage` returns an empty object when the entity does not exist. */
export type DommageDetail = Partial<Dommage>;

export interface CreateDommagePayload {
  type_dommage?: string;
  description: string;
  montant?: number;
  gravite?: string;
  sinistre_id?: string;
  date?: string;
  lieu?: string;
}

export interface UpdateDommagePayload {
  type_dommage?: string;
  description?: string;
  montant?: number;
  gravite?: string;
  sinistre_id?: string;
  date?: string;
  lieu?: string;
}

export const TYPES_DOMMAGE = [
  'DommageMateriel',
  'DommageCorporel',
  'DommageImmateriel',
] as const;

export const NIVEAUX_GRAVITE = ['Faible', 'Moyen', 'Grave'] as const;
