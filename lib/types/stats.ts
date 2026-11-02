/** Response returned by GET /api/ontology/stats. */
export interface Stats {
  module: string;
  personnes_count: number;
  contrats_count: number;
  assures_count: number;
  agents_count: number;
  experts_count: number;
  beneficiaires_count: number;
  classes_count: number;
  total_triples: number;
  sparql_examples_count: number;
  ontology_uri: string;
  rdf_format: string;
}
