'use client';

import React, { useState } from 'react';
import { 
  AlertOctagon, 
  PlusCircle, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Phone, 
  AlertTriangle,
  ChevronDown,
  Upload,
  Calendar
} from 'lucide-react';
import { Claim } from '@/lib/insurance-data';

interface ClaimsViewProps {
  claims: Claim[];
  openClaimModal: () => void;
}

export function ClaimsView({ claims, openClaimModal }: ClaimsViewProps) {
  const [filter, setFilter] = useState<'Tous' | 'En cours' | 'Indemnisé' | 'Clos'>('Tous');
  const [search, setSearch] = useState('');

  const filteredClaims = claims.filter((c) => {
    const matchesFilter =
      filter === 'Tous'
        ? true
        : filter === 'En cours'
        ? c.status === 'Déclaré' || c.status === 'Expertise en cours' || c.status === 'Validation devis'
        : c.status === filter;

    const matchesSearch =
      c.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-serif">
                Gestion des Sinistres Habitation
              </h1>
              <p className="text-xs text-zinc-500">
                Déclarez, suivez les expertises et consultez les indemnisations en direct
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openClaimModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:opacity-95 transition-opacity"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Déclarer un nouveau sinistre</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['Tous', 'En cours', 'Indemnisé', 'Clos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === tab
                  ? 'bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dossier, adresse..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Aucun sinistre trouvé
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Vos habitations ne présentent aucun dommage correspondant à cette sélection.
            </p>
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {claim.claimNumber}
                    </span>
                    <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {claim.type}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                        claim.severity === 'Critique'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : claim.severity === 'Moyenne'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      Gravité {claim.severity}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{claim.propertyName}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      claim.status === 'Indemnisé'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : claim.status === 'Expertise en cours'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : claim.status === 'Clos'
                        ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>
              </div>

              {/* Progress Timeline Tracker */}
              <div className="py-2">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Étape du dossier
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                    <span className="block font-bold">1. Déclaré</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{claim.dateReported}</span>
                  </div>
                  <div className={`rounded-xl border p-2 ${
                    claim.status === 'Expertise en cours' || claim.status === 'Validation devis' || claim.status === 'Indemnisé' || claim.status === 'Clos'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-800'
                  }`}>
                    <span className="block font-bold">2. Expertise</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Rapport chiffré</span>
                  </div>
                  <div className={`rounded-xl border p-2 ${
                    claim.status === 'Validation devis' || claim.status === 'Indemnisé' || claim.status === 'Clos'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-800'
                  }`}>
                    <span className="block font-bold">3. Accord Devis</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Artisan agréé</span>
                  </div>
                  <div className={`rounded-xl border p-2 ${
                    claim.status === 'Indemnisé' || claim.status === 'Clos'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-800'
                  }`}>
                    <span className="block font-bold">4. Virement</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Règlement sous 48h</span>
                  </div>
                </div>
              </div>

              {/* Description & Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="md:col-span-2 space-y-1">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Circonstances déclarées :</span>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl">
                    {claim.description}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/50 space-y-2">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">Détails Financiers</span>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Estimation :</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{claim.estimatedCost} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Franchise déduite :</span>
                    <span className="font-semibold text-amber-600">-{claim.deductible} €</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700 font-bold">
                    <span className="text-zinc-800 dark:text-zinc-100">Prise en charge :</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {claim.indemnifiedAmount ? `${claim.indemnifiedAmount} €` : `${claim.estimatedCost - claim.deductible} €`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expert & Actions */}
              {claim.expertAssigned && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Intervenant : <strong className="text-zinc-800 dark:text-zinc-200">{claim.expertAssigned}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg border border-zinc-200 px-3 py-1 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
                      Transmettre une facture
                    </button>
                    <button className="rounded-lg bg-emerald-50 px-3 py-1 font-semibold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                      Contacter l'expert
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
