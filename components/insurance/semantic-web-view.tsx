'use client';

import type { CardStyle, NullableStringRecord } from '@/lib/types/ui';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askNlp } from '@/lib/services/nlp';
import { getStats } from '@/lib/services/stats';
import { cn } from '@/lib/utils';
import type { NlpAskResult, NlpPipeline } from '@/lib/types/nlp';
import {
  Search,
  Sparkles,
  Send,
  Users,
  FileCheck2,
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  Shield,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  Cpu,
  GitBranch,
  Hash,
  Tag,
} from 'lucide-react';

const QUESTIONS_BY_ROLE: Record<string, string[]> = {
  Expert: [
    'Quels sont les sinistres déclarés ?',
    'Y a-t-il eu un incendie ?',
    'Quels sont les dommages signalés ?',
    'Quelles déclarations sont en cours ?',
    'Qui sont les assurés concernés ?',
    'Quelles garanties couvrent les sinistres ?',
  ],
  Agent: [
    'Qui sont mes assurés ?',
    'Quels contrats sont actifs ?',
    'Quels sont les contrats propriétaire ?',
    'Quels sont les contrats locataire ?',
    'Montant des primes par contrat ?',
    "Combien d'assurés sont enregistrés ?",
    'Quelles garanties sont disponibles ?',
  ],
  Admin: [
    'Qui sont les assurés enregistrés ?',
    'Quels sont les contrats propriétaire ?',
    'Quels sont les contrats locataire ?',
    "Liste des agents d'assurance ?",
    'Liste des experts enregistrés ?',
    'Montant des primes par contrat ?',
    'Quels sont les sinistres déclarés ?',
    'Liste des garanties disponibles ?',
    'Quelles sont les déclarations en cours ?',
    "Combien d'assurés sont enregistrés ?",
  ],
};

function getPresetQuestions(role: string): string[] {
  return QUESTIONS_BY_ROLE[role] || QUESTIONS_BY_ROLE['Admin'];
}

function isPersonRow(row: NullableStringRecord): boolean {
  // Un résultat est une "personne" seulement s'il a un nom ou prénom rempli
  // ET qu'il n'a PAS de champs spécifiques à d'autres entités (sinistre, garantie, habitation, déclaration)
  const hasName = !!(
    row.nom ||
    row.prenom ||
    row.nomAssure ||
    row.prenomAssure
  );
  if (!hasName) return false;

  // Exclure si c'est clairement un sinistre, garantie, habitation ou déclaration
  const isSinistre =
    row.sinistre ||
    row.typeSinistre ||
    row.dateSinistre ||
    row.lieuSinistre ||
    row.descriptionSinistre;
  const isGarantie =
    row.garantie || row.typeGarantie || row.plafond || row.tauxFranchise;
  const isHabitation = row.habitation || row.typeHabitation || row.superficie;
  const isDeclaration =
    row.declaration ||
    row.typeDeclaration ||
    row.dateDeclaration ||
    row.statutDeclaration;
  const isIndemnisation =
    row.indemnisation || row.typeIndemnisation || row.montantIndemnisation;
  if (
    isSinistre ||
    isGarantie ||
    isHabitation ||
    isDeclaration ||
    isIndemnisation
  )
    return false;

  return true;
}

function isContratRow(row: NullableStringRecord): boolean {
  const str = JSON.stringify(row).toLowerCase();
  return (
    (str.includes('contrat') ||
      str.includes('prime') ||
      str.includes('numero')) &&
    !str.includes('cin') &&
    !str.includes('telephone')
  );
}

function isGarantieRow(row: NullableStringRecord): boolean {
  return !!(
    row.garantie ||
    row.typeGarantie ||
    row.plafond ||
    row.taux ||
    row.texteClause ||
    row.clause
  );
}

function isSinistreRow(row: NullableStringRecord): boolean {
  return !!(
    row.sinistre ||
    row.typeSinistre ||
    row.dateSinistre ||
    row.lieuSinistre ||
    row.descriptionSinistre ||
    (row.description && (row.assureNom || row.prenomAssure || row.statut))
  );
}

function PersonCard({ data }: { data: NullableStringRecord }) {
  const raw = String(
    data.assure || data.agent || data.expert || data.personne || data.type || ''
  );
  const kind =
    ['Assure', 'Agent', 'Expert', 'Beneficiaire'].find((k) =>
      raw.includes(k)
    ) || 'Assure';
  const map: Record<string, CardStyle> = {
    Assure: { label: 'Assuré', color: 'blue' },
    Agent: { label: 'Agent', color: 'violet' },
    Expert: { label: 'Expert', color: 'amber' },
    Beneficiaire: { label: 'Bénéficiaire', color: 'emerald' },
  };
  const m = map[kind];
  const bgClass: Record<string, string> = {
    blue: 'bg-muted border-border',
    violet: 'bg-muted border-border',
    amber: 'bg-muted border-border',
    emerald: 'bg-muted border-border',
  };
  const bdgClass: Record<string, string> = {
    blue: 'bg-muted text-primary',
    violet: 'bg-muted text-primary',
    amber: 'bg-muted text-primary',
    emerald: 'bg-muted text-primary',
  };
  const nom = [data.prenom, data.nom].filter(Boolean).join(' ') || '-';
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border p-4',
        bgClass[m.color]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-bold">{nom}</span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
            bdgClass[m.color]
          )}
        >
          {m.label}
        </span>
      </div>
      <div className="text-muted-foreground mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {data.cin && (
          <span className="flex items-center gap-1.5">
            <CreditCard className="h-3 w-3 opacity-60" />
            CIN : <strong className="text-foreground">{data.cin}</strong>
          </span>
        )}
        {data.telephone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 opacity-60" />
            Tel : <strong className="text-foreground">{data.telephone}</strong>
          </span>
        )}
        {data.adresse && (
          <span className="col-span-2 flex items-center gap-1.5">
            <MapPin className="h-3 w-3 opacity-60" />
            <strong className="text-foreground">{data.adresse}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

function ContratCard({ data }: { data: NullableStringRecord }) {
  const raw = String(data.typeContrat || data.contrat || '');
  const kind =
    ['Proprietaire', 'Locataire', 'Copropriete'].find((k) => raw.includes(k)) ||
    'Proprietaire';
  const map: Record<string, CardStyle> = {
    Proprietaire: { label: 'Propriétaire', color: 'blue' },
    Locataire: { label: 'Locataire', color: 'violet' },
    Copropriete: { label: 'Copropriété', color: 'emerald' },
  };
  const m = map[kind];
  const bgClass: Record<string, string> = {
    blue: 'bg-muted border-border',
    violet: 'bg-muted border-border',
    emerald: 'bg-muted border-border',
  };
  const bdgClass: Record<string, string> = {
    blue: 'bg-muted text-primary',
    violet: 'bg-muted text-primary',
    emerald: 'bg-muted text-primary',
  };
  const numero =
    data.numeroContrat ||
    String(data.contrat || '')
      .split('#')
      .pop() ||
    '-';
  const prime = data.montantPrime ? `${data.montantPrime} DT` : undefined;
  const assure = data.assure ? String(data.assure).split('#').pop() : undefined;
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border p-4',
        bgClass[m.color]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-bold">
          Contrat N° {numero}
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
            bdgClass[m.color]
          )}
        >
          {m.label}
        </span>
      </div>
      <div className="text-muted-foreground mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {prime && (
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 opacity-60" />
            Prime : <strong className="text-foreground">{prime}</strong>
          </span>
        )}
        {assure && (
          <span className="flex items-center gap-1.5">
            <User className="h-3 w-3 opacity-60" />
            Assuré : <strong className="text-foreground">{assure}</strong>
          </span>
        )}
        {data.dateDebut && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 opacity-60" />
            Début :{' '}
            <strong className="text-foreground">{data.dateDebut}</strong>
          </span>
        )}
        {data.dateFin && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 opacity-60" />
            Fin : <strong className="text-foreground">{data.dateFin}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

function GarantieCard({ data }: { data: NullableStringRecord }) {
  const raw = String(data.typeGarantie || data.garantie || '');
  const label = raw.split('#').pop() || 'Garantie';
  const plafond = data.plafond ? `${data.plafond} DT` : undefined;
  const taux = data.taux ? `${data.taux}%` : undefined;
  const contratList = data.contrats
    ? String(data.contrats)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const sinistreList = data.sinistres
    ? String(data.sinistres)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="border-border bg-muted flex flex-col gap-2 rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-bold">
          {data.garantie ? String(data.garantie).split('#').pop() : label}
        </span>
        <span className="bg-muted text-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold">
          {label}
        </span>
      </div>
      <div className="text-muted-foreground mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {plafond && (
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 opacity-60" />
            Plafond : <strong className="text-foreground">{plafond}</strong>
          </span>
        )}
        {taux && (
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 opacity-60" />
            Franchise : <strong className="text-foreground">{taux}</strong>
          </span>
        )}
        {data.texteClause && (
          <span className="col-span-2 flex items-center gap-1.5">
            <FileCheck2 className="h-3 w-3 opacity-60" />
            <strong className="text-foreground">{data.texteClause}</strong>
          </span>
        )}
        {contratList.length > 0 && (
          <span className="col-span-2 flex items-center gap-1.5">
            <FileCheck2 className="h-3 w-3 opacity-60" />
            Contrats :{' '}
            <strong className="text-foreground">
              {contratList.join(', ')}
            </strong>
          </span>
        )}
        {sinistreList.length > 0 && (
          <span className="col-span-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 opacity-60" />
            Sinistres couverts :{' '}
            <strong className="text-foreground">
              {sinistreList.join(', ')}
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}

function SinistreCard({ data }: { data: NullableStringRecord }) {
  const type =
    String(data.typeSinistre || '')
      .split('#')
      .pop() || 'Sinistre';
  const assure =
    [data.prenomAssure, data.nomAssure].filter(Boolean).join(' ') ||
    (data.assure ? String(data.assure).split('#').pop() : undefined);
  const garantieList = data.garanties
    ? String(data.garanties)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const expertList = data.experts
    ? String(data.experts)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="border-border bg-muted flex flex-col gap-2 rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-bold">
          {data.sinistre ? String(data.sinistre).split('#').pop() : type}
        </span>
        <span className="bg-muted text-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold">
          {type}
        </span>
      </div>
      <div className="text-muted-foreground mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {data.dateSinistre && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 opacity-60" />
            Date :{' '}
            <strong className="text-foreground">{data.dateSinistre}</strong>
          </span>
        )}
        {data.lieuSinistre && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 opacity-60" />
            Lieu :{' '}
            <strong className="text-foreground">{data.lieuSinistre}</strong>
          </span>
        )}
        {assure && (
          <span className="flex items-center gap-1.5">
            <User className="h-3 w-3 opacity-60" />
            Assuré : <strong className="text-foreground">{assure}</strong>
          </span>
        )}
        {data.statut && (
          <span className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 opacity-60" />
            Statut : <strong className="text-foreground">{data.statut}</strong>
          </span>
        )}
        {data.montantIndemnise && (
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 opacity-60" />
            Indemnité :{' '}
            <strong className="text-foreground">
              {data.montantIndemnise} DT
            </strong>
          </span>
        )}
        {(data.description || data.descriptionSinistre) && (
          <span className="col-span-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 opacity-60" />
            <strong className="text-foreground">
              {data.description || data.descriptionSinistre}
            </strong>
          </span>
        )}
        {garantieList.length > 0 && (
          <span className="col-span-2 flex items-center gap-1.5">
            <Shield className="h-3 w-3 opacity-60" />
            Garanties :{' '}
            <strong className="text-foreground">
              {garantieList.join(', ')}
            </strong>
          </span>
        )}
        {expertList.length > 0 && (
          <span className="col-span-2 flex items-center gap-1.5">
            <User className="h-3 w-3 opacity-60" />
            Experts :{' '}
            <strong className="text-foreground">{expertList.join(', ')}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Pipeline NLP Panel ────────────────────────────────────────────────────────
function NLPPipelinePanel({
  pipeline,
  intent,
  intentDescription,
  matchScore,
  sparqlQuery,
  elapsedMs,
}: {
  pipeline: NlpPipeline;
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
  const step4 = pipeline?.step4_slots;

  return (
    <div className="border-border bg-muted dark:border-border dark:bg-muted overflow-hidden rounded-2xl border">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="flex h-auto w-full items-center justify-between rounded-none px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Brain className="text-primary dark:text-primary h-4 w-4" />
          <span className="text-primary dark:text-primary text-sm font-bold">
            Pipeline NLP/TALN — Détails du traitement
          </span>
          {elapsedMs && (
            <span className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
              {elapsedMs} ms
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="text-primary h-4 w-4" />
        ) : (
          <ChevronDown className="text-primary h-4 w-4" />
        )}
      </Button>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          {/* Step 1 — NLTK */}
          {step1 && (
            <div className="bg-card dark:bg-card border-border dark:border-border rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary-foreground bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                  1
                </span>
                <span className="text-foreground dark:text-foreground text-xs font-bold">
                  NLTK — Tokenisation & Stemming
                </span>
                <span className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-full px-2 py-0.5 font-mono text-[9px]">
                  {step1.library}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-muted-foreground font-semibold">
                    Tokens filtrés :
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(step1.tokens || []).map((t: string, i: number) => (
                      <span
                        key={i}
                        className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-lg px-1.5 py-0.5 font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">
                    Stems (SnowballStemmer fr) :
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(step1.stems || []).map((s: string, i: number) => (
                      <span
                        key={i}
                        className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-lg px-1.5 py-0.5 font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — spaCy */}
          {step2 && (
            <div className="bg-card dark:bg-card border-border dark:border-border rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary-foreground bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                  2
                </span>
                <span className="text-foreground dark:text-foreground text-xs font-bold">
                  spaCy — NER & POS Tagging
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-mono text-[9px] font-bold',
                    step2.available
                      ? 'bg-muted text-primary dark:bg-muted dark:text-primary'
                      : 'bg-muted text-destructive dark:bg-muted dark:text-destructive'
                  )}
                >
                  {step2.available ? '✓ fr_core_news_sm' : '⚠ non disponible'}
                </span>
              </div>
              {step2.available ? (
                <div className="space-y-1.5 text-[11px]">
                  {step2.entities && step2.entities.length > 0 ? (
                    <div>
                      <span className="text-muted-foreground font-semibold">
                        Entités détectées (NER) :
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {step2.entities.map((e, i) => (
                          <span
                            key={i}
                            className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-lg px-1.5 py-0.5 font-mono"
                          >
                            {e.text}{' '}
                            <span className="text-[9px] opacity-60">
                              ({e.label})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Aucune entité nommée détectée dans cette question.
                    </p>
                  )}
                  {step2.noun_chunks && step2.noun_chunks.length > 0 && (
                    <div>
                      <span className="text-muted-foreground font-semibold">
                        Groupes nominaux :
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {step2.noun_chunks.map((c: string, i: number) => (
                          <span
                            key={i}
                            className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-lg px-1.5 py-0.5 font-mono"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-[11px]">
                  spaCy non disponible — utilisez NLTK uniquement.
                </p>
              )}
            </div>
          )}

          {/* Step 3 — Intent */}
          {step3 && (
            <div className="bg-card dark:bg-card border-border dark:border-border rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary-foreground bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                  3
                </span>
                <span className="text-foreground dark:text-foreground text-xs font-bold">
                  Intent Matcher → SPARQL
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <p>
                  <span className="text-muted-foreground font-semibold">
                    Intention détectée :
                  </span>{' '}
                  <span className="text-primary dark:text-primary font-mono font-bold">
                    {intent}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground font-semibold">
                    Description :
                  </span>{' '}
                  {intentDescription}
                </p>
                <p>
                  <span className="text-muted-foreground font-semibold">
                    Score de correspondance :
                  </span>{' '}
                  <span className="text-primary dark:text-primary font-bold">
                    {matchScore}
                  </span>{' '}
                  <span className="text-muted-foreground">
                    / {step3.total_intents_available} intentions disponibles
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Step 4 — Slots */}
          {step4 && (
            <div className="bg-card dark:bg-card border-border dark:border-border rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary-foreground bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                  4
                </span>
                <span className="text-foreground dark:text-foreground text-xs font-bold">
                  Slots & Filtres SPARQL
                </span>
                <span className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-full px-2 py-0.5 font-mono text-[9px]">
                  {step4.library}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {Object.keys(step4.slots || {}).length > 0 ? (
                  <div>
                    <span className="text-muted-foreground font-semibold">
                      Paramètres extraits :
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(step4.slots || {}).map(([k, v], i) => (
                        <span
                          key={i}
                          className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-lg px-1.5 py-0.5 font-mono"
                        >
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Aucun filtre de slot appliqué.
                  </p>
                )}
                {step4.applied_filters && step4.applied_filters.length > 0 && (
                  <div>
                    <span className="text-muted-foreground font-semibold">
                      Filtres appliqués :
                    </span>
                    <div className="mt-1 space-y-1">
                      {step4.applied_filters.map((f: string, i: number) => (
                        <pre
                          key={i}
                          className="text-primary overflow-x-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap"
                        >
                          {f}
                        </pre>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SPARQL générée */}
          <div className="border-border bg-background dark:border-border rounded-xl border p-3">
            <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-wider uppercase">
              Requête SPARQL générée
            </p>
            <pre className="text-primary overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
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
  const [result, setResult] = useState<NlpAskResult>();
  const [error, setError] = useState<string | undefined>();
  const statsQuery = useQuery({ queryKey: ['stats'], queryFn: getStats });
  const askMutation = useMutation({ mutationFn: askNlp });

  const askQuestion = async (q: string) => {
    if (!q.trim()) return;
    setQuestion(q);
    setError(undefined);
    setResult(undefined);
    try {
      setResult(await askMutation.mutateAsync({ question: q }));
    } catch {
      setError(
        'Impossible de joindre le serveur. Vérifiez que le backend est démarré.'
      );
    }
  };
  const loading = askMutation.isPending;
  const stats = statsQuery.data;

  const rows: NullableStringRecord[] = (result?.results || []).filter(
    (r: NullableStringRecord) => {
      // Filtrer les résultats vides (individus Protégé sans données)
      const vals = Object.values(r).filter((v) => v != undefined && v !== '');
      // Garder seulement si au moins un champ utile est rempli (nom, prenom, cin, numeroContrat, etc.)
      const hasName = r.nom || r.prenom || r.nomAssure || r.prenomAssure;
      const hasId = r.cin || r.numeroContrat || r.telephone;
      const hasData =
        r.montantPrime ||
        r.dateSinistre ||
        r.dateDebut ||
        r.plafond ||
        r.montant ||
        r.description ||
        r.descriptionSinistre ||
        r.lieuSinistre ||
        r.statut ||
        r.dateDeclaration ||
        r.adresse ||
        r.superficie ||
        r.valeur ||
        r.taux;
      return hasName || hasId || hasData || vals.length > 3;
    }
  );
  const personRows = rows.filter((r: NullableStringRecord) => isPersonRow(r));
  const contratRows = rows.filter((r: NullableStringRecord) => isContratRow(r));
  const garantieRows = rows.filter(
    (r: NullableStringRecord) =>
      isGarantieRow(r) &&
      !isPersonRow(r) &&
      !isContratRow(r) &&
      !isSinistreRow(r)
  );
  const sinistreRows = rows.filter(
    (r: NullableStringRecord) =>
      isSinistreRow(r) &&
      !isPersonRow(r) &&
      !isContratRow(r) &&
      !isGarantieRow(r)
  );
  const otherRows = rows.filter(
    (r: NullableStringRecord) =>
      !isPersonRow(r) &&
      !isContratRow(r) &&
      !isGarantieRow(r) &&
      !isSinistreRow(r)
  );

  if (userRole === 'Assure') {
    return (
      <div className="border-border bg-card dark:border-border dark:bg-card rounded-3xl border p-10 text-center shadow-sm">
        <Shield className="text-muted-foreground dark:text-foreground mx-auto mb-4 h-12 w-12" />
        <h2 className="text-foreground dark:text-muted-foreground mb-2 text-lg font-bold">
          Accès non autorisé
        </h2>
        <p className="text-muted-foreground text-sm">
          La recherche intelligente est réservée aux agents, experts et
          administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="from-primary via-primary to-card text-primary-foreground relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 shadow-xl sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="border-border bg-muted text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
            <Sparkles className="text-primary h-3.5 w-3.5" />
            <span>
              {userRole === 'Admin'
                ? 'Moteur NLP/TALN → SPARQL'
                : 'Recherche Intelligente'}
            </span>
          </div>
          <h1 className="text-primary-foreground font-serif text-2xl font-extrabold tracking-tight sm:text-3xl">
            {userRole === 'Expert'
              ? 'Recherche Sinistres & Expertises'
              : userRole === 'Agent'
                ? 'Recherche Clients & Contrats'
                : 'Recherche en Langage Naturel'}
          </h1>
          <p className="text-primary text-xs leading-relaxed sm:text-sm">
            {userRole === 'Admin' ? (
              <>
                Posez votre question en français. Le pipeline{' '}
                <strong className="text-primary-foreground">
                  NLTK + spaCy
                </strong>{' '}
                la traduit automatiquement en requête{' '}
                <strong className="text-primary-foreground">SPARQL</strong>{' '}
                exécutable sur l&apos;ontologie OWL.
              </>
            ) : userRole === 'Expert' ? (
              'Posez vos questions sur les sinistres, les déclarations et les assurés concernés. Le système analyse votre question et recherche dans la base de connaissances.'
            ) : (
              'Posez vos questions sur vos clients, contrats et garanties. Le système analyse votre question et recherche dans la base de connaissances.'
            )}
          </p>

          {/* NLP Libraries badges — Admin only */}
          {userRole === 'Admin' && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                {
                  icon: <Cpu className="h-3 w-3" />,
                  label: 'NLTK — Tokenisation + Stemming',
                },
                {
                  icon: <Brain className="h-3 w-3" />,
                  label: 'spaCy fr — NER + POS',
                },
                {
                  icon: <GitBranch className="h-3 w-3" />,
                  label: 'Intent Matcher',
                },
                ...(stats
                  ? [
                      {
                        icon: <Hash className="h-3 w-3" />,
                        label: `${stats.total_triples ?? '-'} triplets RDF`,
                      },
                      {
                        icon: <Tag className="h-3 w-3" />,
                        label: `${stats.personnes_count ?? '-'} personnes`,
                      },
                    ]
                  : []),
              ].map((b, i) => (
                <span
                  key={i}
                  className="text-primary-foreground border-border bg-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                >
                  {b.icon}
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="absolute right-6 bottom-4 hidden opacity-5 lg:block">
          <Search className="text-primary-foreground h-52 w-52" />
        </div>
      </div>

      {/* Search card */}
      <div className="border-border bg-card dark:border-border dark:bg-card space-y-4 rounded-3xl border p-5 shadow-sm">
        <div>
          <span className="text-muted-foreground mb-2 block text-[10px] font-bold tracking-widest uppercase">
            Questions fréquentes (cliquez pour tester)
          </span>
          <div className="flex flex-wrap gap-2">
            {getPresetQuestions(userRole).map((q, i) => (
              <Button
                type="button"
                variant="outline"
                size="sm"
                key={i}
                onClick={() => askQuestion(q)}
                className="rounded-xl px-3 py-1.5 text-xs font-medium"
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            askQuestion(question);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                userRole === 'Expert'
                  ? 'Ex : Quels sinistres ont été déclarés ? | Y a-t-il eu un incendie ?'
                  : userRole === 'Agent'
                    ? 'Ex : Qui sont mes assurés ? | Quels contrats sont actifs ?'
                    : 'Ex : Qui sont les assurés enregistrés ? | Quels sinistres ont été déclarés ?'
              }
              className="w-full rounded-2xl py-3 pr-4 pl-10 text-sm shadow-inner"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold shadow"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:block">
              {loading ? 'Traitement NLP...' : 'Rechercher'}
            </span>
          </Button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="border-border bg-muted text-destructive flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-border bg-muted dark:border-border dark:bg-card/40 h-20 animate-pulse rounded-2xl border"
            />
          ))}
        </div>
      )}

      {/* Results + Pipeline */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Header résultats */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="border-border bg-muted flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm">
              <CheckCircle2 className="text-primary h-4 w-4" />
              <span className="text-primary font-bold">
                {rows.length} résultat{rows.length > 1 ? 's' : ''} trouvé
                {rows.length > 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">
              Pour : <em>{question}</em>
            </span>
            {userRole === 'Admin' && (
              <span className="bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground rounded-lg px-2 py-1 font-mono text-xs">
                Intention : <strong>{result.intent}</strong>
              </span>
            )}
          </div>

          {/* Pipeline NLP détaillé — Admin uniquement */}
          {userRole === 'Admin' && result.pipeline && (
            <NLPPipelinePanel
              pipeline={result.pipeline}
              intent={result.intent || ''}
              intentDescription={result.intent_description || ''}
              matchScore={result.match_score || 0}
              sparqlQuery={result.sparql_query || ''}
              elapsedMs={result.elapsed_ms}
            />
          )}

          {/* Cartes résultats */}
          {personRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="text-primary h-4 w-4" />
                <h2 className="text-foreground dark:text-foreground text-sm font-bold">
                  Personnes ({personRows.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {personRows.map((row: NullableStringRecord, i: number) => (
                  <PersonCard key={i} data={row} />
                ))}
              </div>
            </div>
          )}

          {contratRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="text-primary h-4 w-4" />
                <h2 className="text-foreground dark:text-foreground text-sm font-bold">
                  Contrats ({contratRows.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {contratRows.map((row: NullableStringRecord, i: number) => (
                  <ContratCard key={i} data={row} />
                ))}
              </div>
            </div>
          )}

          {garantieRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="text-primary h-4 w-4" />
                <h2 className="text-foreground dark:text-foreground text-sm font-bold">
                  Garanties ({garantieRows.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {garantieRows.map((row: NullableStringRecord, i: number) => (
                  <GarantieCard key={i} data={row} />
                ))}
              </div>
            </div>
          )}

          {sinistreRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-primary h-4 w-4" />
                <h2 className="text-foreground dark:text-foreground text-sm font-bold">
                  Sinistres ({sinistreRows.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {sinistreRows.map((row: NullableStringRecord, i: number) => (
                  <SinistreCard key={i} data={row} />
                ))}
              </div>
            </div>
          )}

          {/* Table générique pour les autres résultats (garanties, sinistres, habitations...) */}
          {otherRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="text-primary h-4 w-4" />
                <h2 className="text-foreground dark:text-foreground text-sm font-bold">
                  Résultats ({otherRows.length})
                </h2>
              </div>
              <div className="border-border dark:border-border overflow-hidden rounded-2xl border">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted dark:bg-card">
                      <tr>
                        {(result.vars || [])
                          .filter((v: string) =>
                            otherRows.some(
                              (r: NullableStringRecord) => r[v] != undefined
                            )
                          )
                          .map((v: string) => (
                            <th
                              key={v}
                              className="text-muted-foreground px-4 py-3 text-left text-[10px] font-bold tracking-wider uppercase"
                            >
                              {v
                                .replaceAll(/([A-Z])/g, ' $1')
                                .replace(/^./, (s: string) => s.toUpperCase())}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-border dark:divide-border divide-y">
                      {otherRows.map((row: NullableStringRecord, i: number) => (
                        <tr
                          key={i}
                          className="hover:bg-muted transition-colors"
                        >
                          {(result.vars || [])
                            .filter((v: string) =>
                              otherRows.some(
                                (r: NullableStringRecord) => r[v] != undefined
                              )
                            )
                            .map((v: string) => (
                              <td
                                key={v}
                                className="text-foreground dark:text-muted-foreground max-w-[220px] truncate px-4 py-3"
                                title={row[v] || ''}
                              >
                                {row[v] ?? (
                                  <span className="text-muted-foreground italic">
                                    —
                                  </span>
                                )}
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
            <div className="border-border bg-muted text-muted-foreground rounded-2xl border p-8 text-center text-sm">
              Aucun résultat pour cette question dans l&apos;ontologie.
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="border-border bg-muted/50 dark:border-border dark:bg-card/40 rounded-3xl border border-dashed p-10 text-center">
          <Search className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
          <p className="text-muted-foreground text-sm font-semibold">
            Posez une question ci-dessus pour démarrer
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {userRole === 'Expert'
              ? 'Recherchez des sinistres, déclarations ou assurés liés à vos dossiers.'
              : userRole === 'Agent'
                ? 'Recherchez des clients, contrats ou garanties dans votre portefeuille.'
                : 'Le pipeline NLTK + spaCy analysera votre question et générera une requête SPARQL.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {getPresetQuestions(userRole)
              .slice(0, 4)
              .map((q, i) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  key={i}
                  onClick={() => askQuestion(q)}
                  className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium"
                >
                  <ChevronRight className="h-3 w-3" />
                  {q}
                </Button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
