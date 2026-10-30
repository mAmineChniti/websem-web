'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Bell, 
  PhoneCall, 
  CloudAlert, 
  User, 
  LogIn, 
  UserPlus, 
  LogOut,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  user: { name: string; email: string; isConnected: boolean } | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onSelectTab: (tab: string) => void;
}

export function Header({ user, onOpenAuth, onLogout, onSelectTab }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
      {/* Top micro-bar for emergency & climate alert */}
      <div className="flex items-center justify-between px-4 py-1.5 text-xs bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-inner">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
          <span className="font-medium hidden sm:inline">Assistance Urgence Habitation 24/7 :</span>
          <a href="tel:0800404000" className="flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-emerald-200">
            <PhoneCall className="h-3 w-3" /> 0 800 404 000 (Appel gratuit)
          </a>
        </div>
        <button 
          onClick={() => onSelectTab('climate')}
          className="flex items-center gap-1.5 hover:underline text-amber-200 font-medium"
        >
          <CloudAlert className="h-3.5 w-3.5" />
          <span>Vigilance Météo Aquitaine : Vents & Orages</span>
        </button>
      </div>

      {/* Main navigation header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Logo and Brand */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-serif">
                Hestia<span className="text-emerald-600 dark:text-emerald-400">Assur</span>
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Habitation
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Protection Intelligente & Résilience Climatique
            </p>
          </div>
        </div>

        {/* Right side actions: Notification, User / Auth buttons */}
        <div className="flex items-center gap-3">
          {/* Notifications button */}
          <button 
            onClick={() => onSelectTab('claims')}
            className="relative rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
            title="Dossiers & Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
          </button>

          {/* User profile or Login / Signup buttons */}
          {user && user.isConnected ? (
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm border border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                    {user.name}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[11px]">Assuré #758921</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Se déconnecter"
                className="ml-1 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Connexion</span>
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
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
