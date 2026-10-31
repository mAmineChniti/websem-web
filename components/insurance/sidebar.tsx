'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  User,
  FileCheck2, 
  Terminal, 
  ShieldCheck, 
  PlusCircle, 
  BookOpen, 
  HelpCircle 
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
  userRole = 'Assure'
}: SidebarProps) {
  const isAssure = userRole === 'Assure';
  const isExpert = userRole === 'Expert';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null,
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
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      description: isAssure
        ? 'Mes données personnelles & agent référent'
        : isExpert
        ? 'Coordonnées des assurés à évaluer'
        : 'Assurés, Agents, Experts, Bénéficiaires',
    },
    {
      id: 'contrats',
      label: 'Contrats d\'Assurance',
      icon: FileCheck2,
      badge: `${contratsCount}`,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      description: 'Propriétaire, Locataire, Copropriété',
    },
    ...(userRole !== 'Assure' ? [{
      id: 'sparql',
      label: 'Recherche & Intelligence NLP',
      icon: Terminal,
      badge: 'IA',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      description: 'Interrogation semantique en francais',
    }] : []),
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 border-r border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/50 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Gestion d'Assurance Habitation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Info Box */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-3.5 dark:border-blue-950/60 dark:from-blue-950/30 dark:to-indigo-950/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Socle Sémantique OWL</span>
          </div>
          <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
            Interconnexion formelle des entités <strong className="text-blue-900 dark:text-white">Personne</strong> et <strong className="text-blue-900 dark:text-white">Contrat</strong> via graphe de connaissances.
          </p>
          <div className="text-[10px] text-zinc-500 font-mono bg-white/70 dark:bg-black/40 p-2 rounded-lg">
            Graphe RDF : assurance.rdf
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between px-2">
        <span className="font-semibold text-blue-600">Hestia Assur</span>
        <span className="text-[11px] font-mono text-zinc-400">v1.0 (OWL/RDF)</span>
      </div>
    </aside>
  );
}
