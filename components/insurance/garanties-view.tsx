'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  listGaranties,
  createGarantie,
  updateGarantie,
  deleteGarantie,
} from '@/lib/services/garanties';
import type { Garantie } from '@/lib/types/garanties';
import {
  GARANTIE_TYPES,
  type GarantieFormValues,
  type GarantieType,
} from '@/lib/types/garanties';
import { garantieFormSchema } from '@/lib/schemas/forms';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  PlusCircle,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Shield,
  Flame,
  Droplets,
  Wind,
  Zap,
  Car,
  Lock,
  ChevronRight,
  X,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<
  GarantieType,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  GarantieIncendie: {
    label: 'Incendie',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
    icon: Flame,
  },
  GarantieDegatDesEaux: {
    label: 'Dégât des eaux',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
    icon: Droplets,
  },
  GarantieBrisDeGlace: {
    label: 'Bris de glace',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
    icon: Zap,
  },
  GarantieCatastropheNaturelle: {
    label: 'Catastrophe naturelle',
    color: 'text-destructive dark:text-destructive',
    bg: 'bg-muted dark:bg-muted',
    icon: Wind,
  },
  GarantieResponsabiliteCivile: {
    label: 'Responsabilité civile',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
    icon: Car,
  },
  GarantieVol: {
    label: 'Vol',
    color: 'text-primary dark:text-primary',
    bg: 'bg-muted dark:bg-muted',
    icon: Lock,
  },
};

function getMeta(rawType: string) {
  const key = GARANTIE_TYPES.find((t) =>
    rawType?.includes(t.replace('Garantie', ''))
  ) as GarantieType | undefined;
  if (key && TYPE_META[key]) return TYPE_META[key];
  // fallback: try direct match
  const direct = TYPE_META[rawType as GarantieType];
  if (direct) return direct;
  return {
    label: rawType ?? '—',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    icon: Shield,
  };
}

function TypeBadge({ type }: { type: string }) {
  const meta = getMeta(type);
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

function formatAmount(val: string | null | undefined) {
  if (!val) return '—';
  const n = Number.parseFloat(val);
  if (Number.isNaN(n)) return val;
  return `${n.toLocaleString('fr-FR')} DT`;
}

function formatRate(val: string | null | undefined) {
  if (!val) return '—';
  const n = Number.parseFloat(val);
  if (Number.isNaN(n)) return val;
  return `${n} %`;
}

// ── Form ──────────────────────────────────────────────────────────────────────

const defaultValues: GarantieFormValues = {
  type: GARANTIE_TYPES[0],
  nomGarantie: '',
  plafondGarantie: '',
  franchise: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface GarantiesViewProps {
  userRole?: string;
}

export function GarantiesView({ userRole = 'Assure' }: GarantiesViewProps) {
  const queryClient = useQueryClient();
  const canManage = ['Agent', 'Admin'].includes(userRole);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Garantie | undefined>();
  const [detailTarget, setDetailTarget] = useState<Garantie | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const garantiesQuery = useQuery({
    queryKey: ['garanties'],
    queryFn: listGaranties,
  });

  const emptyGaranties = useMemo(() => [], []);
  const garanties = garantiesQuery.data ?? emptyGaranties;

  const form = useForm<GarantieFormValues>({
    resolver: zodResolver(garantieFormSchema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: createGarantie,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['garanties'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateGarantie>[1];
    }) => updateGarantie(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['garanties'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGarantie,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['garanties'] }),
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = garanties.length;
    const byType: Record<string, number> = {};
    for (const type of GARANTIE_TYPES) {
      byType[type] = garanties.filter((g) => g.typeGarantie === type).length;
    }
    const withPlafond = garanties.filter((g) => !!g.plafondGarantie).length;
    let plafondTotal = 0;
    for (const garantie of garanties) {
      const n = Number.parseFloat(garantie.plafondGarantie ?? '0');
      plafondTotal += Number.isNaN(n) ? 0 : n;
    }
    const avgPlafond = withPlafond === 0 ? 0 : plafondTotal / withPlafond;
    return { total, byType, withPlafond, avgPlafond };
  }, [garanties]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return garanties.filter((g) => {
      const matchSearch =
        !q ||
        g.garantie.toLowerCase().includes(q) ||
        (g.nomGarantie ?? '').toLowerCase().includes(q) ||
        (g.typeGarantie ?? '').toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || g.typeGarantie === typeFilter;
      return matchSearch && matchType;
    });
  }, [garanties, search, typeFilter]);

  // ── Form helpers ───────────────────────────────────────────────────────────

  const resetForm = (values: GarantieFormValues = defaultValues) => {
    form.reset(values);
    setFormError(undefined);
  };

  const openCreate = () => {
    setEditTarget(undefined);
    resetForm(defaultValues);
    setIsModalOpen(true);
  };

  const openEdit = (g: Garantie) => {
    setEditTarget(g);
    setDetailTarget(undefined);
    resetForm({
      type: g.typeGarantie || GARANTIE_TYPES[0],
      nomGarantie: g.nomGarantie || '',
      plafondGarantie: g.plafondGarantie || '',
      franchise: g.tauxFranchise || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: GarantieFormValues) => {
    setFormError(undefined);
    const payload = {
      type: values.type,
      nomGarantie: values.nomGarantie || undefined,
      plafondGarantie: values.plafondGarantie
        ? Number(values.plafondGarantie)
        : undefined,
      franchise: values.franchise ? Number(values.franchise) : undefined,
    };
    const operation = editTarget
      ? updateMutation.mutateAsync({ id: editTarget.garantie, payload })
      : createMutation.mutateAsync(payload);
    try {
      await operation;
      setIsModalOpen(false);
      resetForm(defaultValues);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette garantie ?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Erreur');
      return;
    }
    if (detailTarget?.garantie === id) setDetailTarget(undefined);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-xl font-bold">
            <Shield className="text-primary h-5 w-5" />
            Garanties
          </h2>
          <p className="text-muted-foreground text-sm">
            Gestion des garanties et couvertures de l&apos;ontologie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => garantiesQuery.refetch()}
            disabled={garantiesQuery.isFetching}
          >
            <RefreshCw
              className={cn(
                'h-4 w-4',
                garantiesQuery.isFetching && 'animate-spin'
              )}
            />
          </Button>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle garantie
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs">Total garanties</p>
          <p className="text-foreground mt-1 text-2xl font-bold">
            {stats.total}
          </p>
        </div>
        <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs">Types distincts</p>
          <p className="text-foreground mt-1 text-2xl font-bold">
            {GARANTIE_TYPES.filter((t) => (stats.byType[t] ?? 0) > 0).length}
          </p>
        </div>
        <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs">Avec plafond</p>
          <p className="text-foreground mt-1 text-2xl font-bold">
            {stats.withPlafond}
          </p>
        </div>
        <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-xs">Plafond moyen</p>
          <p className="text-primary mt-1 text-2xl font-bold">
            {stats.avgPlafond > 0
              ? `${Math.round(stats.avgPlafond).toLocaleString('fr-FR')} DT`
              : '—'}
          </p>
        </div>
      </div>

      {/* Error Banner */}
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
        <div className="flex flex-wrap gap-1.5">
          <Button
            onClick={() => setTypeFilter('all')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              typeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Tous ({stats.total})
          </Button>
          {GARANTIE_TYPES.filter((t) => (stats.byType[t] ?? 0) > 0).map((t) => {
            const meta = TYPE_META[t];
            return (
              <Button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  typeFilter === t
                    ? cn(meta.bg, meta.color)
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {meta.label} ({stats.byType[t]})
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Nom</th>
                  <th className="px-4 py-3 text-left font-semibold">Plafond</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Franchise
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {garantiesQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-border border-t">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="bg-muted h-4 animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground px-4 py-12 text-center"
                    >
                      <Shield className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      <p className="font-medium">Aucune garantie</p>
                      <p className="mt-1 text-xs">
                        {search || typeFilter !== 'all'
                          ? 'Essayez de modifier vos filtres'
                          : canManage
                            ? 'Créez votre première garantie'
                            : "Aucune garantie dans l'ontologie"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((g) => (
                    <tr
                      key={g.garantie}
                      onClick={() =>
                        setDetailTarget(
                          detailTarget?.garantie === g.garantie ? undefined : g
                        )
                      }
                      className={cn(
                        'border-border hover:bg-muted/40 cursor-pointer border-t transition-colors',
                        detailTarget?.garantie === g.garantie && 'bg-primary/5'
                      )}
                    >
                      <td className="px-4 py-3">
                        <TypeBadge type={g.typeGarantie} />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {g.nomGarantie || (
                          <span className="text-muted-foreground italic">
                            —
                          </span>
                        )}
                      </td>
                      <td className="text-primary px-4 py-3 text-sm font-semibold">
                        {formatAmount(g.plafondGarantie)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatRate(g.tauxFranchise)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground font-mono text-xs">
                          {g.garantie}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className="flex justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setDetailTarget(g)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => openEdit(g)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => void handleDelete(g.garantie)}
                              >
                                <Trash2 className="text-destructive h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {detailTarget && (
          <div className="border-border bg-card w-full shrink-0 space-y-5 rounded-2xl border p-5 shadow-sm lg:w-80">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-bold">Détail garantie</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setDetailTarget(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Type badge large */}
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl p-4',
                getMeta(detailTarget.typeGarantie).bg
              )}
            >
              {React.createElement(getMeta(detailTarget.typeGarantie).icon, {
                className: `h-6 w-6 ${getMeta(detailTarget.typeGarantie).color}`,
              })}
              <div>
                <p
                  className={cn(
                    'text-sm font-bold',
                    getMeta(detailTarget.typeGarantie).color
                  )}
                >
                  {getMeta(detailTarget.typeGarantie).label}
                </p>
                <p className="text-muted-foreground text-xs">
                  {detailTarget.typeGarantie}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Nom
                </p>
                <p className="text-foreground mt-0.5 text-sm font-medium">
                  {detailTarget.nomGarantie || (
                    <span className="text-muted-foreground italic">
                      Non renseigné
                    </span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-muted-foreground text-xs">Plafond</p>
                  <p className="text-primary mt-0.5 text-lg font-bold">
                    {formatAmount(detailTarget.plafondGarantie)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-muted-foreground text-xs">Franchise</p>
                  <p className="text-foreground mt-0.5 text-lg font-bold">
                    {formatRate(detailTarget.tauxFranchise)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Identifiant OWL
                </p>
                <p className="text-muted-foreground mt-0.5 font-mono text-xs break-all">
                  {detailTarget.garantie}
                </p>
              </div>
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
                  onClick={() => void handleDelete(detailTarget.garantie)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="text-primary h-4 w-4" />
              {editTarget ? 'Modifier la garantie' : 'Nouvelle garantie'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type */}
            <div className="space-y-1.5">
              <Label>Type de garantie</Label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GARANTIE_TYPES.map((t) => {
                        const meta = TYPE_META[t];
                        const Icon = meta.icon;
                        return (
                          <SelectItem key={t} value={t}>
                            <span className="flex items-center gap-2">
                              <Icon className={cn('h-3.5 w-3.5', meta.color)} />
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

            {/* Nom */}
            <div className="space-y-1.5">
              <Label>Nom de la garantie</Label>
              <Input
                {...form.register('nomGarantie')}
                placeholder="Ex: Garantie Incendie Premium"
              />
            </div>

            {/* Plafond + Franchise */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plafond (DT)</Label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  {...form.register('plafondGarantie')}
                  placeholder="Ex: 50000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Taux franchise (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  {...form.register('franchise')}
                  placeholder="Ex: 10"
                />
              </div>
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
                    : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
