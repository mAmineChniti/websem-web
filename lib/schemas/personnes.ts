import { z } from 'zod';

export const personneSchema = z
  .object({
    personne: z.string(),
    type: z.string(),
    nom: z.string().nullable(),
    prenom: z.string().nullable(),
    cin: z.string().nullable(),
    telephone: z.string().nullable(),
    adresse: z.string().nullable(),
  })
  .loose();

export const personnesListSchema = z.array(personneSchema);

export const createPersonnePayloadSchema = z.object({
  role: z.string(),
  nom: z.string(),
  prenom: z.string(),
  cin: z.string(),
  telephone: z.string(),
  adresse: z.string(),
});

export const updatePersonnePayloadSchema = z.object({
  nom: z.string().optional(),
  prenom: z.string().optional(),
  cin: z.string().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
});
