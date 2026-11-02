export interface OntologyClass {
  classe: string;
  superClasse: string | null;
}

export interface OntologyClassInstance {
  individu: string;
  nom: string | null;
  prenom: string | null;
}

export interface OntologyProperty {
  propriete: string;
}

/** Response returned by POST /api/ontology/reload. */
export interface ReloadOntologyResponse {
  message: string;
  status: 'ok';
  triples: number;
  path: string;
}
