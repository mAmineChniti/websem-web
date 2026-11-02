'use client';
import { Button } from '@/components/ui/button';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  User,
  FileCheck2,
  AlertTriangle,
  Shield,
  Terminal,
  Code2,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  openContratModal?: () => void;
  personnesCount: number;
  contratsCount: number;
  userRole?: string;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  personnesCount,
  contratsCount,
  userRole = 'Assure',
}: SidebarProps) {
  const isAssure = userRole === 'Assure';
  const isExpert = userRole === 'Expert';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: undefined,
      description: 'Vue d’ensemble des souscriptions et indicateurs',
    },
    {
      id: 'personnes',
      label: isAssure
        ? 'Mon Profil Assuré'
        : isExpert
          ? 'Assurés & Contacts'
          : 'Gestion des Personnes',
      icon: isAssure ? User : Users,
      badge: isAssure ? 'Actif' : `${personnesCount}`,
      badgeColor: isAssure
        ? 'bg-primary/10 text-primary dark:bg-primary'
        : 'bg-primary/10 text-primary dark:bg-primary',
      description: isAssure
        ? 'Mes données personnelles & agent référent'
        : isExpert
          ? 'Coordonnées des assurés à évaluer'
          : 'Assurés, Agents, Experts, Bénéficiaires',
    },
    {
      id: 'contrats',
      label: "Contrats d'Assurance",
      icon: FileCheck2,
      badge: `${contratsCount}`,
      badgeColor: 'bg-primary/10 text-primary dark:bg-primary',
      description: 'Propriétaire, Locataire, Copropriété',
    },
    {
      id: 'sinistres',
      label: 'Sinistres',
      icon: AlertTriangle,
      badge: undefined,
      description: 'Déclarations et suivi des sinistres',
    },
    {
      id: 'garanties',
      label: 'Garanties',
      icon: Shield,
      badge: undefined,
      description: 'Garanties et couvertures',
    },
    ...(userRole === 'Assure'
      ? []
      : [
          {
            id: 'sparql',
            label: 'Recherche & Intelligence NLP',
            icon: Terminal,
            badge: 'IA',
            badgeColor: 'bg-primary/10 text-primary dark:bg-primary',
            description: 'Interrogation sémantique en français',
          },
        ]),
    ...(userRole === 'Admin'
      ? [
          {
            id: 'sparql-explorer',
            label: 'Explorateur SPARQL',
            icon: Code2,
            badge: '12',
            badgeColor: 'bg-primary/10 text-primary dark:bg-primary',
            description: 'Console SPARQL interactive (démo technique)',
          },
        ]
      : []),
  ];

  return (
    <aside className="border-border bg-muted/50 flex w-full shrink-0 flex-col justify-between border-r p-4 lg:w-64">
      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground mb-2 px-2 text-[11px] font-semibold tracking-wider uppercase">
            Gestion d&apos;Assurance Habitation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <Button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : item.badgeColor
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Info Box */}
        {isAssure ? (
          <div className="border-primary/30 from-primary/80 to-primary/50 dark:border-primary/60 dark:from-primary/30 dark:to-primary/10 space-y-2 rounded-2xl border bg-linear-to-br p-3.5">
            <div className="text-primary flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Espace Client Sécurisé</span>
            </div>
            <p className="text-primary/80 text-[11px] leading-relaxed">
              Vos polices d&apos;assurance habitation et vos données
              personnelles sont certifiées et protégées.
            </p>
            <div className="text-primary bg-card/70 dark:bg-card/40 flex items-center gap-1.5 rounded-lg p-2 text-[10px] font-semibold">
              <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
              <span>Couverture active 24h/24</span>
            </div>
          </div>
        ) : (
          <div className="border-primary/30 from-primary/80 to-primary/50 dark:border-primary/60 dark:from-primary/30 dark:to-primary/10 space-y-2 rounded-2xl border bg-linear-to-br p-3.5">
            <div className="text-primary flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Socle Sémantique OWL</span>
            </div>
            <p className="text-primary/80 text-[11px] leading-relaxed">
              Interconnexion formelle des entités{' '}
              <strong className="text-primary dark:text-primary-foreground">
                Personne
              </strong>{' '}
              et{' '}
              <strong className="text-primary dark:text-primary-foreground">
                Contrat
              </strong>{' '}
              via graphe de connaissances.
            </p>
            <div className="text-muted-foreground bg-card/70 dark:bg-card/40 rounded-lg p-2 font-mono text-[10px]">
              Graphe RDF : assurance.rdf
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-border text-muted-foreground flex items-center justify-between border-t px-2 pt-4 text-xs">
        <span className="text-primary font-semibold">Hestia Assur</span>
        <span className="text-muted-foreground font-mono text-[11px]">
          v1.0 (OWL/RDF)
        </span>
      </div>
    </aside>
  );
}
