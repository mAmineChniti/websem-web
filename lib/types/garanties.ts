export interface Garantie {
  garantie: string;
  typeGarantie: string;
  nomGarantie: string | null;
  plafondGarantie: string | null;
  tauxFranchise: string | null;
}

/** `getGarantie` returns an empty object when the entity does not exist. */
export type GarantieDetail = Partial<Garantie>;

export interface CreateGarantiePayload {
  id?: string;
  type?: string;
  nomGarantie?: string;
  plafondGarantie?: number;
  franchise?: number;
}

export interface UpdateGarantiePayload {
  typeGarantie?: string;
  nomGarantie?: string;
  plafondGarantie?: number;
  franchise?: number;
}

export const GARANTIE_TYPES = [
  'GarantieIncendie',
  'GarantieDegatDesEaux',
  'GarantieBrisDeGlace',
  'GarantieCatastropheNaturelle',
  'GarantieResponsabiliteCivile',
  'GarantieVol',
] as const;

export type GarantieType = (typeof GARANTIE_TYPES)[number];

export interface GarantieFormValues {
  type: string;
  nomGarantie?: string;
  plafondGarantie?: string;
  franchise?: string;
}
