import { z } from 'zod';

export const garantieFormSchema = z.object({
  type: z.string().min(1),
  nomGarantie: z.string().optional(),
  plafondGarantie: z.string().optional(),
  franchise: z.string().optional(),
});

export const sinistreFormSchema = z.object({
  type: z.string().min(1),
  dateSinistre: z.string().min(1, 'Date requise'),
  lieuSinistre: z.string().optional(),
  descriptionSinistre: z.string().optional(),
  statut: z.string().optional(),
  causeSinistre: z.string().optional(),
  contrat: z.string().optional(),
});

const contractFields = {
  type: z.string().min(1, 'Type de contrat requis'),
  numeroContrat: z.string().trim().min(1, 'Numéro de contrat requis'),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
  montantPrime: z
    .string()
    .refine(
      (value) => Number.parseFloat(value) > 0,
      'La prime doit être supérieure à 0'
    ),
  assure: z.string().min(1, 'Assuré requis'),
  habitation: z.string().min(1, 'Habitation requise'),
  garanties: z.array(z.string()).min(1, 'Sélectionnez au moins une garantie'),
  beneficiaire: z.string().optional(),
  franchise: z
    .string()
    .refine(
      (value) => value === '' || Number.parseFloat(value) >= 0,
      'La franchise doit être positive'
    ),
};

export const contratFormSchema = z
  .object(contractFields)
  .refine((value) => new Date(value.dateFin) > new Date(value.dateDebut), {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['dateFin'],
  });

export const personneFormSchema = z.object({
  role: z.string().min(1, 'Rôle requis'),
  nom: z.string().trim().min(1, 'Nom requis'),
  prenom: z.string().trim().min(1, 'Prénom requis'),
  cin: z.string().trim().min(1, 'CIN requis'),
  telephone: z.string().trim().min(1, 'Téléphone requis'),
  adresse: z.string().trim().min(1, 'Adresse requise'),
});

export const editPersonneFormSchema = personneFormSchema.omit({ role: true });

export const promotionFormSchema = z.object({
  message: z.string().optional(),
});
