'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Sparkles, Send, Users, FileCheck2, User,
  Phone, MapPin, CreditCard, Calendar, DollarSign,
  Shield, RefreshCw, ChevronRight, CheckCircle2,
  AlertCircle, Brain, ChevronDown, ChevronUp, Cpu,
  GitBranch, Zap, Hash, Tag,
} from 'lucide-react';

const QUESTIONS_BY_ROLE: Record<string, string[]> = {
  Expert: [
    "Quels sont les sinistres déclarés ?",
    "Y a-t-il eu un incendie ?",
    "Quels sont les dommages signalés ?",
    "Quelles déclarations sont en cours ?",
    "Qui sont les assurés concernés ?",
    "Quelles garanties couvrent les sinistres ?",
  ],
  Agent: [
    "Qui sont mes assurés ?",
    "Quels contrats sont actifs ?",
    "Quels sont les contrats propriétaire ?",
    "Quels sont les contrats locataire ?",
    "Montant des primes par contrat ?",
    "Combien d'assurés sont enregistrés ?",
    "Quelles garanties sont disponibles ?",
  ],
  Admin: [
    "Qui sont les assurés enregistrés ?",
    "Quels sont les contrats propriétaire ?",
    "Quels sont les contrats locataire ?",
    "Liste des agents d'assurance ?",
    "Liste des experts enregistrés ?",
    "Montant des primes par contrat ?",
    "Quels sont les sinistres déclarés ?",
    "Liste des garanties disponibles ?",
    "Quelles sont les déclarations en cours ?",
    "Combien d'assurés sont enregistrés ?",
  ],
};

function getPresetQuestions(role: string): string[] {
  return QUESTIONS_BY_ROLE[role] || QUESTIONS_BY_ROLE['Admin'];
}

function isPersonRow(row: any): boolean {
  // Un résultat est une "personne" seulement s'il a un nom ou prénom rempli
  // ET qu'il n'a PAS de champs spécifiques à d'autres entités (sinistre, garantie, habitation, déclaration)
  const hasName = !!(row.nom || row.prenom || row.nomAssure || row.prenomAssure);
  if (!hasName) return false;
  
  // Exclure si c'est clairement un sinistre, garantie, habitation ou déclaration
  const isSinistre = row.sinistre || row.typeSinistre || row.dateSinistre || row.lieuSinistre || row.descriptionSinistre;
  const isGarantie = row.garantie || row.typeGarantie || row.plafond || row.tauxFranchise;
  const isHabitation = row.habitation || row.typeHabitation || row.superficie;
  const isDeclaration = row.declaration || row.typeDeclaration || row.dateDeclaration || row.statutDeclaration;
  const isIndemnisation = row.indemnisation || row.typeIndemnisation || row.montantIndemnisation;
  if (isSinistre || isGarantie || isHabitation || isDeclaration || isIndemnisation) return false;

  return true;
}

function isContratRow(row: any): boolean {
  const str = JSON.stringify(row).toLowerCase();
  return (str.includes('contrat') || str.includes('prime') || str.includes('numero')) && !str.includes('cin') && !str.includes('telephone');
}

function PersonCard({ data }: { data: any }) {
  const raw = String(data.assure || data.agent || data.expert || data.personne || data.type || '');
  const kind = ['Assure', 'Agent', 'Expert', 'Beneficiaire'].find(k => raw.includes(k)) || 'Assure';
  const map: any = {
    Assure:       { label: 'Assuré',       color: 'blue' },
    Agent:        { label: 'Agent',        color: 'violet' },
    Expert:       { label: 'Expert',       color: 'amber' },
    Beneficiaire: { label: 'Bénéficiaire', color: 'emerald' },
  };
  const m = map[kind];
  const bgClass: any  = { blue: 'bg-blue-50 border-blue-200', violet: 'bg-violet-50 border-violet-200', amber: 'bg-amber-50 border-amber-200', emerald: 'bg-emerald-50 border-emerald-200' };
  const bdgClass: any = { blue: 'bg-blue-100 text-blue-800', violet: 'bg-violet-100 text-violet-800', amber: 'bg-amber-100 text-amber-800', emerald: 'bg-emerald-100 text-emerald-800' };
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
  const kind = ['Proprietaire', 'Locataire', 'Copropriete'].find(k => raw.includes(k)) || 'Proprietaire';
  const map: any = {
    Proprietaire: { label: 'Propriétaire', color: 'blue' },
    Locataire:    { label: 'Locataire',    color: 'violet' },
    Copropriete:  { label: 'Copropriété',  color: 'emerald' },
  };
  const m = map[kind];
  const bgClass: any  = { blue: 'bg-blue-50 border-blue-200', violet: 'bg-violet-50 border-violet-200', emerald: 'bg-emerald-50 border-emerald-200' };
  const bdgClass: any = { blue: 'bg-blue-100 text-blue-800', violet: 'bg-violet-100 text-violet-800', emerald: 'bg-emerald-100 text-emerald-800' };
  const numero = data.numeroContrat || String(data.contrat || '').split('#').pop() || '-';
  const prime  = data.montantPrime ? `${data.montantPrime} DT` : null;
  const assure = data.assure ? String(data.assure).split('#').pop() : null;
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${bgClass[m.color]}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-zinc-900">Contrat N° {numero}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${bdgClass[m.color]}`}>{m.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600 mt-1">
        {prime  && <span className="flex items-center gap-1.5"><DollarSign className="h-3 w-3 opacity-60" />Prime : <strong className="text-zinc-800">{prime}</strong></span>}
        {assure && <span className="flex items-center gap-1.5"><User className="h-3 w-3 opacity-60" />Assuré : <strong className="text-zinc-800">{assure}</strong></span>}
        {data.dateDebut && <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3 opacity-60" />Début : <strong className="text-zinc-800">{data.dateDebut}</strong></span>}
        {data.dateFin   && <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3 opacity-60" />Fin : <strong className="text-zinc-800">{data.dateFin}</strong></span>}
      </div>
    </div>
  );
}

// ── Pipeline NLP Panel ────────────────────────────────────────────────────────
function NLPPipelinePanel({ pipeline, intent, intentDescription, matchScore, sparqlQuery, elapsedMs }: {
  pipeline: any;
  intent: string;
  intentDescription: string;
  matchScore: number;
  sparqlQuery: string;
  elapsedMs?: number;
}) {
  const [open, setOpen] = useState(true);

  const step1 = pipeline?.step1_nltk;
  const step2 = pipeline?.step2_spacy;
  const step3 = pipeline?.step3_intent;

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
            Pipeline NLP/TALN — Détails du traitement
          </span>
          {elapsedMs && (
            <span className="rounded-full bg-indigo-200 dark:bg-indigo-900 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
              {elapsedMs} ms
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-indigo-500" /> : <ChevronDown className="h-4 w-4 text-indigo-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Step 1 — NLTK */}
          {step1 && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold shrink-0">1</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">NLTK — Tokenisation & Stemming</span>
                <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[9px] font-mono text-indigo-600 dark:text-indigo-400">{step1.library}</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-zinc-500 font-semibold">Tokens filtrés :</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(step1.tokens || []).map((t: string, i: number) => (
                      <span key={i} className="rounded-lg bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 font-mono text-indigo-800 dark:text-indigo-300">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 font-semibold">Stems (SnowballStemmer fr) :</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(step1.stems || []).map((s: string, i: number) => (
                      <span key={i} className="rounded-lg bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 font-mono text-amber-800 dark:text-amber-300">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — spaCy */}
          {step2 && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white text-[10px] font-bold shrink-0">2</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">spaCy — NER & POS Tagging</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-bold ${
                  step2.available
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                }`}>
                  {step2.available ? '✓ fr_core_news_sm' : '⚠ non disponible'}
                </span>
              </div>
              {step2.available ? (
                <div className="space-y-1.5 text-[11px]">
                  {step2.entities && step2.entities.length > 0 ? (
                    <div>
                      <span className="text-zinc-500 font-semibold">Entités détectées (NER) :</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {step2.entities.map((e: any, i: number) => (
                          <span key={i} className="rounded-lg bg-violet-100 dark:bg-violet-950 px-1.5 py-0.5 font-mono text-violet-800 dark:text-violet-300">
                            {e.text} <span className="text-[9px] opacity-60">({e.label})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-400 italic">Aucune entité nommée détectée dans cette question.</p>
                  )}
                  {step2.noun_chunks && step2.noun_chunks.length > 0 && (
                    <div>
                      <span className="text-zinc-500 font-semibold">Groupes nominaux :</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {step2.noun_chunks.map((c: string, i: number) => (
                          <span key={i} className="rounded-lg bg-cyan-100 dark:bg-cyan-950 px-1.5 py-0.5 font-mono text-cyan-800 dark:text-cyan-300">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400">spaCy non disponible — utilisez NLTK uniquement.</p>
              )}
            </div>
          )}

          {/* Step 3 — Intent */}
          {step3 && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">3</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Intent Matcher → SPARQL</span>
              </div>
              <div className="text-[11px] space-y-1">
                <p><span className="text-zinc-500 font-semibold">Intention détectée :</span> <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{intent}</span></p>
                <p><span className="text-zinc-500 font-semibold">Description :</span> {intentDescription}</p>
                <p><span className="text-zinc-500 font-semibold">Score de correspondance :</span>{' '}
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">{matchScore}</span>
                  {' '}<span className="text-zinc-400">/ {step3.total_intents_available} intentions disponibles</span>
                </p>
              </div>
            </div>
          )}

          {/* SPARQL générée */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Requête SPARQL générée</p>
            <pre className="text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {sparqlQuery}
            </pre>
          </div>
        </div>
      )}
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
      setError('Impossible de joindre le serveur. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const rows: any[]  = (result?.results || []).filter((r: any) => {
    // Filtrer les résultats vides (individus Protégé sans données)
    const vals = Object.values(r).filter(v => v != null && v !== '');
    // Garder seulement si au moins un champ utile est rempli (nom, prenom, cin, numeroContrat, etc.)
    const hasName = r.nom || r.prenom || r.nomAssure || r.prenomAssure;
    const hasId = r.cin || r.numeroContrat || r.telephone;
    const hasData = r.montantPrime || r.dateSinistre || r.dateDebut || r.plafond || r.montant || r.description || r.descriptionSinistre || r.lieuSinistre || r.statut || r.dateDeclaration || r.adresse || r.superficie || r.valeur || r.taux;
    return hasName || hasId || hasData || vals.length > 3;
  });
  const personRows   = rows.filter((r: any) => isPersonRow(r));
  const contratRows  = rows.filter((r: any) => isContratRow(r));
  const otherRows    = rows.filter((r: any) => !isPersonRow(r) && !isContratRow(r));

  if (userRole === 'Assure') {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Shield className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
        <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Accès non autorisé</h2>
        <p className="text-sm text-zinc-500">La recherche intelligente est réservée aux agents, experts et administrateurs.</p>
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
            <span>{userRole === 'Admin' ? 'Moteur NLP/TALN → SPARQL' : 'Recherche Intelligente'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
            {userRole === 'Expert'
              ? 'Recherche Sinistres & Expertises'
              : userRole === 'Agent'
                ? 'Recherche Clients & Contrats'
                : 'Recherche en Langage Naturel'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
            {userRole === 'Admin'
              ? <>
                  Posez votre question en français. Le pipeline{' '}
                  <strong className="text-white">NLTK + spaCy</strong>{' '}
                  la traduit automatiquement en requête{' '}
                  <strong className="text-white">SPARQL</strong> exécutable sur l'ontologie OWL.
                </>
              : userRole === 'Expert'
                ? 'Posez vos questions sur les sinistres, les déclarations et les assurés concernés. Le système analyse votre question et recherche dans la base de connaissances.'
                : 'Posez vos questions sur vos clients, contrats et garanties. Le système analyse votre question et recherche dans la base de connaissances.'
            }
          </p>

          {/* NLP Libraries badges — Admin only */}
          {userRole === 'Admin' && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { icon: <Cpu className="h-3 w-3" />, label: 'NLTK — Tokenisation + Stemming' },
                { icon: <Brain className="h-3 w-3" />, label: 'spaCy fr — NER + POS' },
                { icon: <GitBranch className="h-3 w-3" />, label: 'Intent Matcher' },
                ...(stats ? [
                  { icon: <Hash className="h-3 w-3" />, label: `${stats.total_triples ?? '-'} triplets RDF` },
                  { icon: <Tag className="h-3 w-3" />, label: `${stats.personnes_count ?? '-'} personnes` },
                ] : []),
              ].map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/20 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {b.icon}{b.label}
                </span>
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
            Questions fréquentes (cliquez pour tester)
          </span>
          <div className="flex flex-wrap gap-2">
            {getPresetQuestions(userRole).map((q, i) => (
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
              placeholder={
                userRole === 'Expert'
                  ? 'Ex : Quels sinistres ont été déclarés ? | Y a-t-il eu un incendie ?'
                  : userRole === 'Agent'
                    ? 'Ex : Qui sont mes assurés ? | Quels contrats sont actifs ?'
                    : 'Ex : Qui sont les assurés enregistrés ? | Quels sinistres ont été déclarés ?'
              }
              className="w-full rounded-2xl border border-zinc-300 bg-white pl-10 pr-4 py-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:block">{loading ? 'Traitement NLP...' : 'Rechercher'}</span>
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

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-2xl border border-zinc-100 bg-zinc-50 h-20 animate-pulse dark:border-zinc-800 dark:bg-zinc-800/40" />)}
        </div>
      )}

      {/* Results + Pipeline */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Header résultats */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-emerald-800">
                {rows.length} résultat{rows.length > 1 ? 's' : ''} trouvé{rows.length > 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xs text-zinc-400">Pour : <em>{question}</em></span>
            {userRole === 'Admin' && (
              <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-zinc-600 dark:text-zinc-400">
                Intention : <strong>{result.intent}</strong>
              </span>
            )}
          </div>

          {/* Pipeline NLP détaillé — Admin uniquement */}
          {userRole === 'Admin' && result.pipeline && (
            <NLPPipelinePanel
              pipeline={result.pipeline}
              intent={result.intent}
              intentDescription={result.intent_description || ''}
              matchScore={result.match_score || 0}
              sparqlQuery={result.sparql_query}
              elapsedMs={result.elapsed_ms}
            />
          )}

          {/* Cartes résultats */}
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

          {/* Table générique pour les autres résultats (garanties, sinistres, habitations...) */}
          {otherRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-violet-600" />
                <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Résultats ({otherRows.length})</h2>
              </div>
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                      <tr>
                        {(result.vars || [])
                          .filter((v: string) => otherRows.some((r: any) => r[v] != null))
                          .map((v: string) => (
                          <th key={v} className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            {v.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {otherRows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                          {(result.vars || [])
                            .filter((v: string) => otherRows.some((r: any) => r[v] != null))
                            .map((v: string) => (
                            <td key={v} className="px-4 py-3 text-zinc-700 dark:text-zinc-300 max-w-[220px] truncate" title={row[v] || ''}>
                              {row[v] ?? <span className="text-zinc-400 italic">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {rows.length === 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
              Aucun résultat pour cette question dans l'ontologie.
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <Search className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
          <p className="text-sm font-semibold text-zinc-500">Posez une question ci-dessus pour démarrer</p>
          <p className="text-xs text-zinc-400 mt-1">
            {userRole === 'Expert'
              ? 'Recherchez des sinistres, déclarations ou assurés liés à vos dossiers.'
              : userRole === 'Agent'
                ? 'Recherchez des clients, contrats ou garanties dans votre portefeuille.'
                : 'Le pipeline NLTK + spaCy analysera votre question et générera une requête SPARQL.'
            }
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {getPresetQuestions(userRole).slice(0, 4).map((q, i) => (
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
