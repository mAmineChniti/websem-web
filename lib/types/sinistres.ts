export interface Sinistre {
  sinistre: string;
  typeSinistre: string;
  dateSinistre: string | null;
  lieuSinistre: string | null;
  descriptionSinistre: string | null;
  statut: string | null;
  dateDeclaration: string | null;
  causeSinistre: string | null;
  contrat: string | null;
  assure: string | null;
  assureNom: string | null;
}

/** `getSinistre` returns an empty object when the entity does not exist. */
export type SinistreDetail = Partial<Sinistre>;

export interface CreateSinistrePayload {
  type?: string;
  dateSinistre: string;
  lieuSinistre?: string;
  descriptionSinistre?: string;
  montantDomage?: number | undefined;
  contrat?: string;
  statut?: string;
  causeSinistre?: string | null;
}

export interface UpdateSinistrePayload {
  typeSinistre?: string;
  dateSinistre?: string;
  lieuSinistre?: string;
  descriptionSinistre?: string;
  montantDomage?: number;
  contrat?: string;
  statut?: string;
  causeSinistre?: string;
}

export const SINISTRE_TYPES = [
  'SinistreIncendie',
  'SinistreVol',
  'SinistreDegatDesEaux',
  'SinistreBrisDeGlace',
  'SinistreCatastropheNaturelle',
] as const;

export type SinistreType = (typeof SINISTRE_TYPES)[number];

export interface SinistreFormValues {
  type: string;
  dateSinistre: string;
  lieuSinistre?: string;
  descriptionSinistre?: string;
  statut?: string;
  causeSinistre?: string;
  contrat?: string;
}
