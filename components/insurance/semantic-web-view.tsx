'use client';

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Sparkles, 
  Send, 
  Terminal, 
  Database, 
  FileCode, 
  CheckCircle2, 
  BookOpen, 
  Code2, 
  Download, 
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

interface OntologyStats {
  triples_count: number;
  classes_count: number;
  object_properties_count: number;
  datatype_properties_count: number;
  individuals_count: number;
  ontology_uri: string;
}

interface NLPResponse {
  question: string;
  tokens: string[];
  intent: string;
  sparql_query: string;
  explanation: string[];
  results: Record<string, any>[];
  count: number;
  vars: string[];
}

const PRESET_QUESTIONS = [
  "Quels sont les sinistres incendie ?",
  "Quel est le montant d'indemnisation versé ?",
  "Qui sont les assurés et leurs coordonnées ?",
  "Quels contrats sont enregistrés ?",
  "Quelles sont les garanties disponibles ?",
  "Quels sinistres ont été traités par un expert ?",
  "Quelles habitations sont assurées ?",
];

const PRESET_SPARQL_QUERIES = [
  {
    title: "1. Tous les sinistres et leurs experts",
    query: `SELECT ?sinistre ?typeSinistre ?date ?lieu ?description ?expert WHERE {
    ?sinistre a ?typeSinistre .
    FILTER(contains(str(?typeSinistre), 'Sinistre') && ?typeSinistre != owl:NamedIndividual)
    OPTIONAL { ?sinistre as:dateSinistre ?date }
    OPTIONAL { ?sinistre as:lieuSinistre ?lieu }
    OPTIONAL { ?sinistre as:descriptionSinistre ?description }
    OPTIONAL { ?sinistre as:expertisePar ?expert }
}`
  },
  {
    title: "2. Indemnisations et montants versés",
    query: `SELECT ?sinistre ?indemnisation ?montantIndemnise WHERE {
    ?sinistre as:donneLieuA ?indemnisation .
    OPTIONAL { ?indemnisation as:montantIndemnise ?montantIndemnise }
}`
  },
  {
    title: "3. Assurés et leurs contrats",
    query: `SELECT ?assure ?contrat ?numero ?prime WHERE {
    ?contrat as:aPourAssure ?assure .
    OPTIONAL { ?contrat as:numeroContrat ?numero }
    OPTIONAL { ?contrat as:montantPrime ?prime }
}`
  },
  {
    title: "4. Hiérarchie des classes d'assurance",
    query: `SELECT DISTINCT ?classe ?sousClasse WHERE {
    ?sousClasse rdfs:subClassOf ?classe .
    FILTER(!isBlank(?classe) && !isBlank(?sousClasse) && ?classe != owl:Thing)
} LIMIT 20`
  }
];

export function SemanticWebView() {
  const [activeTab, setActiveTab] = useState<'nlp' | 'sparql' | 'ontology'>('nlp');
  const [stats, setStats] = useState<OntologyStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // NLP State
  const [question, setQuestion] = useState(PRESET_QUESTIONS[0]);
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpResult, setNlpResult] = useState<NLPResponse | null>(null);
  const [nlpError, setNlpError] = useState<string | null>(null);

  // Custom SPARQL State
  const [customSparql, setCustomSparql] = useState(PRESET_SPARQL_QUERIES[0].query);
  const [sparqlLoading, setSparqlLoading] = useState(false);
  const [sparqlResult, setSparqlResult] = useState<any>(null);
  const [sparqlError, setSparqlError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${apiUrl}/api/ontology/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn("Could not reach backend API for ontology stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Run initial NLP query
    handleAskNLP(PRESET_QUESTIONS[0]);
  }, []);

  const handleAskNLP = async (qToSend?: string) => {
    const q = qToSend || question;
    if (!q.trim()) return;
    setNlpLoading(true);
    setNlpError(null);
    try {
      const res = await fetch(`${apiUrl}/api/ontology/nlp/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      const data = await res.json();
      setNlpResult(data);
    } catch (err: any) {
      setNlpError(err.message || "Erreur lors de la communication avec le module NLP.");
    } finally {
      setNlpLoading(false);
    }
  };

  const handleExecuteSparql = async () => {
    if (!customSparql.trim()) return;
    setSparqlLoading(true);
    setSparqlError(null);
    try {
      const res = await fetch(`${apiUrl}/api/ontology/sparql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customSparql }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Erreur HTTP: ${res.status}`);
      }
      const data = await res.json();
      setSparqlResult(data);
    } catch (err: any) {
      setSparqlError(err.message || "Erreur lors de l'exécution de la requête SPARQL.");
    } finally {
      setSparqlLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Web Sémantique & Ontologie */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-zinc-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 border border-blue-400/30">
            <Network className="h-3.5 w-3.5 text-blue-300" />
            <span>Projet Web Sémantique — Ontologie Protégé & Moteur SPARQL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
            Moteur Sémantique & Traducteur NLP $\rightarrow$ SPARQL
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Chargement direct de l'ontologie d'assurance habitation (<code className="rounded bg-white/10 px-1 py-0.5 text-blue-200">assurance.rdf</code>) avec <strong className="text-white">rdflib</strong>, exécution de requêtes SPARQL et traduction de questions en langage naturel via <strong className="text-white">NLTK</strong> sans API de LLM tierce.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <a
              href="/assurance.rdf"
              download="assurance.rdf"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 font-semibold text-white backdrop-blur hover:bg-white/20 transition-colors border border-white/20"
            >
              <Download className="h-3.5 w-3.5 text-blue-300" />
              <span>Télécharger l'ontologie RDF/XML</span>
            </a>
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/60 px-3 py-1.5 font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
              <span>Rafraîchir les métriques</span>
            </button>
          </div>
        </div>

        <div className="absolute right-6 bottom-4 hidden lg:block opacity-10">
          <Database className="h-44 w-44 text-white" />
        </div>
      </div>

      {/* Ontology Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-medium text-zinc-500">Triplets RDF</span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats?.triples_count || 398}
          </div>
          <span className="text-[10px] text-zinc-400">Graphe parsé XML</span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-medium text-zinc-500">Classes OWL</span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {stats?.classes_count || 47}
          </div>
          <span className="text-[10px] text-zinc-400">Sinistre, Personne, etc.</span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-medium text-zinc-500">Object Properties</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats?.object_properties_count || 13}
          </div>
          <span className="text-[10px] text-zinc-400">Relations inter-classes</span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[11px] font-medium text-zinc-500">Data Properties</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats?.datatype_properties_count || 25}
          </div>
          <span className="text-[10px] text-zinc-400">Attributs & valeurs</span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-zinc-500">Individus</span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {stats?.individuals_count || 35}
          </div>
          <span className="text-[10px] text-zinc-400">Instances créées</span>
        </div>
      </div>

      {/* Sub-tabs: NLP Translator / SPARQL Console / Structure Ontologie */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('nlp')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'nlp'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Traducteur Intelligent (NLP/TALN $\rightarrow$ SPARQL)</span>
        </button>

        <button
          onClick={() => setActiveTab('sparql')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'sparql'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>Éditeur & Console SPARQL</span>
        </button>

        <button
          onClick={() => setActiveTab('ontology')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'ontology'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Structure de l'Ontologie Protégé</span>
        </button>
      </div>

      {/* TAB 1: NLP TRANSLATOR */}
      {activeTab === 'nlp' && (
        <div className="space-y-5">
          {/* Preset question chips */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
              Questions Types pour la Démonstration :
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleAskNLP(q);
                  }}
                  className="rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Natural language input bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskNLP();
              }}
              className="pt-2 flex items-center gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Posez votre question en français (ex: Quels sont les sinistres incendie ?)..."
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 shadow-inner"
              />
              <button
                type="submit"
                disabled={nlpLoading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <span>{nlpLoading ? 'Traduction NLTK...' : 'Traduire & Exécuter'}</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Results of NLP */}
          {nlpError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {nlpError}
            </div>
          )}

          {nlpResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: NLP Pipeline & SPARQL Generated */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Pipeline NLP (NLTK) & SPARQL Généré
                    </h3>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {nlpResult.intent}
                  </span>
                </div>

                {/* Explanation steps for the oral presentation */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Étapes de Traduction Automatique (Soutenance) :
                  </span>
                  <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-3 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                    {nlpResult.explanation.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SPARQL Query code block */}
                <div>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 block text-xs mb-1">
                    Requête SPARQL produite :
                  </span>
                  <pre className="rounded-2xl bg-zinc-950 p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto shadow-inner">
                    {nlpResult.sparql_query}
                  </pre>
                </div>
              </div>

              {/* Right Column: Execution results on RDF Graph */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Résultats du Graphe RDF ({nlpResult.count} trouvés)
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">Graph().query(...)</span>
                </div>

                {nlpResult.results.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    Aucun résultat renvoyé par le graphe pour cette requête.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-100/70 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 uppercase text-[10px] font-bold">
                        <tr>
                          {nlpResult.vars.map((v) => (
                            <th key={v} className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
                              ?{v}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[11px]">
                        {nlpResult.results.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                            {nlpResult.vars.map((v) => (
                              <td key={v} className="px-3 py-2 font-mono text-zinc-800 dark:text-zinc-200">
                                {row[v] !== null && row[v] !== undefined ? String(row[v]) : (
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
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SPARQL CONSOLE */}
      {activeTab === 'sparql' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                Exemples de requêtes SPARQL préparées :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SPARQL_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCustomSparql(preset.query)}
                    className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Query Editor */}
            <div className="space-y-2">
              <textarea
                rows={7}
                value={customSparql}
                onChange={(e) => setCustomSparql(e.target.value)}
                placeholder="Tapez votre requête SPARQL ici..."
                className="w-full rounded-2xl bg-zinc-950 p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleExecuteSparql}
                disabled={sparqlLoading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Terminal className="h-4 w-4" />
                <span>{sparqlLoading ? 'Exécution en cours...' : 'Exécuter sur Graph().query()'}</span>
              </button>
            </div>
          </div>

          {sparqlError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <strong>Erreur SPARQL :</strong> {sparqlError}
            </div>
          )}

          {sparqlResult && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                  Résultats SPARQL ({sparqlResult.count} lignes)
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">Format JSON retourné par l'API</span>
              </div>

              {sparqlResult.count === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">
                  Aucun résultat trouvé pour cette requête SPARQL.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100/70 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 uppercase text-[10px] font-bold">
                      <tr>
                        {sparqlResult.vars.map((v: string) => (
                          <th key={v} className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
                            ?{v}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[11px]">
                      {sparqlResult.results.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          {sparqlResult.vars.map((v: string) => (
                            <td key={v} className="px-3 py-2 font-mono text-zinc-800 dark:text-zinc-200">
                              {row[v] !== null && row[v] !== undefined ? String(row[v]) : (
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
        </div>
      )}

      {/* TAB 3: ONTOLOGY STRUCTURE VIEW */}
      {activeTab === 'ontology' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Classes Hierarchy */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Layers className="h-4 w-4 text-blue-600" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Hiérarchie des Classes (Protégé)
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3 border border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-blue-600 block">Personne</span>
                <span className="text-[11px] text-zinc-500 pl-4 block">&bull; Agent, Assure, Beneficiaire, Expert</span>
              </div>
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3 border border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-emerald-600 block">Contrat</span>
                <span className="text-[11px] text-zinc-500 pl-4 block">&bull; ContratProprietaire, ContratLocataire, ContratCopropriete</span>
              </div>
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3 border border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-amber-600 block">Sinistre</span>
                <span className="text-[11px] text-zinc-500 pl-4 block">&bull; SinistreIncendie, SinistreVol, SinistreDegatDesEaux, SinistreBrisDeGlace, SinistreCatastropheNaturelle</span>
              </div>
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3 border border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-teal-600 block">Garantie</span>
                <span className="text-[11px] text-zinc-500 pl-4 block">&bull; GarantieIncendie, GarantieVol, GarantieDegatDesEaux, GarantieBrisDeGlace, GarantieResponsabiliteCivile</span>
              </div>
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3 border border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-purple-600 block">Habitation</span>
                <span className="text-[11px] text-zinc-500 pl-4 block">&bull; Maison, Appartement, Studio, Villa</span>
              </div>
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3 border border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-rose-600 block">Indemnisation & Declaration</span>
                <span className="text-[11px] text-zinc-500 pl-4 block">&bull; IndemnisationTotale, IndemnisationPartielle, IndemnisationRefusee, DeclarationEnCours, DeclarationAcceptee</span>
              </div>
            </div>
          </div>

          {/* Properties Defined */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <Code2 className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Object Properties (13 Relations)
                </h3>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {[
                  'aPourAssure', 'aPourBien', 'aPourClause', 'couvre', 
                  'declareSinistre', 'donneLieuA', 'estCouvertPar', 
                  'estDeclarePar', 'estJustifiePar', 'expertisePar', 
                  'faitObjetDe', 'provoqueDommage', 'souscritContrat'
                ].map((prop) => (
                  <span
                    key={prop}
                    className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-mono text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <FileCode className="h-4 w-4 text-amber-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Datatype Properties (25 Attributs)
                </h3>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {[
                  'nom', 'prenom', 'cin', 'telephone', 'adresse', 'numeroContrat',
                  'dateDebut', 'dateFin', 'montantPrime', 'plafondGarantie',
                  'tauxFranchise', 'dateSinistre', 'lieuSinistre', 'descriptionSinistre',
                  'niveauGravite', 'texteClause', 'montantIndemnise', 'tauxIndemnisation',
                  'adresseBien', 'superficie', 'valeurBien', 'dateDeclaration', 'statutDeclaration',
                  'nomFichier', 'dateUpload'
                ].map((prop) => (
                  <span
                    key={prop}
                    className="rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-mono text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300 block mb-1">
                Individus Exemple dans le Graphe :
              </span>
              <p className="text-xs text-zinc-500 leading-relaxed">
                <code className="text-blue-600 font-mono">Sinistre1</code> (SinistreIncendie survenu au 12 rue des Oliviers, déclaré par <code className="text-blue-600 font-mono">Assure1</code>, expertisé par <code className="text-blue-600 font-mono">Expert1</code>, donnant lieu à <code className="text-blue-600 font-mono">Indemnisation1</code> de 45 000 €).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
