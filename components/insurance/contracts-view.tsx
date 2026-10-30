'use client';

import React, { useState } from 'react';
import { 
  FileCheck2, 
  Download, 
  Check, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Calendar,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { Contract } from '@/lib/insurance-data';

interface ContractsViewProps {
  contracts: Contract[];
}

export function ContractsView({ contracts }: ContractsViewProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeContractId, setActiveContractId] = useState(contracts[0]?.id || '');

  const activeContract = contracts.find((c) => c.id === activeContractId) || contracts[0];

  const handleDownloadAttestation = (contract: Contract) => {
    setDownloadingId(contract.id);
    setTimeout(() => {
      setDownloadingId(null);
      // Simulate file download
      const element = document.createElement('a');
      const file = new Blob([
        `ATTESTATION D'ASSURANCE MULTIRISQUE HABITATION\n` +
        `Numéro de Police : ${contract.policyNumber}\n` +
        `Logement Assuré : ${contract.propertyName}\n` +
        `Formule : ${contract.planName}\n` +
        `Plafond Biens Immobiliers : ${contract.coverageLimits.propertyDamage} €\n` +
        `Plafond Mobilier : ${contract.coverageLimits.personalProperty} €\n` +
        `Responsabilité Civile Vie Privée : ${contract.coverageLimits.civilLiability} €\n` +
        `Délivrée le : ${new Date().toLocaleDateString('fr-FR')}\n` +
        `Hestia Assur - Compagnie d'Assurance Agréée ACPR`
      ], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `Attestation_${contract.policyNumber}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-serif">
              Contrats & Garanties Habitation
            </h1>
            <p className="text-xs text-zinc-500">
              Consultez vos polices, franchises, plafonds d'indemnisation et téléchargez vos attestations
            </p>
          </div>
        </div>

        <button
          onClick={() => handleDownloadAttestation(activeContract)}
          disabled={downloadingId !== null}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>{downloadingId ? 'Génération...' : "Télécharger l'attestation (PDF)"}</span>
        </button>
      </div>

      {/* Contract selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contracts.map((c) => {
          const isSelected = c.id === activeContract?.id;
          return (
            <div
              key={c.id}
              onClick={() => setActiveContractId(c.id)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow dark:border-blue-500 dark:bg-blue-950/20'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {c.policyNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  En vigueur
                </span>
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{c.propertyName}</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{c.planName}</p>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Cotisation :</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {c.monthlyPremium.toFixed(2)} € / mois
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Coverage Matrix */}
      {activeContract && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                  {activeContract.planName}
                </h2>
                <span className="font-mono text-xs text-zinc-500">({activeContract.policyNumber})</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Valable du {activeContract.startDate} au {activeContract.renewalDate} (Tacite reconduction)
              </p>
            </div>

            <button
              onClick={() => handleDownloadAttestation(activeContract)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>Attestation officielle</span>
            </button>
          </div>

          {/* Coverage Limits Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              Plafonds de Garanties et Indemnisations
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1">
                <span className="text-zinc-500 text-xs block">Dommages Immobiliers (Bâtiment)</span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {(activeContract.coverageLimits.propertyDamage).toLocaleString('fr-FR')} €
                </span>
                <span className="text-[11px] text-emerald-600 block">Reconstruction à valeur d'expert</span>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1">
                <span className="text-zinc-500 text-xs block">Biens Mobiliers & Meubles</span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {(activeContract.coverageLimits.personalProperty).toLocaleString('fr-FR')} €
                </span>
                <span className="text-[11px] text-emerald-600 block">Indemnisation rééquipement à neuf</span>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1">
                <span className="text-zinc-500 text-xs block">Responsabilité Civile Vie Privée</span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {(activeContract.coverageLimits.civilLiability).toLocaleString('fr-FR')} €
                </span>
                <span className="text-[11px] text-emerald-600 block">Couvre tous les membres du foyer</span>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1">
                <span className="text-zinc-500 text-xs block">Relogement d'Urgence / Gardiennage</span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Jusqu'à {(activeContract.coverageLimits.relocationCost).toLocaleString('fr-FR')} €
                </span>
                <span className="text-[11px] text-zinc-400 block">Hôtel et transport pris en charge</span>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1">
                <span className="text-zinc-500 text-xs block">Protection Juridique Habitation</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {activeContract.coverageLimits.legalProtection ? 'Incluse' : 'En option'}
                </span>
                <span className="text-[11px] text-zinc-400 block">Litiges bailleur / voisinage / travaux</span>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1">
                <span className="text-zinc-500 text-xs block">Franchise générale par sinistre</span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {activeContract.deductibleGeneral} €
                </span>
                <span className="text-[11px] text-amber-600 block">Fixe quel que soit le montant</span>
              </div>
            </div>
          </div>

          {/* Options souscrites */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              Options Spécifiques Souscrites
            </span>
            <div className="flex flex-wrap gap-2">
              {activeContract.options.map((opt, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
