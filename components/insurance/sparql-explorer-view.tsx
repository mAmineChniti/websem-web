'use client';

import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listSparqlExamples, runSparql } from '@/lib/services/sparql';
import { cn } from '@/lib/utils';
import {
  isSparqlSelectResult,
  isSparqlAskResult,
  type SparqlSelectResult,
} from '@/lib/types/sparql';
import type { SparqlExample } from '@/lib/types/sparql';
import {
  Code2,
  Play,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  Database,
  Layers,
  BarChart3,
  Link2,
  AlertCircle,
  CheckCircle2,
  Tag,
  Hash,
  Info,
} from 'lucide-react';

const DIFFICULTY_COLORS: Record<string, string> = {
  Débutant: 'bg-muted text-primary dark:bg-muted dark:text-primary',
  Intermédiaire: 'bg-muted text-primary dark:bg-muted dark:text-primary',
  Avancé: 'bg-muted text-destructive dark:bg-muted dark:text-destructive',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Personnes: <Tag className="h-3 w-3" />,
  Contrats: <BookOpen className="h-3 w-3" />,
  Statistiques: <BarChart3 className="h-3 w-3" />,
  Relations: <Link2 className="h-3 w-3" />,
  Ontologie: <Layers className="h-3 w-3" />,
  Individus: <Database className="h-3 w-3" />,
  Sinistres: <AlertCircle className="h-3 w-3" />,
  Garanties: <CheckCircle2 className="h-3 w-3" />,
  Déclarations: <Hash className="h-3 w-3" />,
};

export function SparqlExplorerView({
  userRole = 'Admin',
}: {
  userRole?: string;
}) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SparqlSelectResult | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [expandedEx, setExpandedEx] = useState<string | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const examplesQuery = useQuery({
    queryKey: ['sparql-examples'],
    queryFn: listSparqlExamples,
  });
  const runMutation = useMutation({
    mutationFn: runSparql,
  });
  const examples: SparqlExample[] = examplesQuery.data ?? [];
  const loading = runMutation.isPending;

  const categories = ['Tous', ...new Set(examples.map((e) => e.category))];

  const filtered =
    activeCategory === 'Tous'
      ? examples
      : examples.filter((e) => e.category === activeCategory);

  const runQuery = (q: string) => {
    if (!q.trim()) return;
    setError(undefined);
    setResult(undefined);
    setInfo(undefined);
    void runMutation
      .mutateAsync(q)
      .then((data) => {
        if (isSparqlAskResult(data)) {
          setInfo(`Résultat booléen : ${data.boolean ? 'vrai' : 'faux'}`);
          return;
        }
        if (!isSparqlSelectResult(data)) {
          const detail =
            data.type === 'UPDATE'
              ? `Requête exécutée : ${data.type.toLowerCase()} (${data.total_triples} triplets)`
              : `Requête exécutée : ${data.type.toLowerCase()} (${data.count} résultat(s))`;
          setInfo(detail);
          return;
        }
        setResult({
          ...data,
          results: data.results.map((row) => {
            const normalized: Record<string, string | null> = {};
            for (const [key, value] of Object.entries(row)) {
              normalized[key] = value;
            }
            return normalized;
          }),
        });
      })
      .catch((error_: unknown) => {
        setError(
          error_ instanceof Error
            ? error_.message
            : 'Erreur de connexion au serveur.'
        );
      });
  };

  const loadExample = (ex: SparqlExample) => {
    setQuery(ex.query);
    setResult(undefined);
    setError(undefined);
    setInfo(undefined);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const copyQuery = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Impossible de copier la requête dans le presse-papiers.');
    }
  };

  if (userRole !== 'Admin') {
    return (
      <div className="border-border bg-card dark:border-border dark:bg-card rounded-3xl border p-10 text-center shadow-sm">
        <Code2 className="text-muted-foreground dark:text-foreground mx-auto mb-4 h-12 w-12" />
        <h2 className="text-foreground dark:text-muted-foreground mb-2 text-lg font-bold">
          Accès réservé à l&apos;Administrateur
        </h2>
        <p className="text-muted-foreground text-sm">
          L&apos;explorateur SPARQL est un outil technique réservé à
          l&apos;administration du système.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="from-primary via-primary to-card text-primary-foreground relative overflow-hidden rounded-3xl bg-linear-to-br p-6 shadow-xl sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="border-border bg-muted text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
            <Code2 className="text-primary h-3.5 w-3.5" />
            <span>Explorateur SPARQL Interactif</span>
          </div>
          <h1 className="text-primary-foreground font-serif text-2xl font-extrabold tracking-tight sm:text-3xl">
            Console de Requêtes SPARQL
          </h1>
          <p className="text-primary text-xs leading-relaxed sm:text-sm">
            Interrogez directement l&apos;ontologie OWL via des requêtes SPARQL.
            Utilisez les exemples pour explorer{' '}
            <strong className="text-primary-foreground">SELECT</strong>,{' '}
            <strong className="text-primary-foreground">FILTER</strong>,{' '}
            <strong className="text-primary-foreground">ORDER BY</strong> et{' '}
            <strong className="text-primary-foreground">GROUP BY</strong>.
          </p>
        </div>
        <div className="absolute right-6 bottom-4 hidden opacity-5 lg:block">
          <Code2 className="text-primary-foreground h-52 w-52" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* ── Left: Bibliothèque d'exemples ─────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          <div className="border-border bg-card dark:border-border dark:bg-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-border dark:border-border flex items-center gap-2 border-b p-4">
              <BookOpen className="text-primary h-4 w-4" />
              <span className="text-foreground dark:text-foreground text-sm font-bold">
                Bibliothèque ({examples.length} requêtes)
              </span>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 px-3 pt-3">
              {categories.map((cat) => (
                <Button
                  type="button"
                  variant={activeCategory === cat ? 'default' : 'secondary'}
                  size="sm"
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Examples list */}
            <div className="divide-border dark:divide-border mt-3 max-h-130 divide-y overflow-y-auto">
              {examplesQuery.isError ? (
                <div className="border-destructive/30 bg-destructive/10 text-destructive m-3 rounded-xl border p-3 text-xs">
                  <p className="font-semibold">
                    Impossible de charger les exemples SPARQL.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void examplesQuery.refetch()}
                    className="mt-2 rounded-lg text-[11px]"
                  >
                    Réessayer
                  </Button>
                </div>
              ) : examplesQuery.isLoading ? (
                <p className="text-muted-foreground p-6 text-center text-xs">
                  Chargement des exemples...
                </p>
              ) : filtered.length === 0 ? (
                <p className="text-muted-foreground p-6 text-center text-xs">
                  Aucun exemple dans cette catégorie.
                </p>
              ) : (
                filtered.map((ex) => (
                  <div
                    key={ex.id}
                    className="hover:bg-muted p-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
                            {CATEGORY_ICONS[ex.category] || (
                              <Tag className="h-3 w-3" />
                            )}
                            {ex.category}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[9px] font-bold',
                              DIFFICULTY_COLORS[ex.difficulty]
                            )}
                          >
                            {ex.difficulty}
                          </span>
                        </div>
                        <p className="text-foreground dark:text-foreground text-xs leading-tight font-semibold">
                          {ex.title}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          setExpandedEx(
                            expandedEx === ex.id ? undefined : ex.id
                          )
                        }
                      >
                        {expandedEx === ex.id ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    {expandedEx === ex.id && (
                      <div className="mt-2 space-y-2">
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {ex.description}
                        </p>
                        <pre className="bg-background text-primary max-h-32 overflow-x-auto rounded-lg p-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                          {ex.query}
                        </pre>
                        <div className="flex gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              void loadExample(ex);
                            }}
                            className="flex-1 rounded-lg py-1.5 text-[11px] font-bold"
                          >
                            Charger dans l&apos;éditeur
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              void loadExample(ex);
                              setTimeout(() => {
                                void runQuery(ex.query);
                              }, 100);
                            }}
                            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold"
                          >
                            <Play className="h-3 w-3" />
                            Exécuter
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Éditeur + Résultats ────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-3">
          {/* Editor */}
          <div className="border-border bg-card dark:border-border dark:bg-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-border bg-muted dark:border-border dark:bg-card/50 flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="bg-muted h-3 w-3 rounded-full" />
                  <div className="bg-muted h-3 w-3 rounded-full" />
                  <div className="bg-muted h-3 w-3 rounded-full" />
                </div>
                <span className="text-muted-foreground font-mono text-xs">
                  sparql-query.rq
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyQuery}
                  disabled={!query}
                  className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-40"
                >
                  {copied ? (
                    <Check className="text-primary h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? 'Copié !' : 'Copier'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setResult(undefined);
                    setError(undefined);
                  }}
                  className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
                >
                  Effacer
                </Button>
              </div>
            </div>
            <Textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`# Écrivez votre requête SPARQL ici\n# Les préfixes sont ajoutés automatiquement\n\nSELECT DISTINCT ?individu ?type WHERE {\n    ?individu a ?type .\n    FILTER(!isBlank(?individu))\n}\nLIMIT 10`}
              rows={12}
              spellCheck={false}
              className="bg-background text-primary placeholder-muted-foreground w-full resize-none p-4 font-mono text-xs leading-relaxed focus:outline-none"
            />
            <div className="border-border bg-background flex items-center justify-between border-t px-4 py-2.5">
              <span className="text-muted-foreground font-mono text-[10px]">
                {query.split('\n').length} lignes · Les préfixes as:, owl:,
                rdfs:, xsd: sont auto-ajoutés
              </span>
              <Button
                type="button"
                size="lg"
                onClick={() => runQuery(query)}
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold shadow"
              >
                {loading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {loading ? 'Exécution...' : 'Exécuter SPARQL'}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="border-border bg-muted dark:border-border dark:bg-muted flex items-start gap-3 rounded-2xl border px-4 py-3">
              <AlertCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-destructive dark:text-destructive text-xs font-bold">
                  Erreur SPARQL
                </p>
                <p className="text-destructive dark:text-destructive mt-0.5 font-mono text-xs">
                  {error}
                </p>
              </div>
            </div>
          )}

          {info && (
            <div className="border-border bg-muted dark:border-border dark:bg-muted flex items-start gap-3 rounded-2xl border px-4 py-3">
              <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-foreground mt-0.5 font-mono text-xs">{info}</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="border-border bg-card dark:border-border dark:bg-card overflow-hidden rounded-2xl border shadow-sm">
              <div className="border-border dark:border-border flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-primary h-4 w-4" />
                  <span className="text-foreground dark:text-foreground text-sm font-bold">
                    {result.count} résultat{result.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {result.vars.map((v) => (
                    <span
                      key={v}
                      className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold"
                    >
                      ?{v}
                    </span>
                  ))}
                </div>
              </div>

              {result.count === 0 ? (
                <div className="text-muted-foreground p-8 text-center text-sm">
                  Aucun résultat pour cette requête.
                </div>
              ) : (
                <div className="max-h-72 overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted dark:bg-card/80 sticky top-0">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-muted-foreground h-auto w-8 px-3 py-2 text-left text-[10px] font-bold tracking-wider uppercase">
                          #
                        </TableHead>
                        {result.vars.map((v) => (
                          <TableHead
                            key={v}
                            className="text-muted-foreground h-auto px-3 py-2 text-left font-mono text-[10px] font-bold tracking-wider uppercase"
                          >
                            ?{v}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.results.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-muted-foreground px-3 py-2 font-mono">
                            {i + 1}
                          </TableCell>
                          {result.vars.map((v) => (
                            <TableCell
                              key={v}
                              className="text-foreground dark:text-muted-foreground max-w-50 truncate px-3 py-2 font-mono"
                              title={row[v] || ''}
                            >
                              {row[v] == undefined ? (
                                <span className="text-muted-foreground italic">
                                  undefined
                                </span>
                              ) : (
                                <span
                                  className={cn(
                                    (row[v]?.includes('Assure') ||
                                      row[v]?.includes('Agent') ||
                                      row[v]?.includes('Expert') ||
                                      row[v]?.includes('Contrat')) &&
                                      'text-primary',
                                    row[v]?.includes('Sinistre') &&
                                      'text-destructive'
                                  )}
                                >
                                  {row[v]}
                                </span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Hint */}
          {!result && !loading && !error && (
            <div className="border-border bg-muted/50 dark:border-border dark:bg-card/40 flex items-center gap-4 rounded-2xl border border-dashed p-6">
              <Info className="text-muted-foreground dark:text-foreground h-8 w-8 shrink-0" />
              <div>
                <p className="text-muted-foreground text-sm font-semibold">
                  Sélectionnez un exemple ou écrivez votre requête
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Cliquez sur un exemple dans la bibliothèque, puis sur{' '}
                  <strong>&quot;Exécuter&quot;</strong> pour interroger
                  l&apos;ontologie RDF.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
