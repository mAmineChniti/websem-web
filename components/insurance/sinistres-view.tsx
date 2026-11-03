'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  listSinistres,
  createSinistre,
  updateSinistre,
  deleteSinistre,
} from '@/lib/services/sinistres';
import { listContrats } from '@/lib/services/contrats';
import type { Sinistre } from '@/lib/types/sinistres';
import {
  SINISTRE_TYPES,
  type SinistreFormValues,
  type SinistreType,
} from '@/lib/types/sinistres';
import { sinistreFormSchema } from '@/lib/schemas/forms';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  PlusCircle,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  AlertTriangle,
  Flame,
  Droplets,
  Wind,
  Zap,
  Lock,
  CalendarDays,
  MapPin,
  User,
  FileText,
  X,
  ChevronRight,
  Clock,
} from 'lucide-react';

// ── Types & metadata ──────────────────────────────────────────────────────────

const TYPE_META: Record<
  SinistreType,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  SinistreIncendie: {
    label: 'Incendie',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
    icon: Flame,
  },
  SinistreVol: {
    label: 'Vol',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
    icon: Lock,
  },
  SinistreDegatDesEaux: {
    label: 'Dégât des eaux',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
    icon: Droplets,
  },
  SinistreBrisDeGlace: {
    label: 'Bris de glace',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
    icon: Zap,
  },
  SinistreCatastropheNaturelle: {
    label: 'Catastrophe naturelle',
    color: 'text-destructive dark:text-destructive',
    bg: 'bg-muted dark:bg-muted',
    icon: Wind,
  },
};

function getTypeMeta(rawType: string) {
  const direct = TYPE_META[rawType as SinistreType];
  if (direct) return direct;
  return {
    label: rawType ?? '—',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    icon: AlertTriangle,
  };
}

const STATUT_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  Declara: {
    label: 'Déclaré',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
  },
  'En cours': {
    label: 'En cours',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
  },
  Accepte: {
    label: 'Accepté',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
  },
  Rejete: {
    label: 'Rejeté',
    color: 'text-destructive dark:text-destructive',
    bg: 'bg-muted dark:bg-muted',
  },
  Clos: {
    label: 'Clos',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

const STATUTS = Object.keys(STATUT_META);

function getStatutMeta(statut: string | null | undefined) {
  if (!statut)
    return { label: '—', color: 'text-muted-foreground', bg: 'bg-muted' };
  return (
    STATUT_META[statut] ?? {
      label: statut,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    }
  );
}

function TypeBadge({ type }: { type: string }) {
  const meta = getTypeMeta(type);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        meta.bg,
        meta.color
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function StatutBadge({ statut }: { statut: string | null | undefined }) {
  const meta = getStatutMeta(statut);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        meta.bg,
        meta.color
      )}
    >
      {meta.label}
    </span>
  );
}

function formatDate(val: string | null | undefined) {
  if (!val) return '—';
  const d = val.slice(0, 10);
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

// ── Form ──────────────────────────────────────────────────────────────────────

const defaultValues: SinistreFormValues = {
  type: SINISTRE_TYPES[0],
  dateSinistre: '',
  lieuSinistre: '',
  descriptionSinistre: '',
  statut: 'Declara',
  causeSinistre: '',
  contrat: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface SinistresViewProps {
  userRole?: string;
}

export function SinistresView({ userRole = 'Assure' }: SinistresViewProps) {
  const queryClient = useQueryClient();
  const canManage = ['Agent', 'Admin', 'Expert'].includes(userRole);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sinistre | undefined>();
  const [detailTarget, setDetailTarget] = useState<Sinistre | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const sinistresQuery = useQuery({
    queryKey: ['sinistres'],
    queryFn: listSinistres,
  });
  const contratsQuery = useQuery({
    queryKey: ['contrats'],
    queryFn: listContrats,
  });

  const sinistres = useMemo(
    () => sinistresQuery.data ?? [],
    [sinistresQuery.data]
  );
  const contrats = contratsQuery.data ?? [];

  const form = useForm<SinistreFormValues>({
    resolver: zodResolver(sinistreFormSchema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: createSinistre,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sinistres'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateSinistre>[1];
    }) => updateSinistre(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sinistres'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSinistre,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sinistres'] }),
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = sinistres.length;
    const byStatut: Record<string, number> = {};
    for (const statut of STATUTS) {
      byStatut[statut] = sinistres.filter(
        (item) => item.statut === statut
      ).length;
    }
    const byType: Record<string, number> = {};
    for (const type of SINISTRE_TYPES) {
      byType[type] = sinistres.filter(
        (item) => item.typeSinistre === type
      ).length;
    }
    return { total, byStatut, byType };
  }, [sinistres]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sinistres.filter((s) => {
      const matchSearch =
        !q ||
        s.sinistre.toLowerCase().includes(q) ||
        (s.lieuSinistre ?? '').toLowerCase().includes(q) ||
        (s.typeSinistre ?? '').toLowerCase().includes(q) ||
        (s.statut ?? '').toLowerCase().includes(q) ||
        (s.assureNom ?? '').toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || s.typeSinistre === typeFilter;
      const matchStatut = statutFilter === 'all' || s.statut === statutFilter;
      return matchSearch && matchType && matchStatut;
    });
  }, [sinistres, search, typeFilter, statutFilter]);

  // ── Form helpers ───────────────────────────────────────────────────────────

  const resetForm = (values: SinistreFormValues = defaultValues) => {
    form.reset(values);
    setFormError(undefined);
  };

  const openCreate = () => {
    setEditTarget(undefined);
    resetForm(defaultValues);
    setIsModalOpen(true);
  };

  const openEdit = (s: Sinistre) => {
    setEditTarget(s);
    setDetailTarget(undefined);
    resetForm({
      type: s.typeSinistre || SINISTRE_TYPES[0],
      dateSinistre: s.dateSinistre ? s.dateSinistre.slice(0, 10) : '',
      lieuSinistre: s.lieuSinistre || '',
      descriptionSinistre: s.descriptionSinistre || '',
      statut: s.statut || 'Declara',
      causeSinistre: s.causeSinistre || '',
      contrat: s.contrat || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: SinistreFormValues) => {
    setFormError(undefined);
    const operation = editTarget
      ? updateMutation.mutateAsync({
          id: editTarget.sinistre,
          payload: {
            typeSinistre: values.type,
            dateSinistre: values.dateSinistre || undefined,
            lieuSinistre: values.lieuSinistre,
            descriptionSinistre: values.descriptionSinistre,
            statut: values.statut,
            causeSinistre: values.causeSinistre || undefined,
            contrat: values.contrat || undefined,
          },
        })
      : createMutation.mutateAsync({
          type: values.type,
          dateSinistre: values.dateSinistre,
          lieuSinistre: values.lieuSinistre,
          descriptionSinistre: values.descriptionSinistre,
          statut: values.statut,
          causeSinistre: values.causeSinistre || undefined,
          contrat: values.contrat || undefined,
        });
    try {
      await operation;
      setIsModalOpen(false);
      resetForm(defaultValues);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Erreur');
    }
  };

  const [deleteTargetId, setDeleteTargetId] = useState<string | undefined>();

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Erreur');
      return;
    }
    if (detailTarget?.sinistre === deleteTargetId) setDetailTarget(undefined);
    setDeleteTargetId(undefined);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const dataError =
    sinistresQuery.error instanceof Error
      ? sinistresQuery.error.message
      : contratsQuery.error instanceof Error
        ? contratsQuery.error.message
        : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-xl font-bold">
            <AlertTriangle className="text-primary h-5 w-5" />
            Sinistres
          </h2>
          <p className="text-muted-foreground text-sm">
            Gestion et suivi des sinistres déclarés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sinistresQuery.refetch()}
            disabled={sinistresQuery.isFetching}
            aria-label="Actualiser les sinistres"
          >
            <RefreshCw
              className={cn(
                'h-4 w-4',
                sinistresQuery.isFetching && 'animate-spin'
              )}
            />
          </Button>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau sinistre
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs">Total sinistres</p>
          <p className="text-foreground mt-1 text-2xl font-bold">
            {stats.total}
          </p>
        </div>
        {(['Declara', 'En cours', 'Accepte', 'Rejete'] as const).map((s) => {
          const meta = STATUT_META[s];
          return (
            <div
              key={s}
              onClick={() => setStatutFilter(statutFilter === s ? 'all' : s)}
              className={cn(
                'border-border bg-card cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md',
                statutFilter === s && cn(meta.bg, 'border-transparent')
              )}
            >
              <p className="text-muted-foreground text-xs">{meta.label}</p>
              <p className={cn('mt-1 text-2xl font-bold', meta.color)}>
                {stats.byStatut[s] ?? 0}
              </p>
            </div>
          );
        })}
      </div>

      {/* Error Banner */}
      {dataError && (
        <div
          className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Impossible de charger les données : {dataError}</span>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 ml-auto"
            onClick={() => {
              void Promise.all([
                sinistresQuery.refetch(),
                contratsQuery.refetch(),
              ]);
            }}
            disabled={sinistresQuery.isFetching || contratsQuery.isFetching}
          >
            Réessayer
          </Button>
        </div>
      )}
      {formError && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {formError}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-auto p-0"
            onClick={() => setFormError(undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="h-9 w-48 pl-9 text-sm"
          />
        </div>
        {/* Type filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant={typeFilter === 'all' ? 'default' : 'secondary'}
            onClick={() => setTypeFilter('all')}
            className="rounded-full px-3 py-1 text-xs font-semibold"
          >
            Tous types
          </Button>
          {SINISTRE_TYPES.filter((t) => (stats.byType[t] ?? 0) > 0).map((t) => {
            const meta = TYPE_META[t];
            return (
              <Button
                key={t}
                type="button"
                variant={typeFilter === t ? 'default' : 'secondary'}
                onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  typeFilter === t && cn(meta.bg, meta.color)
                )}
              >
                {meta.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Table + Detail Panel */}
      <div className="flex gap-4">
        {/* Table */}
        <div
          className={cn(
            'border-border bg-card flex-1 overflow-hidden rounded-2xl border shadow-sm',
            detailTarget && 'hidden lg:block'
          )}
        >
          <Table className="text-sm">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-auto px-4 py-3 text-left font-semibold">
                  Type
                </TableHead>
                <TableHead className="h-auto px-4 py-3 text-left font-semibold">
                  Date
                </TableHead>
                <TableHead className="h-auto px-4 py-3 text-left font-semibold">
                  Lieu
                </TableHead>
                <TableHead className="h-auto px-4 py-3 text-left font-semibold">
                  Statut
                </TableHead>
                <TableHead className="h-auto px-4 py-3 text-left font-semibold">
                  Assuré
                </TableHead>
                <TableHead className="h-auto px-4 py-3 text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sinistresQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border border-t">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <div className="bg-muted h-4 animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground px-4 py-12 text-center whitespace-normal"
                  >
                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p className="font-medium">Aucun sinistre</p>
                    <p className="mt-1 text-xs">
                      {search || typeFilter !== 'all' || statutFilter !== 'all'
                        ? 'Essayez de modifier vos filtres'
                        : canManage
                          ? 'Déclarez le premier sinistre'
                          : "Aucun sinistre dans l'ontologie"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow
                    key={s.sinistre}
                    onClick={() =>
                      setDetailTarget(
                        detailTarget?.sinistre === s.sinistre ? undefined : s
                      )
                    }
                    className={cn(
                      'border-border hover:bg-muted/40 cursor-pointer border-t',
                      detailTarget?.sinistre === s.sinistre && 'bg-primary/5'
                    )}
                  >
                    <TableCell className="px-4 py-3">
                      <TypeBadge type={s.typeSinistre} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(s.dateSinistre)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {s.lieuSinistre ? (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {s.lieuSinistre}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatutBadge statut={s.statut} />
                    </TableCell>
                    <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                      {s.assureNom || s.assure || '—'}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setDetailTarget(s)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEdit(s)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => void handleDelete(s.sinistre)}
                            >
                              <Trash2 className="text-destructive h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detail Panel */}
        {detailTarget && (
          <div className="border-border bg-card w-full shrink-0 space-y-5 rounded-2xl border p-5 shadow-sm lg:w-80">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-bold">Détail sinistre</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setDetailTarget(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Type + Statut */}
            <div className="space-y-2">
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl p-3',
                  getTypeMeta(detailTarget.typeSinistre).bg
                )}
              >
                {React.createElement(
                  getTypeMeta(detailTarget.typeSinistre).icon,
                  {
                    className: `h-5 w-5 ${getTypeMeta(detailTarget.typeSinistre).color}`,
                  }
                )}
                <div>
                  <p
                    className={cn(
                      'text-sm font-bold',
                      getTypeMeta(detailTarget.typeSinistre).color
                    )}
                  >
                    {getTypeMeta(detailTarget.typeSinistre).label}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {detailTarget.typeSinistre}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Statut</span>
                <StatutBadge statut={detailTarget.statut} />
              </div>
            </div>

            {/* Info grid */}
            <div className="space-y-3">
              <DetailRow
                icon={CalendarDays}
                label="Date sinistre"
                value={formatDate(detailTarget.dateSinistre)}
              />
              <DetailRow
                icon={Clock}
                label="Date déclaration"
                value={formatDate(detailTarget.dateDeclaration)}
              />
              <DetailRow
                icon={MapPin}
                label="Lieu"
                value={detailTarget.lieuSinistre}
              />
              <DetailRow
                icon={User}
                label="Assuré"
                value={detailTarget.assureNom || detailTarget.assure}
              />
              <DetailRow
                icon={FileText}
                label="Contrat"
                value={detailTarget.contrat}
              />
            </div>

            {detailTarget.descriptionSinistre && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Description
                </p>
                <p className="text-foreground bg-muted/50 rounded-xl p-3 text-sm leading-relaxed">
                  {detailTarget.descriptionSinistre}
                </p>
              </div>
            )}

            {detailTarget.causeSinistre && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  Cause
                </p>
                <p className="text-foreground bg-muted/50 rounded-xl p-3 text-sm leading-relaxed">
                  {detailTarget.causeSinistre}
                </p>
              </div>
            )}

            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Identifiant OWL
              </p>
              <p className="text-muted-foreground mt-0.5 font-mono text-xs break-all">
                {detailTarget.sinistre}
              </p>
            </div>

            {canManage && (
              <div className="border-border flex gap-2 border-t pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(detailTarget)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => void handleDelete(detailTarget.sinistre)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-primary h-4 w-4" />
              {editTarget ? 'Modifier le sinistre' : 'Déclarer un sinistre'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type de sinistre</Label>
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SINISTRE_TYPES.map((t) => {
                          const meta = TYPE_META[t];
                          const Icon = meta.icon;
                          return (
                            <SelectItem key={t} value={t}>
                              <span className="flex items-center gap-2">
                                <Icon
                                  className={cn('h-3.5 w-3.5', meta.color)}
                                />
                                {meta.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date du sinistre</Label>
                <Controller
                  name="dateSinistre"
                  control={form.control}
                  render={({ field }) => <Input type="date" {...field} />}
                />
                <FieldError errors={[form.formState.errors.dateSinistre]} />
              </div>
            </div>

            {/* Lieu */}
            <Field>
              <FieldLabel>Lieu</FieldLabel>
              <Controller
                name="lieuSinistre"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Ex: 12 Rue des Acacias, Paris"
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.lieuSinistre]} />
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Controller
                name="descriptionSinistre"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Décrivez les circonstances du sinistre..."
                    rows={3}
                  />
                )}
              />
              <FieldError
                errors={[form.formState.errors.descriptionSinistre]}
              />
            </Field>

            {/* Statut + Cause */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Controller
                  name="statut"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'Declara'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUTS.map((s) => {
                          const meta = STATUT_META[s];
                          return (
                            <SelectItem key={s} value={s}>
                              <span className={cn('font-medium', meta.color)}>
                                {meta.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cause</Label>
                <Controller
                  name="causeSinistre"
                  control={form.control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Cause supposée..." />
                  )}
                />
                <FieldError errors={[form.formState.errors.causeSinistre]} />
              </div>
            </div>

            {/* Contrat */}
            <div className="space-y-1.5">
              <Label>Contrat lié</Label>
              <Controller
                name="contrat"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {contrats.map((c) => (
                        <SelectItem key={c.contrat} value={c.contrat}>
                          {c.numeroContrat || c.contrat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {formError && (
              <p className="text-destructive flex items-center gap-1.5 text-sm">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {formError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Enregistrement...'
                  : editTarget
                    ? 'Mettre à jour'
                    : 'Déclarer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le sinistre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retirera définitivement le sinistre de
              l&apos;ontologie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return;
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-foreground text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
