import { z } from 'zod';

export const habitationSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  type: z.enum(['Maison', 'Appartement', 'Studio', 'Villa']),
  adresseBien: z.string(),
  superficie: z.number(),
  valeurBien: z.number().optional(),
  assure: z.string(),
});

export const habitationsListSchema = z.array(habitationSchema);

export const habitationFormSchema = z.object({
  type: z.enum(['Maison', 'Appartement', 'Studio', 'Villa']),
  adresseBien: z.string().trim().min(1, "L'adresse du bien est requise"),
  superficie: z
    .string()
    .refine((value) => Number.parseFloat(value) > 0, 'Superficie requise'),
  valeurBien: z
    .string()
    .optional()
    .refine(
      (value) => !value || Number.parseFloat(value) >= 0,
      'valeurBien doit être positive'
    ),
});
