'use client';

import React from 'react';
import { Shield, Home, Users, FileCheck2, Search, ChevronRight, Lock } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  const features = [
    { icon: Users,      title: 'Gestion des Personnes',      desc: 'Assures, agents, experts et beneficiaires dans un graphe OWL.', color: 'blue' },
    { icon: FileCheck2, title: 'Contrats d\'Assurance',       desc: 'Proprietaire, locataire, copropriete avec suivi des primes.',    color: 'emerald' },
    { icon: Search,     title: 'Recherche Intelligente NLP',  desc: 'Interrogez la base en francais naturel via le moteur RDF.',       color: 'violet' },
    { icon: Lock,       title: 'Securite et Roles',           desc: 'Acces controle : Assure, Agent, Expert et Administrateur.',       color: 'amber' },
  ];

  const iconColor: any = {
    blue: 'bg-blue-100 text-blue-700', emerald: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700', amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-white tracking-tight">Hestia<span className="text-blue-400">Assur</span></span>
            <span className="ml-2 rounded-full bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 text-[10px] font-semibold text-blue-300">Assurance Habitation</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-all">Connexion</button>
          <button onClick={onSignup} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all">Inscription</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 mb-6">
          <Shield className="h-3.5 w-3.5" />
          <span>Systeme Intelligent — OWL / RDF / SPARQL / NLP</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight max-w-3xl">
          Gestion{' '}
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Intelligente</span>
          <br />des Contrats d'Assurance
        </h1>
        <p className="text-sm sm:text-base text-blue-100/70 max-w-xl leading-relaxed mb-8">
          Plateforme semantique pour la gestion des souscriptions, des assures et des polices
          d'assurance habitation — alimentee par une ontologie OWL et un moteur NLP.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={onLogin} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all">
            <span>Acceder a la plateforme</span>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={onSignup} className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-all">
            Creer un compte
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/10 transition-all">
                <div className={`inline-flex items-center justify-center rounded-xl p-2 mb-3 ${iconColor[f.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">{f.title}</h3>
                <p className="text-xs text-blue-100/60 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-blue-100/40">
        Hestia Assur v1.0 — Systeme Semantique d'Assurance Habitation
      </div>
    </div>
  );
}
