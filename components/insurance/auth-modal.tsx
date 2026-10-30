'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string; isConnected: boolean }) => void;
}

export function AuthModal({ isOpen, initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('alexandre.dupont@email.fr');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Alexandre Dupont');
  const [housingType, setHousingType] = useState('Propriétaire occupant');
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      name: mode === 'signup' ? name : 'Alexandre Dupont',
      email,
      isConnected: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight font-serif">
            {mode === 'login' ? 'Espace Assuré Hestia' : 'Rejoindre Hestia Assur'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            {mode === 'login' 
              ? 'Accédez à la gestion de vos habitations et déclarations'
              : 'Assurez votre logement en moins de 3 minutes'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-center text-xs font-semibold transition-all ${
              mode === 'login'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white dark:bg-zinc-900 dark:text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Se Connecter
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 text-center text-xs font-semibold transition-all ${
              mode === 'signup'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white dark:bg-zinc-900 dark:text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Créer un Compte
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="assure@exemple.com"
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Statut d'occupation
              </label>
              <select
                value={housingType}
                onChange={(e) => setHousingType(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option>Propriétaire occupant</option>
                <option>Locataire</option>
                <option>Propriétaire non occupant (PNO)</option>
                <option>Colocataire</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700"
              />
              <span>Se souvenir de moi</span>
            </label>
            {mode === 'login' && (
              <a href="#" className="text-emerald-600 hover:underline dark:text-emerald-400">
                Mot de passe oublié ?
              </a>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:opacity-95 transition-opacity"
          >
            <span>{mode === 'login' ? 'Accéder à mon espace' : 'Finaliser mon inscription'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setName('Alexandre Dupont');
                setEmail('alexandre.dupont@email.fr');
              }}
              className="text-[11px] text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 underline"
            >
              Remplir avec le compte démo (Alexandre Dupont)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
