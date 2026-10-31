'use client';

import React from 'react';
import { 
  ShieldCheck, 
  User, 
  LogIn, 
  UserPlus, 
  LogOut,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  user: { name: string; email: string; isConnected: boolean; role: string } | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onSelectTab: (tab: string) => void;
}

export function Header({ user, onOpenAuth, onLogout, onSelectTab }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
      {/* Top micro-bar: Project status */}
      <div className="flex items-center justify-between px-4 py-1.5 text-xs bg-gradient-to-r from-blue-700 via-indigo-800 to-zinc-900 text-white shadow-inner">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-300" />
          <span className="font-medium">Hestia Assur — Système Intelligent d'Assurance Habitation</span>
        </div>
        <div className="text-[11px] text-blue-200 hidden sm:block">
        </div>
      </div>

      {/* Main header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Brand */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-serif">
                Hestia<span className="text-blue-600 dark:text-blue-400">Assur</span>
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                Assurance Habitation
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Gestion Sémantique des Souscriptions, Contrats & Profils Assurés
            </p>
          </div>
        </div>

        {/* User profile / Auth buttons */}
        <div className="flex items-center gap-3">
          {user && user.isConnected ? (
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold text-sm border border-blue-300 dark:bg-blue-900 dark:text-blue-200">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left text-xs">
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <span>{user.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      user.role === 'Admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : user.role === 'Agent'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : user.role === 'Expert'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate max-w-[150px]">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Se déconnecter"
                className="ml-2 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Connexion</span>
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Inscription</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
