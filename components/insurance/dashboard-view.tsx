'use client';

import React from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  Home, 
  CloudSun, 
  FileCheck2, 
  ArrowUpRight, 
  TrendingUp, 
  PlusCircle, 
  Clock, 
  Calendar,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Bot
} from 'lucide-react';
import { Property, Claim, Contract, ClimateRisk } from '@/lib/insurance-data';

interface DashboardViewProps {
  properties: Property[];
  claims: Claim[];
  contracts: Contract[];
  climateRisks: ClimateRisk[];
  onSelectTab: (tab: string) => void;
  openClaimModal: () => void;
  openAddPropertyModal: () => void;
}

export function DashboardView({
  properties,
  claims,
  contracts,
  climateRisks,
  onSelectTab,
  openClaimModal,
  openAddPropertyModal,
}: DashboardViewProps) {
  const activeClaims = claims.filter((c) => c.status !== 'Clos');
  const totalMonthlyPremium = contracts.reduce((acc, c) => acc + c.monthlyPremium, 0);
  const totalInsuredValue = properties.reduce((acc, p) => acc + p.insuredValue, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-zinc-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            <span>Portail Intelligent d'Assurance Habitation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
            Bonjour Alexandre, vos habitations sont sous haute protection.
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Vos {properties.length} logements sont couverts. {activeClaims.length} dossier de sinistre est en cours d'expertise avec intervention d'un artisan agréé sous 48h.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={openClaimModal}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md hover:bg-amber-400 transition-colors"
            >
              <AlertOctagon className="h-4 w-4" />
              <span>Déclarer un sinistre</span>
            </button>
            <button
              onClick={() => onSelectTab('assistant')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-colors border border-white/20"
            >
              <Bot className="h-4 w-4 text-emerald-300" />
              <span>Interroger l'Assistant IA</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative background circle */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-4 hidden lg:block opacity-20">
          <ShieldCheck className="h-44 w-44 text-white" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div 
          onClick={() => onSelectTab('properties')}
          className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Logements Couverts</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Home className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{properties.length}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">100% Actifs</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {(totalInsuredValue).toLocaleString('fr-FR')} € de valeur totale garantie
          </p>
        </div>

        {/* KPI 2 */}
        <div 
          onClick={() => onSelectTab('claims')}
          className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sinistres en cours</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{activeClaims.length}</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Expertise active</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {claims.length} dossiers au total (historique 2 ans)
          </p>
        </div>

        {/* KPI 3 */}
        <div 
          onClick={() => onSelectTab('climate')}
          className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Indice Climat & Zones</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
              <CloudSun className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Vigilance</span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Jaune (Gironde)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Risque retrait-gonflement des argiles sous surveillance
          </p>
        </div>

        {/* KPI 4 */}
        <div 
          onClick={() => onSelectTab('contracts')}
          className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cotisation Mensuelle</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalMonthlyPremium.toFixed(2)} €
            </span>
            <span className="text-xs text-zinc-500">/ mois</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Prochain prélèvement le 05 du mois
          </p>
        </div>
      </div>

      {/* Main Grid: Live Claims + Climate Risk Radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Claims & Follow-up (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                Dossiers de Sinistres en Traitement
              </h2>
              <p className="text-xs text-zinc-500">Mise à jour en temps réel des étapes de prise en charge</p>
            </div>
            <button
              onClick={() => onSelectTab('claims')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              <span>Voir tout l'historique</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {claims.slice(0, 2).map((claim) => (
              <div
                key={claim.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {claim.claimNumber}
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {claim.propertyName}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      claim.status === 'Indemnisé'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : claim.status === 'Expertise en cours'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Nature du sinistre</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{claim.type}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Date déclaration</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{claim.dateReported}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Estimation / Indemnisation</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {claim.indemnifiedAmount ? `${claim.indemnifiedAmount} € versés` : `${claim.estimatedCost} € (en cours)`}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  {claim.description}
                </p>

                {claim.expertAssigned && (
                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>{claim.expertAssigned}</span>
                    </span>
                    <button 
                      onClick={() => onSelectTab('claims')}
                      className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      Détails & Échanges &rarr;
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Climate & Risk Alerts (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                Vigilance Météo & Climat
              </h2>
              <p className="text-xs text-zinc-500">Alertes sur vos zones assurées</p>
            </div>
            <button
              onClick={() => onSelectTab('climate')}
              className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Carte des risques
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            {/* Alert badge */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Alerte Gironde (Bordeaux)</span>
              </div>
              <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300">
                Rafales à 75 km/h prévues cette nuit. Pensez à fermer vos volets et sécuriser le mobilier de jardin.
              </p>
            </div>

            {/* Quick Risk breakdown */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                Exposition aux aléas naturels :
              </span>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-zinc-500">Retrait-gonflement des argiles (RGA)</span>
                    <span className="font-semibold text-amber-600">Élevé (74%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-1.5 rounded-full bg-amber-500" style={{ width: '74%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-zinc-500">Inondation / Débordement de cours d'eau</span>
                    <span className="font-semibold text-emerald-600">Modéré (45%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: '45%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-zinc-500">Tempête & Vents violents</span>
                    <span className="font-semibold text-teal-600">Sous surveillance (50%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-1.5 rounded-full bg-teal-500" style={{ width: '50%' }} />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('climate')}
              className="w-full rounded-xl bg-zinc-100 py-2 text-center text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Consulter les conseils de prévention
            </button>
          </div>
        </div>
      </div>

      {/* Insured Properties Quick Carousel/List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
              Vos Logements sous Contrat
            </h2>
            <p className="text-xs text-zinc-500">Protection incendie, dégât des eaux, vol et bris de glace</p>
          </div>
          <button
            onClick={openAddPropertyModal}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Ajouter une habitation</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {properties.map((property) => (
            <div
              key={property.id}
              onClick={() => onSelectTab('properties')}
              className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {property.type}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Couvert
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{property.name}</h3>
                <p className="text-xs text-zinc-500">{property.address}, {property.city}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                <div>
                  <span className="text-zinc-400 block">Surface</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{property.surface} m²</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Pièces</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{property.rooms} p.</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Risque</span>
                  <span className={`font-semibold ${
                    property.climateRiskLevel === 'Élevé' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {property.climateRiskLevel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
