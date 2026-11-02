export interface Personne {
  personne: string;
  type: string;
  nom: string | null;
  prenom: string | null;
  cin: string | null;
  telephone: string | null;
  adresse: string | null;
}

export type PersonneRole =
  'Tous' | 'Assure' | 'Agent' | 'Expert' | 'Beneficiaire';

export interface PersonnesViewUser {
  name: string;
  email: string;
  isConnected: boolean;
  role: string;
  ontology_id?: string;
}

export interface CreatePersonnePayload {
  role: string;
  nom: string;
  prenom: string;
  cin: string;
  telephone: string;
  adresse: string;
}

export interface UpdatePersonnePayload {
  nom?: string;
  prenom?: string;
  cin?: string;
  telephone?: string;
  adresse?: string;
}

/** Body for PATCH /api/ontology/personnes/{id}/role. */
export interface UpdatePersonneRolePayload {
  new_role: string;
}
