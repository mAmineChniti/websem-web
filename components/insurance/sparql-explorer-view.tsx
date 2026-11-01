'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Code2, Play, BookOpen, ChevronDown, ChevronUp,
  Copy, Check, RefreshCw, Database, Layers,
  BarChart3, Link2, AlertCircle, CheckCircle2,
  Tag, Hash, Info
} from 'lucide-react';

interface SparqlExample {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  query: string;
}

interface SparqlResult {
  vars: string[];
  count: number;
  results: Record<string, string | null>[];
  query: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  'Débutant':     'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'Intermédiaire':'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'Avancé':       'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Personnes':    <Tag className="h-3 w-3" />,
  'Contrats':     <BookOpen className="h-3 w-3" />,
  'Statistiques': <BarChart3 className="h-3 w-3" />,
  'Relations':    <Link2 className="h-3 w-3" />,
  'Ontologie':    <Layers className="h-3 w-3" />,
  'Individus':    <Database className="h-3 w-3" />,
  'Sinistres':    <AlertCircle className="h-3 w-3" />,
  'Garanties':    <CheckCircle2 className="h-3 w-3" />,
  'Déclarations': <Hash className="h-3 w-3" />,
};

export function SparqlExplorerView({ userRole = 'Admin' }: { userRole?: string }) {
  const [examples, setExamples]     = useState<SparqlExample[]>([]);
  const [query, setQuery]           = useState('');
  const [result, setResult]         = useState<SparqlResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetch(`${apiUrl}/api/ontology/sparql/examples`)
      .then(r => r.ok ? r.json() : [])
      .then(setExamples)
      .catch(() => {});
  }, []);

  const categories = ['Tous', ...Array.from(new Set(examples.map(e => e.category)))];

  const filtered = activeCategory === 'Tous'
    ? examples
    : examples.filter(e => e.category === activeCategory);

  const runQuery = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/ontology/sparql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur ${res.status}`);
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message || 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (ex: SparqlExample) => {
    setQuery(ex.query);
    setResult(null);
    setError(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const copyQuery = async () => {
    await navigator.clipboard.writeText(query).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (userRole !== 'Admin') {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Code2 className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
        <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Accès réservé à l'Administrateur</h2>
        <p className="text-sm text-zinc-500">L'explorateur SPARQL est un outil technique réservé à l'administration du système.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-200 border border-violet-400/30">
            <Code2 className="h-3.5 w-3.5 text-violet-300" />
            <span>Explorateur SPARQL Interactif</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
            Console de Requêtes SPARQL
          </h1>
          <p className="text-xs sm:text-sm text-violet-100/80 leading-relaxed">
            Interrogez directement l'ontologie OWL via des requêtes SPARQL.
            Utilisez les exemples pour explorer{' '}
            <strong className="text-white">SELECT</strong>,{' '}
            <strong className="text-white">FILTER</strong>,{' '}
            <strong className="text-white">ORDER BY</strong> et{' '}
            <strong className="text-white">GROUP BY</strong>.
          </p>
        </div>
        <div className="absolute right-6 bottom-4 hidden lg:block opacity-5">
          <Code2 className="h-52 w-52 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Left: Bibliothèque d'exemples ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-600" />
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Bibliothèque ({examples.length} requêtes)
              </span>
            </div>

            {/* Category tabs */}
            <div className="px-3 pt-3 flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Examples list */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[520px] overflow-y-auto mt-3">
              {filtered.map(ex => (
                <div key={ex.id} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                          {CATEGORY_ICONS[ex.category] || <Tag className="h-3 w-3" />}
                          {ex.category}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${DIFFICULTY_COLORS[ex.difficulty] || ''}`}>
                          {ex.difficulty}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                        {ex.title}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
                      className="shrink-0 text-zinc-400 hover:text-violet-600 transition-colors mt-0.5"
                    >
                      {expandedEx === ex.id
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {expandedEx === ex.id && (
                    <div className="mt-2 space-y-2">
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{ex.description}</p>
                      <pre className="rounded-lg bg-zinc-950 p-2 text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-32">
                        {ex.query}
                      </pre>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => loadExample(ex)}
                          className="flex-1 rounded-lg bg-violet-600 py-1.5 text-[11px] font-bold text-white hover:bg-violet-700 transition-colors"
                        >
                          Charger dans l'éditeur
                        </button>
                        <button
                          onClick={() => { loadExample(ex); setTimeout(() => runQuery(ex.query), 100); }}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors"
                        >
                          <Play className="h-3 w-3" />
                          Exécuter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Éditeur + Résultats ────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Editor */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-mono text-zinc-500">sparql-query.rq</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyQuery}
                  disabled={!query}
                  className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
                <button
                  onClick={() => { setQuery(''); setResult(null); setError(null); }}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Effacer
                </button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`# Écrivez votre requête SPARQL ici\n# Les préfixes sont ajoutés automatiquement\n\nSELECT DISTINCT ?individu ?type WHERE {\n    ?individu a ?type .\n    FILTER(!isBlank(?individu))\n}\nLIMIT 10`}
              rows={12}
              spellCheck={false}
              className="w-full resize-none bg-zinc-950 p-4 text-xs text-emerald-300 font-mono placeholder-zinc-600 focus:outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800 bg-zinc-950">
              <span className="text-[10px] text-zinc-500 font-mono">
                {query.split('\n').length} lignes · Les préfixes as:, owl:, rdfs:, xsd: sont auto-ajoutés
              </span>
              <button
                onClick={() => runQuery(query)}
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {loading
                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  : <Play className="h-3.5 w-3.5" />}
                {loading ? 'Exécution...' : 'Exécuter SPARQL'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-800 dark:text-red-300">Erreur SPARQL</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5 font-mono">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {result.count} résultat{result.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {result.vars.map(v => (
                    <span key={v} className="rounded-lg bg-violet-100 dark:bg-violet-950 px-2 py-0.5 text-[10px] font-mono font-bold text-violet-700 dark:text-violet-300">
                      ?{v}
                    </span>
                  ))}
                </div>
              </div>

              {result.count === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">
                  Aucun résultat pour cette requête.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800/80">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider w-8">#</th>
                        {result.vars.map(v => (
                          <th key={v} className="px-3 py-2 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                            ?{v}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {result.results.map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-3 py-2 text-zinc-400 font-mono">{i + 1}</td>
                          {result.vars.map(v => (
                            <td key={v} className="px-3 py-2 text-zinc-700 dark:text-zinc-300 font-mono max-w-[200px] truncate" title={row[v] || ''}>
                              {row[v] != null ? (
                                <span className={
                                  row[v]?.includes('Assure') ? 'text-emerald-700 dark:text-emerald-400' :
                                  row[v]?.includes('Agent') ? 'text-blue-700 dark:text-blue-400' :
                                  row[v]?.includes('Expert') ? 'text-amber-700 dark:text-amber-400' :
                                  row[v]?.includes('Contrat') ? 'text-violet-700 dark:text-violet-400' :
                                  row[v]?.includes('Sinistre') ? 'text-red-700 dark:text-red-400' :
                                  ''
                                }>
                                  {row[v]}
                                </span>
                              ) : (
                                <span className="text-zinc-400 italic">null</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Hint */}
          {!result && !loading && !error && (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-6 flex items-center gap-4">
              <Info className="h-8 w-8 text-zinc-300 dark:text-zinc-700 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-zinc-500">Sélectionnez un exemple ou écrivez votre requête</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cliquez sur un exemple dans la bibliothèque, puis sur{' '}
                  <strong>"Exécuter"</strong> pour interroger l'ontologie RDF.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
