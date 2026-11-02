import {
  ontologyClassesSchema,
  ontologyClassInstancesSchema,
  ontologyPropertiesSchema,
  reloadOntologyResponseSchema,
} from '@/lib/schemas/ontology';
import { createClient } from '@/lib/services/client';
import type {
  OntologyClass,
  OntologyClassInstance,
  OntologyProperty,
  ReloadOntologyResponse,
} from '@/lib/types/ontology';

export async function listOntologyClasses(): Promise<OntologyClass[]> {
  const data = await createClient().get('api/ontology/classes').json();
  return ontologyClassesSchema.parse(data);
}

export async function listClassInstances(
  className: string
): Promise<OntologyClassInstance[]> {
  const data = await createClient()
    .get(`api/ontology/classes/${encodeURIComponent(className)}/instances`)
    .json();
  return ontologyClassInstancesSchema.parse(data);
}

export async function listObjectProperties(): Promise<OntologyProperty[]> {
  const data = await createClient()
    .get('api/ontology/properties/object')
    .json();
  return ontologyPropertiesSchema.parse(data);
}

export async function listDatatypeProperties(): Promise<OntologyProperty[]> {
  const data = await createClient()
    .get('api/ontology/properties/datatype')
    .json();
  return ontologyPropertiesSchema.parse(data);
}

export async function reloadOntology(): Promise<ReloadOntologyResponse> {
  const data = await createClient().post('api/ontology/reload').json();
  return reloadOntologyResponseSchema.parse(data);
}
