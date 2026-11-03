export interface Contrat {
  contrat: string;
  typeContrat: string;
  numeroContrat: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  montantPrime: string | null;
  assure: string | null;
  habitation?: string | null;
  garanties?: string | null;
  beneficiaire?: string | null;
  franchise?: string | null;
}

export type ContratType =
  'Tous' | 'ContratProprietaire' | 'ContratLocataire' | 'ContratCopropriete';

export interface ContratsViewUser {
  name: string;
  email: string;
  isConnected: boolean;
  role: string;
  ontology_id?: string;
}

export interface CreateContratPayload {
  type?: string;
  numeroContrat: string;
  dateDebut: string;
  dateFin: string;
  montantPrime: number;
  assure?: string;
  habitation?: string | null;
  garanties?: string | null;
  beneficiaire?: string | null;
  franchise?: number;
}

export type UpdateContratPayload = Partial<CreateContratPayload>;
