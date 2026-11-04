export interface Habitation {
  id: string;
  label?: string;
  type: 'Maison' | 'Appartement' | 'Studio' | 'Villa';
  adresseBien: string;
  superficie: number;
  valeurBien?: number;
  assure: string;
}

export interface CreateHabitationPayload {
  type: Habitation['type'];
  adresseBien: string;
  superficie: number;
  valeurBien?: number;
  assure: string;
  label?: string;
}

export interface UpdateHabitationPayload {
  type?: Habitation['type'];
  adresseBien?: string;
  superficie?: number;
  valeurBien?: number;
  assure?: string;
  label?: string;
}

export interface HabitationStats {
  totalCount: number;
  avgSuperficie: number;
  sumValeurBien: number;
  maxValeurBien: number;
}

export interface HabitationsFilterParams {
  assureId?: string;
  search?: string;
  type?: string;
  superficieMin?: number;
  superficieMax?: number;
  valeurBienMin?: number;
  valeurBienMax?: number;
  sortBy?: 'superficie' | 'valeurBien' | 'adresseBien';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedHabitations {
  items: Habitation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sparqlQuery?: string;
}

/**
 * Extrait une ville ou adresse courte à partir d'une chaîne d'adresse complète.
 * Ex: "10 rue de la Liberté, Tunis" -> "Tunis"
 * Ex: "Bardo" -> "Bardo"
 */
export function getShortLocation(adresse: string): string {
  if (!adresse || !adresse.trim()) return '';
  const parts = adresse
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    return parts.at(-1) ?? parts[0];
  }
  return parts[0];
}

/**
 * Construit un libellé lisible pour une habitation.
 * Format demandé : "<Type> <ville ou adresse courte>" (ex: "Maison Bardo")
 */
export function buildHabitationLabel(type: string, adresse: string): string {
  const loc = getShortLocation(adresse);
  return loc ? `${type} ${loc}` : type;
}

/**
 * Génère un slug d'URI sans accents ni espaces ni caractères spéciaux.
 * Ex: "Maison Bardo" -> "Maison_Bardo"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    .replaceAll(/[^a-zA-Z0-9]+/g, '_')
    .replaceAll(/^_+|_+$/g, '');
}
