'use client';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShieldCheck, LogIn, UserPlus, LogOut, Sparkles } from 'lucide-react';

interface HeaderProps {
  user:
    | {
        name: string;
        email: string;
        isConnected: boolean;
        role: string;
      }
    | undefined;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onSelectTab: (tab: string) => void;
}

export function Header({
  user,
  onOpenAuth,
  onLogout,
  onSelectTab,
}: HeaderProps) {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur-md">
      {/* Top micro-bar: Project status */}
      <div className="from-primary to-primary text-primary-foreground flex items-center justify-between bg-gradient-to-r px-4 py-1.5 text-xs shadow-inner">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-medium">
            Hestia Assur — Système Intelligent d&apos;Assurance Habitation
          </span>
        </div>
        <div className="hidden text-[11px] sm:block"></div>
      </div>

      {/* Main header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="group flex cursor-pointer items-center gap-3"
        >
          <div className="bg-primary text-primary-foreground shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-105">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-serif text-xl font-bold tracking-tight">
                Hestia
                <span className="text-primary">Assur</span>
              </span>
              <Badge className="bg-primary/10 text-primary dark:bg-primary/60 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                Assurance Habitation
              </Badge>
            </div>
            <p className="text-muted-foreground hidden text-[11px] sm:block">
              Gestion Sémantique des Souscriptions, Contrats & Profils Assurés
            </p>
          </div>
        </div>

        {/* User profile / Auth buttons */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          {user && user.isConnected ? (
            <div className="border-border flex items-center gap-2 border-l pl-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary border-primary/30 dark:bg-primary flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="text-left text-xs">
                  <div className="text-foreground flex items-center gap-1.5 font-semibold">
                    <span>{user.name}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                        user.role === 'Admin' &&
                          'bg-destructive/10 text-destructive',
                        user.role === 'Agent' && 'bg-primary/10 text-primary',
                        user.role === 'Expert' &&
                          'bg-accent text-accent-foreground',
                        (user.role === 'Assure' ||
                          user.role === 'Beneficiaire') &&
                          'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-muted-foreground max-w-[150px] truncate text-[11px]">
                    {user.email}
                  </div>
                </div>
              </div>
              <Button
                onClick={onLogout}
                title="Se déconnecter"
                aria-label="Se déconnecter"
                variant="ghost"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive ml-2 rounded-lg p-1.5"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onOpenAuth('login')}
                variant="outline"
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Connexion</span>
              </Button>
              <Button
                onClick={() => onOpenAuth('signup')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Inscription</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
