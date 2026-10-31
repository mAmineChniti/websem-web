'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileCheck2, 
  CreditCard, 
  Terminal, 
  ArrowUpRight, 
  PlusCircle, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Database
} from 'lucide-react';

interface DashboardViewProps {
  onSelectTab: (tab: string) => void;
  userRole?: string;
}

export function DashboardView({ onSelectTab, userRole }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [personnes, setPersonnes] = useState<any[]>([]);
  const [contrats, setContrats] = useState<any[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetch(`${apiUrl}/api/ontology/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch((e) => console.warn(e));

    fetch(`${apiUrl}/api/ontology/personnes`)
      .then((r) => r.json())
      .then((d) => setPersonnes(d.filter((p: any) => p.personne !== 'aPourAssure' && p.type !== 'ObjectProperty' && p.type !== 'RapportExpertise')))
      .catch((e) => console.warn(e));

    fetch(`${apiUrl}/api/ontology/contrats`)
      .then((r) => r.json())
      .then((d) => setContrats(d.filter((c: any) => c.contrat !== 'souscritContrat' && c.contrat !== 'numeroContrat' && c.typeContrat !== 'ObjectProperty' && c.typeContrat !== 'FunctionalProperty' && c.typeContrat !== 'DatatypeProperty')))
      .catch((e) => console.warn(e));
  }, []);

  const totalPrimes = contrats.reduce((acc, c) => acc + (parseFloat(c.montantPrime) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-zinc-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 border border-blue-400/30">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span>Hestia Assur — Système d'Assurance Habitation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
            Gestion Intelligente des Contrats & Souscripteurs
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Plateforme décisionnelle d'assurance habitation.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => onSelectTab('contrats')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition-colors"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Gérer les Contrats</span>
            </button>
            <button
              onClick={() => onSelectTab('personnes')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/20 transition-colors border border-white/20"
            >
              <Users className="h-4 w-4 text-blue-300" />
              <span>Voir les Personnes</span>
            </button>
            <button
              onClick={() => onSelectTab('sparql')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/60 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition-colors border border-indigo-400/30"
            >
              <Terminal className="h-4 w-4 text-indigo-300" />
              <span>Traducteur NLP & SPARQL</span>
            </button>
          </div>
        </div>

        <div className="absolute right-8 bottom-4 hidden lg:block opacity-10">
          <Database className="h-44 w-44 text-white" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Personnes / Profil */}
        <div 
          onClick={() => onSelectTab('personnes')}
          className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
              {userRole === 'Assure' ? 'Mon Dossier Client' : 'Personnes Ontologie'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {userRole === 'Assure' ? 'Actif' : stats?.personnes_count || personnes.length}
            </span>
            <span className="text-xs font-semibold text-blue-600">
              {userRole === 'Assure' ? 'Vérifié' : 'Individus'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {userRole === 'Assure' 
              ? 'Souscripteur conforme à l\'ontologie OWL' 
              : `Assurés (${stats?.assures_count || 1}), Agents (${stats?.agents_count || 1}), Experts (${stats?.experts_count || 1})`}
          </p>
        </div>

        {/* KPI 2 : Contrats */}
        <div 
          onClick={() => onSelectTab('contrats')}
          className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Contrats Souscrits</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats?.contrats_count || contrats.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600">Polices actives</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            ContratProprietaire, Locataire & Copropriété
          </p>
        </div>

        {/* KPI 3 : Primes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Primes Totales</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalPrimes.toLocaleString('fr-FR')} DT
            </span>
            <span className="text-xs text-zinc-400">/ an</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Attribut <code className="text-amber-600 font-mono">as:montantPrime</code>
          </p>
        </div>

        {/* KPI 4 : Ontologie Triples */}
        <div 
          onClick={() => onSelectTab('sparql')}
          className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Graphe RDF</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats?.total_triples || 398}
            </span>
            <span className="text-xs font-semibold text-purple-600">Triplets</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Moteur RDFlib & requêtes SPARQL
          </p>
        </div>
      </div>

      {/* Main Grid: Contracts & Persons Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contracts Preview */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                Contrats Référencés dans l'Ontologie
              </h2>
              <p className="text-xs text-zinc-500">Polices d'assurance habitation (Propriétaire, Locataire, Copropriété)</p>
            </div>
            <button
              onClick={() => onSelectTab('contrats')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {contrats.slice(0, 3).map((c, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {c.numeroContrat || c.contrat}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {c.typeContrat}
                    </span>
                  </div>
                  <span className="text-zinc-500 block mt-1">
                    Souscripteur : <strong>{c.assure || 'Assure1'}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 block text-sm">
                    {c.montantPrime ? `${c.montantPrime} DT` : '850 DT'}
                  </span>
                  <span className="text-[10px] text-zinc-400">Prime annuelle</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Persons Preview - Adapté selon le rôle */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                {userRole === 'Assure' ? 'Mon Profil Assuré' : 'Parties Prenantes & Acteurs de l\'Assurance'}
              </h2>
              <p className="text-xs text-zinc-500">
                {userRole === 'Assure' 
                  ? 'Vos informations personnelles déclarées dans l\'ontologie' 
                  : 'Sous-classes d\'acteurs qualifiés (Assuré, Agent, Expert, Bénéficiaire)'}
              </p>
            </div>
            <button
              onClick={() => onSelectTab('personnes')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>{userRole === 'Assure' ? 'Mon profil' : 'Voir tout'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {userRole === 'Assure' ? (
            /* Vue Assuré : carte de son propre profil uniquement */
            <div
              onClick={() => onSelectTab('personnes')}
              className="cursor-pointer rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-950 dark:bg-blue-950/30 flex items-center justify-between text-xs hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow">
                  {personnes.find((p: any) => p.personne.includes('Assure'))?.prenom?.[0] || 'A'}
                  {personnes.find((p: any) => p.personne.includes('Assure'))?.nom?.[0] || 'D'}
                </div>
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                    {personnes.find((p: any) => p.personne === 'Assure1')?.prenom || 'Karim'}{' '}
                    {personnes.find((p: any) => p.personne === 'Assure1')?.nom || 'BenAli'}
                  </span>
                  <span className="text-zinc-500 block mt-0.5">
                    CIN : {personnes.find((p: any) => p.personne === 'Assure1')?.cin || '08123456'} • Souscripteur Vérifié
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                :Assure (OWL)
              </span>
            </div>
          ) : (
            /* Vue Agent / Admin / Expert : liste des personnes */
            <div className="space-y-3">
              {personnes.slice(0, 3).map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {p.prenom || ''} {p.nom || p.personne}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {p.type}
                      </span>
                    </div>
                    <span className="text-zinc-500 block mt-1">
                      CIN : {p.cin || '08123456'} • Tél : {p.telephone || '20123456'}
                    </span>
                  </div>
                  <span className="font-mono text-zinc-400 text-xs">#{p.personne}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
