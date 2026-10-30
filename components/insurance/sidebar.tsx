'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  Home, 
  CloudSun, 
  FileCheck2, 
  Bot, 
  PlusCircle,
  HelpCircle,
  Shield,
  Network
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  openClaimModal: () => void;
  openAddPropertyModal: () => void;
  claimsCount: number;
  propertiesCount: number;
}

export function Sidebar({ 
  currentTab, 
  onSelectTab, 
  openClaimModal, 
  openAddPropertyModal,
  claimsCount,
  propertiesCount
}: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null,
      description: 'Aperçu général & KPIs',
    },
    {
      id: 'claims',
      label: 'Sinistres',
      icon: AlertOctagon,
      badge: claimsCount > 0 ? `${claimsCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      description: 'Déclaration & Suivi des dossiers',
    },
    {
      id: 'properties',
      label: 'Habitations & Assurés',
      icon: Home,
      badge: `${propertiesCount}`,
      badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      description: 'Logements, diagnostics, occupants',
    },
    {
      id: 'climate',
      label: 'Zones & Climat',
      icon: CloudSun,
      badge: 'Vigilance',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      description: 'Risques RGA, inondations, météo',
    },
    {
      id: 'contracts',
      label: 'Contrats & Garanties',
      icon: FileCheck2,
      badge: '3 Actifs',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      description: 'Formules, franchises, attestations',
    },
    {
      id: 'assistant',
      label: 'Assistant IA Habitation',
      icon: Bot,
      badge: 'IA',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      description: 'Conseils, démarches & ontologie',
    },
    {
      id: 'semantic',
      label: 'Web Sémantique (NLP/SPARQL)',
      icon: Network,
      badge: 'Prof',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      description: 'Traducteur NLTK, SPARQL & Protégé',
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 border-r border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/50 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Navigation list */}
        <div>
          <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Navigation Principale
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
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 dark:bg-emerald-600'
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

        {/* Quick actions box */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-3.5 dark:border-emerald-950/60 dark:from-emerald-950/30 dark:to-teal-950/10">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Actions Rapides</span>
          </div>
          <div className="space-y-2">
            <button
              onClick={openClaimModal}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              <span>Déclarer un sinistre</span>
            </button>
            <button
              onClick={openAddPropertyModal}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300/80 bg-white/80 px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-zinc-800 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Assurer un logement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Support Info */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between px-2">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Centre d'aide</span>
        </span>
        <span className="text-[11px] font-mono text-zinc-400">v1.0.0</span>
      </div>
    </aside>
  );
}
