export const USER_ROLES = [
  'Assure',
  'Agent',
  'Expert',
  'Beneficiaire',
  'Admin',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** User object returned by the backend (login, register and /auth/me). */
export interface AuthUser {
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  cin: string;
  telephone: string;
  adresse: string;
  ontology_id: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  cin: string;
  telephone: string;
  adresse: string;
  /** The backend always creates public registrations as `Assure`. */
  role?: UserRole;
}

export interface UserSession {
  name: string;
  email: string;
  isConnected: boolean;
  role: UserRole;
  token?: string;
  ontology_id?: string;
}
