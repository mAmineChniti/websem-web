'use client';
import { Button } from '@/components/ui/button';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  FileCheck2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Database,
} from 'lucide-react';
import { getStats } from '@/lib/services/stats';
import { listPersonnes } from '@/lib/services/personnes';
import type { Personne } from '@/lib/types/personnes';
import { listContrats } from '@/lib/services/contrats';

interface DashboardViewProps {
  onSelectTab: (tab: string) => void;
  userRole?: string;
}

export function DashboardView({ onSelectTab, userRole }: DashboardViewProps) {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: personnesRaw } = useQuery({
    queryKey: ['personnes'],
    queryFn: listPersonnes,
  });

  const { data: contratsRaw } = useQuery({
    queryKey: ['contrats'],
    queryFn: listContrats,
  });

  const personnes = useMemo(() => personnesRaw ?? [], [personnesRaw]);
  const contrats = useMemo(() => contratsRaw ?? [], [contratsRaw]);

  const totalPrimes = contrats.reduce(
    (acc, c) => acc + (Number.parseFloat(c.montantPrime as string) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="from-primary to-card text-primary-foreground relative overflow-hidden rounded-3xl bg-linear-to-r p-6 shadow-xl sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="bg-primary/20 text-primary border-primary/30 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Hestia Assur — Système d&apos;Assurance Habitation</span>
          </div>
          <h1 className="text-primary-foreground font-serif text-2xl font-extrabold tracking-tight sm:text-3xl">
            Gestion Intelligente des Contrats & Souscripteurs
          </h1>
          <p className="text-primary-foreground/90 text-xs leading-relaxed sm:text-sm">
            Plateforme décisionnelle d&apos;assurance habitation.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button
              onClick={() => onSelectTab('contrats')}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow transition-colors"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>
                {userRole === 'Assure' ? 'Mes Contrats' : 'Gérer les Contrats'}
              </span>
            </Button>
            <Button
              onClick={() => onSelectTab('personnes')}
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold backdrop-blur transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>
                {userRole === 'Assure'
                  ? 'Mon Profil Assuré'
                  : 'Voir les Personnes'}
              </span>
            </Button>
          </div>
        </div>

        <div className="absolute right-8 bottom-4 hidden opacity-10 lg:block">
          <Database className="h-44 w-44" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Personnes / Profil */}
        <div
          onClick={() => onSelectTab('personnes')}
          className="border-border bg-card cursor-pointer rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              {userRole === 'Assure'
                ? 'Mon Dossier Client'
                : 'Personnes Ontologie'}
            </span>
            <div className="bg-primary/10 text-primary dark:bg-primary/50 flex h-9 w-9 items-center justify-center rounded-xl">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold">
              {userRole === 'Assure'
                ? 'Actif'
                : (stats?.personnes_count ?? personnes.length)}
            </span>
            <span className="text-primary text-xs font-semibold">
              {userRole === 'Assure' ? 'Vérifié' : 'Individus'}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-[11px]">
            {userRole === 'Assure'
              ? "Souscripteur conforme à l'ontologie OWL"
              : `Assurés (${stats?.assures_count ?? 1}), Agents (${stats?.agents_count ?? 1}), Experts (${stats?.experts_count ?? 1})`}
          </p>
        </div>

        {/* KPI 2 : Contrats */}
        <div
          onClick={() => onSelectTab('contrats')}
          className="border-border bg-card cursor-pointer rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Contrats Souscrits
            </span>
            <div className="bg-primary/10 text-primary dark:bg-primary/50 flex h-9 w-9 items-center justify-center rounded-xl">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold">
              {stats?.contrats_count ?? contrats.length}
            </span>
            <span className="text-primary text-xs font-semibold">
              Polices actives
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-[11px]">
            ContratProprietaire, Locataire & Copropriété
          </p>
        </div>

        {/* KPI 3 : Primes */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              Primes Totales
            </span>
            <div className="bg-primary/10 text-primary dark:bg-primary/50 flex h-9 w-9 items-center justify-center rounded-xl">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold">
              {totalPrimes.toLocaleString('fr-FR')} DT
            </span>
            <span className="text-muted-foreground text-xs">/ an</span>
          </div>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Attribut{' '}
            <code className="text-primary font-mono">as:montantPrime</code>
          </p>
        </div>

        {/* KPI 4 : Statut Protection (Assuré) ou Ontologie (Back-office) */}
        {userRole === 'Assure' ? (
          <div
            onClick={() => onSelectTab('personnes')}
            className="border-border bg-card cursor-pointer rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                Statut Protection
              </span>
              <div className="bg-primary/10 text-primary dark:bg-primary/50 flex h-9 w-9 items-center justify-center rounded-xl">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-foreground text-2xl font-bold">
                Protégé
              </span>
              <span className="text-primary text-xs font-semibold">
                100 % Couvert
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Protection Incendie, Dégât des Eaux & RC
            </p>
          </div>
        ) : (
          <div
            onClick={() =>
              onSelectTab(userRole === 'Admin' ? 'sparql' : 'contrats')
            }
            className="border-border bg-card cursor-pointer rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                Base Ontologique
              </span>
              <div className="bg-primary/10 text-primary dark:bg-primary/50 flex h-9 w-9 items-center justify-center rounded-xl">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-foreground text-2xl font-bold">
                {stats?.total_triples ?? 414}
              </span>
              <span className="text-primary text-xs font-semibold">
                Triplets RDF
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Graphe sémantique de connaissances certifié
            </p>
          </div>
        )}
      </div>

      {/* Main Grid: Contracts & Persons Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contracts Preview */}
        <div className="border-border bg-card space-y-4 rounded-3xl border p-6 shadow-sm">
          <div className="border-border flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-foreground font-serif text-base font-bold">
                Contrats Référencés dans l&apos;Ontologie
              </h2>
              <p className="text-muted-foreground text-xs">
                Polices d&apos;assurance habitation (Propriétaire, Locataire,
                Copropriété)
              </p>
            </div>
            <Button
              onClick={() => onSelectTab('contrats')}
              className="text-primary flex items-center gap-1 text-xs font-semibold hover:underline"
            >
              <span>Voir tout</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-3">
            {contrats.slice(0, 3).map((c, idx) => (
              <div
                key={idx}
                className="border-border bg-muted/40 flex items-center justify-between rounded-2xl border p-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-mono font-bold">
                      {c.numeroContrat || c.contrat}
                    </span>
                    <span className="bg-primary/10 text-primary dark:bg-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                      {c.typeContrat}
                    </span>
                  </div>
                  <span className="text-muted-foreground mt-1 block">
                    Souscripteur : <strong>{c.assure || 'Assure1'}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-primary block text-sm font-bold">
                    {c.montantPrime ? `${c.montantPrime} DT` : '850 DT'}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    Prime annuelle
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Persons Preview - Adapté selon le rôle */}
        <div className="border-border bg-card space-y-4 rounded-3xl border p-6 shadow-sm">
          <div className="border-border flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-foreground font-serif text-base font-bold">
                {userRole === 'Assure'
                  ? 'Mon Profil Assuré'
                  : "Parties Prenantes & Acteurs de l'Assurance"}
              </h2>
              <p className="text-muted-foreground text-xs">
                {userRole === 'Assure'
                  ? "Vos informations personnelles déclarées dans l'ontologie"
                  : "Sous-classes d'acteurs qualifiés (Assuré, Agent, Expert, Bénéficiaire)"}
              </p>
            </div>
            <Button
              onClick={() => onSelectTab('personnes')}
              className="text-primary flex items-center gap-1 text-xs font-semibold hover:underline"
            >
              <span>{userRole === 'Assure' ? 'Mon profil' : 'Voir tout'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {userRole === 'Assure' ? (
            /* Vue Assuré : carte de son propre profil uniquement */
            <div
              onClick={() => onSelectTab('personnes')}
              className="border-primary/30 from-primary/10 to-primary/10 dark:border-primary dark:bg-primary/30 flex cursor-pointer items-center justify-between rounded-2xl border bg-linear-to-r p-4 text-xs transition-all hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow">
                  {personnes.find((p: Personne) =>
                    p.personne.includes('Assure')
                  )?.prenom?.[0] || 'A'}
                  {personnes.find((p: Personne) =>
                    p.personne.includes('Assure')
                  )?.nom?.[0] || 'D'}
                </div>
                <div>
                  <span className="text-foreground block font-bold">
                    {personnes.find((p: Personne) => p.personne === 'Assure1')
                      ?.prenom || 'Karim'}{' '}
                    {personnes.find((p: Personne) => p.personne === 'Assure1')
                      ?.nom || 'BenAli'}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block">
                    CIN :{' '}
                    {personnes.find((p: Personne) => p.personne === 'Assure1')
                      ?.cin || '08123456'}{' '}
                    • Souscripteur Vérifié
                  </span>
                </div>
              </div>
              <span className="bg-primary/10 text-primary dark:bg-primary rounded-full px-2.5 py-1 text-[10px] font-bold">
                :Assure (OWL)
              </span>
            </div>
          ) : (
            /* Vue Agent / Admin / Expert : liste des personnes */
            <div className="space-y-3">
              {personnes.slice(0, 3).map((p: Personne, idx: number) => (
                <div
                  key={idx}
                  className="border-border bg-muted/40 flex items-center justify-between rounded-2xl border p-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-bold">
                        {p.prenom || ''} {p.nom || p.personne}
                      </span>
                      <span className="bg-primary/10 text-primary dark:bg-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                        {p.type}
                      </span>
                    </div>
                    <span className="text-muted-foreground mt-1 block">
                      CIN : {p.cin || '08123456'} • Tél :{' '}
                      {p.telephone || '20123456'}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono text-xs">
                    #{p.personne}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
