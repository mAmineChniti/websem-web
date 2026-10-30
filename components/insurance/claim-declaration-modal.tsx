'use client';

import React, { useState } from 'react';
import { X, AlertOctagon, Upload, CheckCircle2, ShieldAlert, Calendar, Home } from 'lucide-react';
import { Property, Claim } from '@/lib/insurance-data';

interface ClaimDeclarationModalProps {
  isOpen: boolean;
  properties: Property[];
  onClose: () => void;
  onSubmit: (newClaim: Claim) => void;
}

export function ClaimDeclarationModal({
  isOpen,
  properties,
  onClose,
  onSubmit,
}: ClaimDeclarationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [type, setType] = useState<Claim['type']>('Dégât des eaux');
  const [dateIncident, setDateIncident] = useState('2026-10-29');
  const [estimatedCost, setEstimatedCost] = useState('1200');
  const [severity, setSeverity] = useState<Claim['severity']>('Moyenne');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProperty = properties.find((p) => p.id === propertyId) || properties[0];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    } else {
      const generatedClaim: Claim = {
        id: `clm-${Date.now()}`,
        claimNumber: `SIN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        propertyId: selectedProperty.id,
        propertyName: `${selectedProperty.name} (${selectedProperty.city})`,
        type,
        dateReported: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        dateIncident: new Date(dateIncident).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        status: 'Déclaré',
        estimatedCost: Number(estimatedCost) || 800,
        deductible: 150,
        description: description || 'Sinistre déclaré via le portail assuré en ligne.',
        severity,
        expertAssigned: 'En cours d’attribution sous 24h',
      };
      onSubmit(generatedClaim);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <AlertOctagon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif">Déclaration de Sinistre Habitation</h2>
              <p className="text-xs text-amber-100">Prise en charge rapide et assistance 24/7</p>
            </div>
          </div>

          {/* Stepper dots */}
          <div className="mt-4 flex items-center justify-between text-xs text-amber-100 font-medium">
            <span className={step >= 1 ? 'font-bold text-white underline underline-offset-4' : 'opacity-70'}>
              1. Logement & Nature
            </span>
            <span>&rarr;</span>
            <span className={step >= 2 ? 'font-bold text-white underline underline-offset-4' : 'opacity-70'}>
              2. Dégâts & Description
            </span>
            <span>&rarr;</span>
            <span className={step >= 3 ? 'font-bold text-white underline underline-offset-4' : 'opacity-70'}>
              3. Justificatifs & Synthèse
            </span>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleNext} className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Logement concerné par le sinistre
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.address}, {p.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Type de sinistre
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    'Dégât des eaux',
                    'Incendie',
                    'Vol & Vandalisme',
                    'Bris de glace',
                    'Catastrophe Naturelle',
                    'Tempête',
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t as any)}
                      className={`rounded-xl border p-2.5 text-xs font-medium text-left transition-all ${
                        type === t
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200 ring-1 ring-amber-500'
                          : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Date de survenance de l'incident
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="date"
                    required
                    value={dateIncident}
                    onChange={(e) => setDateIncident(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Rappel : Vous disposez de 5 jours ouvrés (2 jours pour le vol) pour déclarer le sinistre.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Gravité estimée
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Faible', 'Moyenne', 'Critique'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`rounded-xl border p-2 text-xs font-medium text-center transition-all ${
                        severity === sev
                          ? 'border-red-500 bg-red-50 text-red-900 font-semibold dark:border-red-500 dark:bg-red-950/40 dark:text-red-200 ring-1 ring-red-500'
                          : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Estimation indicative du préjudice (€)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="ex: 1500"
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Circonstances détaillées du sinistre
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez précisément ce qui s’est passé (ex: Fuite d’eau constatée sous l’évier de la cuisine ayant abîmé le parquet flottant)..."
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-700 dark:bg-zinc-800/50 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Logement :</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedProperty.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nature :</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Date incident :</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{dateIncident}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Franchise contractuelle :</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">150 €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Estimation préjudice :</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{estimatedCost} €</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Photos, devis ou constats amiables (optionnel)
                </label>
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 p-4 text-center hover:border-amber-500 dark:border-zinc-700 dark:hover:border-amber-500 transition-colors cursor-pointer bg-white dark:bg-zinc-800">
                  <Upload className="h-6 w-6 text-zinc-400 mb-1" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {fileName ? (
                      <span className="font-semibold text-emerald-600">{fileName} prêt à l'envoi</span>
                    ) : (
                      'Glissez-déposez vos photos ou cliquez pour parcourir'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFileName('constat_degat_des_eaux_photos.zip')}
                    className="mt-1 text-[11px] text-amber-600 underline font-medium"
                  >
                    Ajouter un exemple de photos dégâts
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Un expert de notre réseau agréé prendra contact sous 24h ouvrées pour organiser la visite si nécessaire.
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Précédent
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2 text-xs font-semibold text-white shadow hover:opacity-95 transition-opacity"
            >
              <span>{step === 3 ? 'Confirmer la Déclaration' : 'Suivant'}</span>
              {step === 3 && <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
