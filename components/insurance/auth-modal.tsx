'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, CreditCard, Phone, MapPin, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string; isConnected: boolean; role: string; token: string; ontology_id?: string }) => void;
}

export function AuthModal({ isOpen, initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [cin, setCin] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await fetch(`${apiUrl}/api/ontology/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            nom,
            prenom,
            cin,
            telephone,
            adresse,
            role: 'Assure', // Always forced — public signup is Assure only
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Erreur lors de l'inscription");
        }
        const data = await res.json();
        onSuccess({
          name: `${data.user.prenom} ${data.user.nom}`,
          email: data.user.email,
          isConnected: true,
          role: data.user.role,
          token: data.token,
          ontology_id: data.user.ontology_id,
        });
        onClose();
      } else {
        const res = await fetch(`${apiUrl}/api/ontology/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Identifiants incorrects");
        }
        const data = await res.json();
        onSuccess({
          name: `${data.user.prenom} ${data.user.nom}`,
          email: data.user.email,
          isConnected: true,
          role: data.user.role,
          token: data.token,
          ontology_id: data.user.ontology_id,
        });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 p-6 text-white text-center relative">
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
            {mode === 'login' ? 'Authentification Sécurisée' : 'Inscription — Module Personne'}
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            {mode === 'login' ? 'Acces securise par role' : 'Inscription publique — Compte Assure'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-center text-xs font-semibold transition-all ${
              mode === 'login'
                ? 'border-b-2 border-blue-600 text-blue-700 bg-white dark:bg-zinc-900 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-3 text-center text-xs font-semibold transition-all ${
              mode === 'signup'
                ? 'border-b-2 border-blue-600 text-blue-700 bg-white dark:bg-zinc-900 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {mode === 'signup' && (
            <>
              

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Karim"
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="BenAli"
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    CIN
                  </label>
                  <input
                    type="text"
                    required
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    placeholder="08123456"
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="20123456"
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  required
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Tunis, Ariana"
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="assure@hestia.fr"
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
          >
            <span>{loading ? 'Traitement sécurisé...' : (mode === 'login' ? 'Se Connecter' : 'Créer mon compte & individu')}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Security Notice & Mode Switch */}
          <div className="pt-3 text-center space-y-2 border-t border-zinc-100 dark:border-zinc-800">
            {mode === 'login' ? (
              <p className="text-xs text-zinc-500">
                Vous n'avez pas encore de compte client ?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Créer un compte
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Se connecter
                </button>
              </p>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Chiffrement SSL & Hachage sécurisé SHA-256</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
