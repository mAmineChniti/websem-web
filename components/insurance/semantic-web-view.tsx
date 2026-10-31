'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Sparkles, Send, Users, FileCheck2, User,
  Phone, MapPin, CreditCard, Calendar, DollarSign,
  Shield, RefreshCw, ChevronRight, CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const PRESET_QUESTIONS = [
  "Qui sont les assures enregistres ?",
  "Quels sont les contrats proprietaire ?",
  "Quels sont les contrats locataire ?",
  "Liste des agents d'assurance ?",
  "Liste des experts enregistres ?",
  "Montant des primes par contrat ?",
];

function isContratRow(row: any): boolean {
  const str = JSON.stringify(row).toLowerCase();
  return (str.includes('contrat') || str.includes('prime') || str.includes('numero')) && !str.includes('cin') && !str.includes('telephone');
}

function PersonCard({ data }: { data: any }) {
  const raw = String(data.assure || data.agent || data.expert || data.personne || data.type || '');
  const kind = ['Assure','Agent','Expert','Beneficiaire'].find(k => raw.includes(k)) || 'Assure';
  const map: any = {
    Assure:       { label: 'Assure',       color: 'blue' },
    Agent:        { label: 'Agent',        color: 'violet' },
    Expert:       { label: 'Expert',       color: 'amber' },
    Beneficiaire: { label: 'Beneficiaire', color: 'emerald' },
  };
  const m = map[kind];
  const bgClass: any  = { blue:'bg-blue-50 border-blue-200', violet:'bg-violet-50 border-violet-200', amber:'bg-amber-50 border-amber-200', emerald:'bg-emerald-50 border-emerald-200' };
  const bdgClass: any = { blue:'bg-blue-100 text-blue-800', violet:'bg-violet-100 text-violet-800', amber:'bg-amber-100 text-amber-800', emerald:'bg-emerald-100 text-emerald-800' };
  const nom = [data.prenom, data.nom].filter(Boolean).join(' ') || '-';
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${bgClass[m.color]}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-zinc-900">{nom}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${bdgClass[m.color]}`}>{m.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600 mt-1">
        {data.cin && <span className="flex items-center gap-1.5"><CreditCard className="h-3 w-3 opacity-60" />CIN : <strong className="text-zinc-800">{data.cin}</strong></span>}
        {data.telephone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 opacity-60" />Tel : <strong className="text-zinc-800">{data.telephone}</strong></span>}
        {data.adresse && <span className="col-span-2 flex items-center gap-1.5"><MapPin className="h-3 w-3 opacity-60" /><strong className="text-zinc-800">{data.adresse}</strong></span>}
      </div>
    </div>
  );
}

function ContratCard({ data }: { data: any }) {
  const raw = String(data.typeContrat || data.contrat || '');
  const kind = ['Proprietaire','Locataire','Copropriete'].find(k => raw.includes(k)) || 'Proprietaire';
  const map: any = {
    Proprietaire: { label: 'Proprietaire', color: 'blue' },
    Locataire:    { label: 'Locataire',    color: 'violet' },
    Copropriete:  { label: 'Copropriete',  color: 'emerald' },
  };
  const m = map[kind];
  const bgClass: any  = { blue:'bg-blue-50 border-blue-200', violet:'bg-violet-50 border-violet-200', emerald:'bg-emerald-50 border-emerald-200' };
  const bdgClass: any = { blue:'bg-blue-100 text-blue-800', violet:'bg-violet-100 text-violet-800', emerald:'bg-emerald-100 text-emerald-800' };
  const numero = data.numeroContrat || String(data.contrat || '').split('#').pop() || '-';
  const prime  = data.montantPrime ? `${data.montantPrime} DT` : null;
  const assure = data.assure ? String(data.assure).split('#').pop() : null;
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${bgClass[m.color]}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-zinc-900">Contrat N {numero}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${bdgClass[m.color]}`}>{m.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600 mt-1">
        {prime  && <span className="flex items-center gap-1.5"><DollarSign className="h-3 w-3 opacity-60" />Prime : <strong className="text-zinc-800">{prime}</strong></span>}
        {assure && <span className="flex items-center gap-1.5"><User className="h-3 w-3 opacity-60" />Assure : <strong className="text-zinc-800">{assure}</strong></span>}
        {data.dateDebut && <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3 opacity-60" />Debut : <strong className="text-zinc-800">{data.dateDebut}</strong></span>}
        {data.dateFin   && <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3 opacity-60" />Fin : <strong className="text-zinc-800">{data.dateFin}</strong></span>}
      </div>
    </div>
  );
}

export function SemanticWebView({ userRole = 'Admin' }: { userRole?: string }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<any>(null);
  const [error, setError]       = useState<string | null>(null);
  const [stats, setStats]       = useState<any>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetch(`${apiUrl}/api/ontology/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStats(d))
      .catch(() => {});
  }, []);

  const askQuestion = async (q: string) => {
    if (!q.trim()) return;
    setQuestion(q);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/ontology/nlp/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      setResult(await res.json());
    } catch {
      setError('Impossible de joindre le serveur. Verifiez que le backend est demarre.');
    } finally {
      setLoading(false);
    }
  };

  const rows: any[]  = result?.results || [];
  const personRows   = rows.filter((r: any) => !isContratRow(r));
  const contratRows  = rows.filter((r: any) => isContratRow(r));

  // Assure cannot access this module
  if (userRole === 'Assure') {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Shield className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
        <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Acces non autorise</h2>
        <p className="text-sm text-zinc-500">La recherche intelligente est reservee aux agents, experts et administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 border border-blue-400/30">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span>Moteur de Recherche Intelligent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
            Recherche en Langage Naturel
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
            Posez votre question en francais pour interroger la base de donnees{' '}
            <strong className="text-white">Personnes</strong> et{' '}
            <strong className="text-white">Contrats</strong> d'assurance habitation.
          </p>
          {stats && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                `${stats.total_triples ?? '-'} triplets RDF`,
                `${stats.total_personnes ?? '-'} personnes`,
                `${stats.total_contrats ?? '-'} contrats`,
              ].map((s, i) => (
                <span key={i} className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/20 px-2.5 py-1 text-[11px] font-semibold text-white">{s}</span>
              ))}
            </div>
          )}
        </div>
        <div className="absolute right-6 bottom-4 hidden lg:block opacity-5">
          <Search className="h-52 w-52 text-white" />
        </div>
      </div>

      {/* Search card */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
            Questions frequentes
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => askQuestion(q)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={e => { e.preventDefault(); askQuestion(question); }} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ex : Qui sont les assures enregistres ?"
              className="w-full rounded-2xl border border-zinc-300 bg-white pl-10 pr-4 py-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:block">{loading ? 'Recherche...' : 'Rechercher'}</span>
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="rounded-2xl border border-zinc-100 bg-zinc-50 h-20 animate-pulse dark:border-zinc-800 dark:bg-zinc-800/40" />)}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-emerald-800">
                {rows.length} resultat{rows.length > 1 ? 's' : ''} trouve{rows.length > 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xs text-zinc-400">Pour : <em>{question}</em></span>
          </div>

          {personRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Personnes ({personRows.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {personRows.map((row: any, i: number) => <PersonCard key={i} data={row} />)}
              </div>
            </div>
          )}

          {contratRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Contrats ({contratRows.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contratRows.map((row: any, i: number) => <ContratCard key={i} data={row} />)}
              </div>
            </div>
          )}

          {rows.length === 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
              Aucun resultat pour cette question.
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <Search className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
          <p className="text-sm font-semibold text-zinc-500">Posez une question ci-dessus pour demarrer la recherche</p>
          <p className="text-xs text-zinc-400 mt-1">Exemple : Qui sont les assures enregistres ?</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {PRESET_QUESTIONS.slice(0, 3).map((q, i) => (
              <button
                key={i}
                onClick={() => askQuestion(q)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-blue-300 hover:text-blue-700 transition-all flex items-center gap-1"
              >
                <ChevronRight className="h-3 w-3" />{q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
