'use client';

import { Button } from '@/components/ui/button';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Shield,
  Home,
  Users,
  FileCheck2,
  Search,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  const features = [
    {
      icon: Users,
      title: 'Gestion des Personnes',
      desc: 'Assures, agents, experts et beneficiaires dans un graphe OWL.',
      color: 'primary',
    },
    {
      icon: FileCheck2,
      title: "Contrats d'Assurance",
      desc: 'Proprietaire, locataire, copropriete avec suivi des primes.',
      color: 'secondary',
    },
    {
      icon: Search,
      title: 'Recherche Intelligente NLP',
      desc: 'Interrogez la base en francais naturel via le moteur RDF.',
      color: 'accent',
    },
    {
      icon: Lock,
      title: 'Securite et Roles',
      desc: 'Acces controle : Assure, Agent, Expert et Administrateur.',
      color: 'muted',
    },
  ];

  const iconColor: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <nav className="border-border flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl shadow-lg">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <span className="text-foreground text-lg font-extrabold tracking-tight">
              Hestia<span className="text-primary">Assur</span>
            </span>
            <span className="border-primary/30 bg-primary/10 text-primary ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold">
              Assurance Habitation
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={onLogin}
            variant="outline"
            className="rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Connexion
          </Button>
          <Button
            onClick={onSignup}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg transition-all"
          >
            Inscription
          </Button>
        </div>
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="border-primary/30 bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold">
          <Shield className="h-3.5 w-3.5" />
          <span>Systeme Intelligent — OWL / RDF / SPARQL / NLP</span>
        </div>
        <h1 className="text-foreground mb-4 max-w-3xl text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Gestion{' '}
          <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
            Intelligente
          </span>
          <br />
          des Contrats d&apos;Assurance
        </h1>
        <p className="text-muted-foreground mb-8 max-w-xl text-sm leading-relaxed sm:text-base">
          Plateforme semantique pour la gestion des souscriptions, des assures
          et des polices d&apos;assurance habitation — alimentee par une
          ontologie OWL et un moteur NLP.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={onLogin}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold shadow-xl transition-all"
          >
            <span>Acceder a la plateforme</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={onSignup}
            variant="outline"
            className="flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold transition-all"
          >
            Creer un compte
          </Button>
        </div>
      </div>

      <div className="px-6 pb-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="border-border bg-card rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div
                  className={cn(
                    'mb-3 inline-flex items-center justify-center rounded-xl p-2',
                    iconColor[f.color]
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-foreground mb-1 text-sm font-bold">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-border text-muted-foreground border-t px-6 py-4 text-center text-xs">
        Hestia Assur v1.0 — Systeme Semantique d&apos;Assurance Habitation
      </div>
    </div>
  );
}
