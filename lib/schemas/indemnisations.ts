import { z } from 'zod';

export const indemnisationSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  type: z.enum([
    'IndemnisationTotale',
    'IndemnisationPartielle',
    'IndemnisationRefusee',
  ]),
  montantIndemnise: z.number(),
  tauxIndemnisation: z.number(),
  habitation: z.string(),
  habitationLabel: z.string().optional(),
  assure: z.string().optional(),
  motifRefus: z.string().optional(),
});

export const indemnisationsListSchema = z.array(indemnisationSchema);

export const indemnisationFormSchema = z
  .object({
    type: z.enum([
      'IndemnisationTotale',
      'IndemnisationPartielle',
      'IndemnisationRefusee',
    ]),
    montantIndemnise: z
      .string()
      .refine((value) => Number.parseFloat(value) >= 0, 'Montant requis'),
    tauxIndemnisation: z
      .string()
      .refine(
        (value) =>
          Number.parseFloat(value) >= 0 && Number.parseFloat(value) <= 100,
        'Le taux doit être compris entre 0 et 100'
      ),
    habitation: z.string().min(1, 'Habitation requise'),
    motifRefus: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const montant = Number.parseFloat(data.montantIndemnise);
    const taux = Number.parseFloat(data.tauxIndemnisation);

    if (data.type === 'IndemnisationTotale' && taux !== 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['tauxIndemnisation'],
        message:
          'Une indemnisation totale doit avoir un taux de remboursement de 100 %.',
      });
    }

    if (data.type === 'IndemnisationPartielle' && (taux <= 0 || taux >= 100)) {
      ctx.addIssue({
        code: 'custom',
        path: ['tauxIndemnisation'],
        message:
          'Une indemnisation partielle doit avoir un taux strictement entre 0 et 100 %.',
      });
    }

    if (data.type === 'IndemnisationRefusee') {
      if (montant !== 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['montantIndemnise'],
          message: 'Une indemnisation refusée doit avoir un montant de 0 DT.',
        });
      }
      if (!data.motifRefus || data.motifRefus.trim().length < 3) {
        ctx.addIssue({
          code: 'custom',
          path: ['motifRefus'],
          message:
            'Veuillez expliquer le motif du refus pour que l’assuré puisse corriger son dossier.',
        });
      }
    }
  });
