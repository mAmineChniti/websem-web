import { getShortLocation } from './habitations';

export interface Indemnisation {
  id: string;
  label?: string;
  type:
    'IndemnisationTotale' | 'IndemnisationPartielle' | 'IndemnisationRefusee';
  montantIndemnise: number;
  tauxIndemnisation: number;
  habitation: string;
  habitationLabel?: string;
  assure?: string;
  motifRefus?: string;
}

export interface CreateIndemnisationPayload {
  type: Indemnisation['type'];
  montantIndemnise: number;
  tauxIndemnisation: number;
  habitation: string;
  motifRefus?: string;
  label?: string;
  habitationLabel?: string;
}

export interface UpdateIndemnisationPayload {
  type?: Indemnisation['type'];
  montantIndemnise?: number;
  tauxIndemnisation?: number;
  habitation?: string;
  motifRefus?: string;
  label?: string;
  habitationLabel?: string;
}

export interface IndemnisationStats {
  totalCount: number;
  sumMontantIndemnise: number;
  maxMontantIndemnise: number;
  countPartielle: number;
}

export interface IndemnisationsFilterParams {
  assureId?: string;
  search?: string;
  type?: string;
  tauxMin?: number;
  tauxMax?: number;
  montantMin?: number;
  montantMax?: number;
  sortBy?: 'montantIndemnise' | 'tauxIndemnisation';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedIndemnisations {
  items: Indemnisation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sparqlQuery?: string;
}

/**
 * Construit un libellé lisible pour une indemnisation.
 * Format demandé : "Indemnisation <totale|partielle|refusée> <ville de l'habitation>"
 * Ex: "Indemnisation partielle Bardo"
 */
export function buildIndemnisationLabel(
  type: Indemnisation['type'],
  habitationLabelOrLocation?: string
): string {
  const typeMap: Record<Indemnisation['type'], string> = {
    IndemnisationTotale: 'totale',
    IndemnisationPartielle: 'partielle',
    IndemnisationRefusee: 'refusée',
  };
  const typeStr = typeMap[type] || 'partielle';
  const loc = habitationLabelOrLocation
    ? getShortLocation(habitationLabelOrLocation)
    : '';
  return loc ? `Indemnisation ${typeStr} ${loc}` : `Indemnisation ${typeStr}`;
}
