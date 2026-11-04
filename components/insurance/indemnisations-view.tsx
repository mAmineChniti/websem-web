'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { z } from 'zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BadgeDollarSign,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code2,
  Coins,
  Copy,
  FileText,
  Pencil,
  PieChart,
  Plus,
  Search,
  SlidersHorizontal,
  Terminal,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { indemnisationFormSchema } from '@/lib/schemas/indemnisations';
import {
  createIndemnisation,
  deleteIndemnisation,
  getIndemnisationStats,
  queryIndemnisations,
  updateIndemnisation,
} from '@/lib/services/indemnisations';
import { listHabitations } from '@/lib/services/habitations';
import { buildHabitationLabel, type Habitation } from '@/lib/types/habitations';
import {
  buildIndemnisationLabel,
  type Indemnisation,
  type IndemnisationsFilterParams,
} from '@/lib/types/indemnisations';
import type { UserSession } from '@/lib/types/auth';

type IndemnisationFormValues = z.infer<typeof indemnisationFormSchema>;

type SortBy = 'montantIndemnise' | 'tauxIndemnisation';
type SortOrder = 'asc' | 'desc';

interface ActiveChip {
  key: string;
  label: string;
}

interface IndemnisationNotification {
  id: string;
  assureId: string;
  habitation: string;
  habitationLabel?: string;
  label?: string;
  type: Indemnisation['type'];
  montantIndemnise: number;
  tauxIndemnisation: number;
  motifRefus?: string;
  createdAt: number;
}

const notificationStorageKey = 'hestia_indemnisation_notifications';
const PAGE_SIZE = 6;

function isIndemnisationNotification(
  item: unknown
): item is IndemnisationNotification {
  if (typeof item !== 'object' || item === null) return false;
  return (
    'id' in item &&
    'assureId' in item &&
    'habitation' in item &&
    'type' in item &&
    'montantIndemnise' in item &&
    'tauxIndemnisation' in item &&
    'createdAt' in item
  );
}

function parseJson(saved: string): unknown {
  try {
    return JSON.parse(saved);
  } catch {
    return undefined;
  }
}

function readIndemnisationNotifications(): IndemnisationNotification[] {
  if (globalThis.window === undefined) return [];
  const saved = globalThis.localStorage.getItem(notificationStorageKey);
  if (!saved) return [];
  const parsed = parseJson(saved);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isIndemnisationNotification);
}

function addIndemnisationNotification(
  notification: Omit<IndemnisationNotification, 'id' | 'createdAt'>
) {
  const notifications = readIndemnisationNotifications();
  const createdAt = Date.now();
  notifications.unshift({
    ...notification,
    id: `notification-${createdAt}`,
    createdAt,
  });
  globalThis.localStorage.setItem(
    notificationStorageKey,
    JSON.stringify(notifications.slice(0, 20))
  );
}

function copyToClipboardSafe(text?: string) {
  if (!text) return;
  const clip = globalThis.navigator?.clipboard;
  if (!clip) return;
  try {
    void clip.writeText(text);
  } catch {
    // ignore
  }
}

interface IndemnisationsViewProps {
  userRole?: string;
  currentUser?: UserSession;
}

export function IndemnisationsView({
  userRole = 'Assure',
  currentUser,
}: IndemnisationsViewProps) {
  const isAdmin = userRole === 'Admin';
  const isAssure = userRole === 'Assure';
  const queryClient = useQueryClient();

  // Filtres
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [tauxMin, setTauxMin] = useState('');
  const [tauxMax, setTauxMax] = useState('');
  const [montantMin, setMontantMin] = useState('');
  const [montantMax, setMontantMax] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('montantIndemnise');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Dialogs & actions
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Indemnisation>();
  const [deleteTarget, setDeleteTarget] = useState<Indemnisation>();
  const [error, setError] = useState<string>();
  const [sparqlOpen, setSparqlOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<
    IndemnisationNotification[]
  >([]);
  const notifiedIds = useRef(new Set<string>());

  const habitationsQuery = useQuery({
    queryKey: [
      'habitations-for-indemnisation',
      currentUser?.ontology_id,
      isAssure,
    ],
    queryFn: () => listHabitations(),
    select: (data) =>
      isAssure && currentUser?.ontology_id
        ? data.filter(
            (habitation) => habitation.assure === currentUser.ontology_id
          )
        : data,
  });

  const habitationsMap = useMemo(() => {
    const map: Record<string, Habitation> = {};
    for (const item of habitationsQuery.data ?? []) {
      map[item.id] = item;
    }
    return map;
  }, [habitationsQuery.data]);

  // Écouteur de notifications d'indemnisation pour l'Assuré
  useEffect(() => {
    if (!isAssure) return;

    const refreshNotifications = () => {
      const refresh = globalThis.window.setTimeout(() => {
        const nextNotifications = readIndemnisationNotifications().filter(
          (notification) => notification.assureId === currentUser?.ontology_id
        );
        setNotifications(nextNotifications);

        for (const notification of nextNotifications) {
          if (!notifiedIds.current.has(notification.id)) {
            notifiedIds.current.add(notification.id);
            const habObj = habitationsMap[notification.habitation];
            const habDisplay =
              notification.habitationLabel ||
              habObj?.label ||
              (habObj
                ? buildHabitationLabel(habObj.type, habObj.adresseBien)
                : 'Habitation assurée');

            const title =
              notification.type === 'IndemnisationRefusee'
                ? 'Dossier d’indemnisation refusé'
                : 'Nouvelle indemnisation créée';
            const description =
              notification.type === 'IndemnisationRefusee'
                ? `${habDisplay} — Refusée (${notification.motifRefus || 'Consultez le motif'})`
                : `${habDisplay} — ${notification.montantIndemnise.toLocaleString('fr-TN')} DT`;
            toast.add({
              title,
              description,
              type:
                notification.type === 'IndemnisationRefusee' ? 'error' : 'info',
            });
          }
        }
      }, 0);
      return refresh;
    };

    const timeoutId = refreshNotifications();
    const intervalId = globalThis.window.setInterval(() => {
      refreshNotifications();
    }, 3000);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === notificationStorageKey) refreshNotifications();
    };
    globalThis.window.addEventListener('storage', handleStorage);

    return () => {
      globalThis.window.clearTimeout(timeoutId);
      globalThis.window.clearInterval(intervalId);
      globalThis.window.removeEventListener('storage', handleStorage);
    };
  }, [currentUser?.ontology_id, habitationsMap, isAssure]);

  // Paramètres SPARQL
  const filterParams: IndemnisationsFilterParams = useMemo(() => {
    let resolvedType: string | undefined;
    switch (typeFilter) {
      case 'Totale': {
        resolvedType = 'IndemnisationTotale';
        break;
      }
      case 'Partielle': {
        resolvedType = 'IndemnisationPartielle';
        break;
      }
      case 'Refusee': {
        resolvedType = 'IndemnisationRefusee';
        break;
      }
      default: {
        if (typeFilter !== 'Tous') resolvedType = typeFilter;
      }
    }

    return {
      assureId: isAssure ? currentUser?.ontology_id : undefined,
      search: search.trim() || undefined,
      type: resolvedType,
      tauxMin: tauxMin ? Number(tauxMin) : undefined,
      tauxMax: tauxMax ? Number(tauxMax) : undefined,
      montantMin: montantMin ? Number(montantMin) : undefined,
      montantMax: montantMax ? Number(montantMax) : undefined,
      sortBy,
      sortOrder,
      page,
      pageSize: PAGE_SIZE,
    };
  }, [
    isAssure,
    currentUser?.ontology_id,
    search,
    typeFilter,
    tauxMin,
    tauxMax,
    montantMin,
    montantMax,
    sortBy,
    sortOrder,
    page,
  ]);

  const query = useQuery({
    queryKey: ['indemnisations', filterParams],
    queryFn: () => queryIndemnisations(filterParams),
  });

  const statsQuery = useQuery({
    queryKey: ['indemnisations-stats', currentUser?.ontology_id, isAssure],
    queryFn: () =>
      getIndemnisationStats(isAssure ? currentUser?.ontology_id : undefined),
  });

  const form = useForm<IndemnisationFormValues>({
    resolver: zodResolver(indemnisationFormSchema),
    defaultValues: {
      type: 'IndemnisationPartielle',
      montantIndemnise: '',
      tauxIndemnisation: '',
      habitation: '',
      motifRefus: '',
    },
  });

  const watchedType = useWatch({ control: form.control, name: 'type' });

  // Auto-ajuste montant et taux à 0 si type Refusée
  useEffect(() => {
    if (watchedType === 'IndemnisationRefusee') {
      form.setValue('montantIndemnise', '0');
      form.setValue('tauxIndemnisation', '0');
    }
  }, [watchedType, form]);

  const createMutation = useMutation({
    mutationFn: createIndemnisation,
    onError: (error_: Error) => {
      setError(error_.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['indemnisations'] });
      void queryClient.invalidateQueries({
        queryKey: ['indemnisations-stats'],
      });
      toast.add({ title: 'Indemnisation créée', type: 'success' });
      setAddOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateIndemnisation>[1];
    }) => updateIndemnisation(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['indemnisations'] });
      void queryClient.invalidateQueries({
        queryKey: ['indemnisations-stats'],
      });
      toast.add({ title: 'Indemnisation modifiée', type: 'success' });
      setEditTarget(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIndemnisation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['indemnisations'] });
      void queryClient.invalidateQueries({
        queryKey: ['indemnisations-stats'],
      });
      toast.add({ title: 'Indemnisation supprimée', type: 'success' });
      setDeleteTarget(undefined);
    },
  });

  // Réinitialise la page à 1 quand les filtres changent
  function applyFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  // Pastilles filtres actifs
  const activeChips = useMemo(() => {
    const chips: ActiveChip[] = [];
    if (search.trim())
      chips.push({ key: 'search', label: `Texte : "${search.trim()}"` });
    if (typeFilter !== 'Tous') chips.push({ key: 'type', label: typeFilter });
    if (tauxMin) chips.push({ key: 'tauxMin', label: `Taux ≥ ${tauxMin} %` });
    if (tauxMax) chips.push({ key: 'tauxMax', label: `Taux ≤ ${tauxMax} %` });
    if (montantMin)
      chips.push({ key: 'montantMin', label: `Montant ≥ ${montantMin} DT` });
    if (montantMax)
      chips.push({ key: 'montantMax', label: `Montant ≤ ${montantMax} DT` });
    return chips;
  }, [search, typeFilter, tauxMin, tauxMax, montantMin, montantMax]);

  const removeChip = (key: string) => {
    switch (key) {
      case 'search': {
        setSearch('');
        break;
      }
      case 'type': {
        setTypeFilter('Tous');
        break;
      }
      case 'tauxMin': {
        setTauxMin('');
        break;
      }
      case 'tauxMax': {
        setTauxMax('');
        break;
      }
      case 'montantMin': {
        setMontantMin('');
        break;
      }
      case 'montantMax': {
        setMontantMax('');
        // No default
        break;
      }
    }
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch('');
    setTypeFilter('Tous');
    setTauxMin('');
    setTauxMax('');
    setMontantMin('');
    setMontantMax('');
    setPage(1);
  };

  if (!isAssure && !isAdmin) {
    return (
      <div className="border-border bg-card text-muted-foreground rounded-2xl border p-6 text-sm">
        Accès réservé aux assurés et administrateurs.
      </div>
    );
  }

  const create = async (values: IndemnisationFormValues) => {
    setError(undefined);
    const montantIndemnise = Number.parseFloat(values.montantIndemnise);
    const tauxIndemnisation = Number.parseFloat(values.tauxIndemnisation);

    const habitationObj = habitationsMap[values.habitation];
    const habLabel =
      habitationObj?.label ||
      (habitationObj
        ? buildHabitationLabel(habitationObj.type, habitationObj.adresseBien)
        : '');

    await createMutation.mutateAsync({
      type: values.type,
      montantIndemnise,
      tauxIndemnisation,
      habitation: values.habitation,
      habitationLabel: habLabel,
      motifRefus: values.motifRefus?.trim() || undefined,
    });

    if (habitationObj?.assure) {
      addIndemnisationNotification({
        assureId: habitationObj.assure,
        habitation: habitationObj.id,
        habitationLabel: habLabel,
        type: values.type,
        montantIndemnise,
        tauxIndemnisation,
        motifRefus: values.motifRefus?.trim() || undefined,
      });
    }
  };

  const labelByType: Record<Indemnisation['type'], string> = {
    IndemnisationTotale: 'Totale',
    IndemnisationPartielle: 'Partielle',
    IndemnisationRefusee: 'Refusée',
  };

  const paginatedData = query.data;
  const totalPages = paginatedData?.totalPages ?? 1;
  const totalCount = paginatedData?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Indemnisations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isAssure
              ? 'Mes dossiers d’indemnisation en lecture seule'
              : 'Gestion et calcul des indemnisations'}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              form.reset({
                type: 'IndemnisationTotale',
                montantIndemnise: '',
                tauxIndemnisation: '',
                habitation: '',
                motifRefus: '',
              });
              setAddOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une indemnisation
          </Button>
        )}
      </div>

      {/* 4 Cartes statistiques SPARQL — Admin uniquement */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 shadow-sm">
            <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Indemnisations
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {statsQuery.isPending
                  ? '...'
                  : (statsQuery.data?.totalCount ?? 0)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                COUNT indemnisations
              </p>
            </div>
          </div>

          <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 shadow-sm">
            <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <Coins className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Montant total
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {statsQuery.isPending
                  ? '...'
                  : statsQuery.data?.sumMontantIndemnise
                    ? `${statsQuery.data.sumMontantIndemnise.toLocaleString('fr-TN')} DT`
                    : '0 DT'}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                SUM montantIndemnise
              </p>
            </div>
          </div>

          <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 shadow-sm">
            <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Montant max
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {statsQuery.isPending
                  ? '...'
                  : statsQuery.data?.maxMontantIndemnise
                    ? `${statsQuery.data.maxMontantIndemnise.toLocaleString('fr-TN')} DT`
                    : '0 DT'}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                MAX montantIndemnise
              </p>
            </div>
          </div>

          <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 shadow-sm">
            <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <PieChart className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Indem. partielles
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {statsQuery.isPending
                  ? '...'
                  : (statsQuery.data?.countPartielle ?? 0)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                COUNT partielles
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications pour l'Assuré */}
      {isAssure &&
        notifications.map((notification) => {
          const habObj = habitationsMap[notification.habitation];
          const habDisplay =
            notification.habitationLabel ||
            habObj?.label ||
            (habObj
              ? buildHabitationLabel(habObj.type, habObj.adresseBien)
              : 'Habitation assurée');

          return (
            <div
              key={notification.id}
              className="border-primary/30 bg-primary/5 flex items-start gap-3 rounded-2xl border p-4"
              role="status"
            >
              <div className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {notification.type === 'IndemnisationRefusee'
                    ? 'Dossier d’indemnisation refusé'
                    : 'Nouvelle indemnisation créée par l’administrateur'}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {habDisplay} —{' '}
                  {notification.type === 'IndemnisationRefusee' ? (
                    <span className="text-destructive font-medium">
                      Refusée (0 DT) — Motif :{' '}
                      {notification.motifRefus || 'Consultez les détails'}
                    </span>
                  ) : (
                    `${notification.montantIndemnise.toLocaleString('fr-TN')} DT — taux ${notification.tauxIndemnisation} %`
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Fermer la notification"
                onClick={() => {
                  const remaining = readIndemnisationNotifications().filter(
                    (item) => item.id !== notification.id
                  );
                  globalThis.localStorage.setItem(
                    notificationStorageKey,
                    JSON.stringify(remaining)
                  );
                  setNotifications((current) =>
                    current.filter((item) => item.id !== notification.id)
                  );
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

      {/* Barre de recherche, filtres et tri SPARQL */}
      <div className="border-border bg-card space-y-3 rounded-2xl border p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => applyFilter(setSearch)(e.target.value)}
              className="pl-9"
              placeholder="Recherche par texte, motif, adresse..."
            />
          </div>
          <NativeSelect
            value={typeFilter}
            onChange={(e) => applyFilter(setTypeFilter)(e.target.value)}
            className="w-full sm:w-44"
          >
            <NativeSelectOption value="Tous">Tous les types</NativeSelectOption>
            <NativeSelectOption value="Totale">
              Totale (100 %)
            </NativeSelectOption>
            <NativeSelectOption value="Partielle">Partielle</NativeSelectOption>
            <NativeSelectOption value="Refusee">Refusée</NativeSelectOption>
          </NativeSelect>
          <Button
            variant={showAdvanced ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAdvanced((v) => !v)}
            className="shrink-0"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres avancés
          </Button>
        </div>

        {/* Panneau filtres avancés : Taux min/max, Montant min/max, Tri */}
        {showAdvanced && (
          <div className="border-border bg-muted/30 grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-muted-foreground mb-1 block text-xs font-medium">
                Taux min (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={tauxMin}
                onChange={(e) => applyFilter(setTauxMin)(e.target.value)}
                placeholder="Ex : 20"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-1 block text-xs font-medium">
                Taux max (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={tauxMax}
                onChange={(e) => applyFilter(setTauxMax)(e.target.value)}
                placeholder="Ex : 80"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-1 block text-xs font-medium">
                Montant min (DT)
              </Label>
              <Input
                type="number"
                min="0"
                value={montantMin}
                onChange={(e) => applyFilter(setMontantMin)(e.target.value)}
                placeholder="Ex : 1000"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-1 block text-xs font-medium">
                Montant max (DT)
              </Label>
              <Input
                type="number"
                min="0"
                value={montantMax}
                onChange={(e) => applyFilter(setMontantMax)(e.target.value)}
                placeholder="Ex : 50000"
              />
            </div>

            {/* Menu de tri SPARQL */}
            <div className="flex flex-wrap items-center gap-3 pt-2 sm:col-span-2 lg:col-span-4">
              <span className="text-muted-foreground text-xs font-medium">
                Trier par :
              </span>
              <NativeSelect
                value={sortBy}
                onChange={(e) =>
                  applyFilter(setSortBy)(e.target.value as SortBy)
                }
                className="w-48 text-xs"
              >
                <NativeSelectOption value="montantIndemnise">
                  Montant indemnisé
                </NativeSelectOption>
                <NativeSelectOption value="tauxIndemnisation">
                  Taux d’indemnisation
                </NativeSelectOption>
              </NativeSelect>
              <NativeSelect
                value={sortOrder}
                onChange={(e) =>
                  applyFilter(setSortOrder)(e.target.value as SortOrder)
                }
                className="w-36 text-xs"
              >
                <NativeSelectOption value="desc">
                  Décroissant
                </NativeSelectOption>
                <NativeSelectOption value="asc">Croissant</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
        )}

        {/* Pastilles filtres actifs avec bouton × */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-muted-foreground text-xs">
              Filtres actifs :
            </span>
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                {chip.label}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeChip(chip.key)}
                  aria-label={`Supprimer le filtre ${chip.label}`}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ))}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground text-xs underline"
            >
              Tout effacer
            </Button>
          </div>
        )}
      </div>

      {query.isPending && (
        <p className="text-muted-foreground text-sm">Chargement...</p>
      )}
      {query.error && (
        <p className="text-destructive text-sm">
          Impossible de charger les indemnisations.
        </p>
      )}

      {/* Liste des dossiers */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(paginatedData?.items ?? []).map((item) => {
          const hab = habitationsMap[item.habitation];
          const habitationDisplayName =
            item.habitationLabel ||
            hab?.label ||
            (hab
              ? buildHabitationLabel(hab.type, hab.adresseBien)
              : 'Habitation assurée');

          const indemnisationDisplayName =
            item.label ||
            buildIndemnisationLabel(item.type, habitationDisplayName);

          return (
            <article
              key={item.id}
              className="border-border bg-card rounded-2xl border p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    item.type === 'IndemnisationRefusee'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted text-primary'
                  )}
                >
                  {labelByType[item.type]}
                </span>
              </div>
              <h2 className="mt-4 font-semibold">{indemnisationDisplayName}</h2>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-foreground font-medium">
                  {item.montantIndemnise.toLocaleString('fr-TN')} DT
                </p>
                <p className="text-muted-foreground">
                  Taux : {item.tauxIndemnisation} %
                </p>
                <p className="text-muted-foreground">
                  Habitation : {habitationDisplayName}
                </p>
              </div>

              {/* Affichage explicatif du motif de refus pour l'assuré */}
              {item.type === 'IndemnisationRefusee' && (
                <div className="bg-destructive/10 border-destructive/20 mt-3 rounded-xl border p-3 text-xs">
                  <div className="text-destructive flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Dossier refusé</span>
                  </div>
                  <p className="text-foreground mt-1">
                    <strong>Motif : </strong>
                    {item.motifRefus || 'Non précisé par l’administrateur.'}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-[11px] italic">
                    💡 L’assuré peut mettre à jour ses documents ou contacter le
                    support pour régulariser.
                  </p>
                </div>
              )}

              {isAdmin && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditTarget(item);
                      form.reset({
                        type: item.type,
                        montantIndemnise: String(item.montantIndemnise),
                        tauxIndemnisation: String(item.tauxIndemnisation),
                        habitation: item.habitation,
                        motifRefus: item.motifRefus || '',
                      });
                    }}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!query.isPending && (paginatedData?.items ?? []).length === 0 && (
        <div className="border-border bg-card text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
          Aucune indemnisation trouvée.
        </div>
      )}

      {/* Pagination (6 par page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {totalCount} résultat{totalCount > 1 ? 's' : ''} — page {page} /{' '}
            {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bloc repliable Requête SPARQL exécutée (réservé à l'Admin) */}
      {isAdmin && (
        <div className="border-border bg-card rounded-2xl border p-4 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSparqlOpen((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Terminal className="text-primary h-4 w-4" />
              <span className="text-sm font-semibold">
                Requête SPARQL exécutée
              </span>
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold">
                SPARQL 1.1
              </span>
            </div>
            {sparqlOpen ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </Button>

          {sparqlOpen && (
            <div className="mt-3 space-y-3">
              <pre className="bg-muted text-foreground max-h-72 overflow-x-auto rounded-xl p-3 font-mono text-xs whitespace-pre">
                {paginatedData?.sparqlQuery || 'Aucune requête exécutée'}
              </pre>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!paginatedData?.sparqlQuery) return;
                    await globalThis.navigator?.clipboard?.writeText(
                      paginatedData.sparqlQuery
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? (
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {copied ? 'Copié !' : 'Copier la requête'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    copyToClipboardSafe(paginatedData?.sparqlQuery);
                    const buttons = [
                      ...(globalThis.document?.querySelectorAll(
                        'aside nav button'
                      ) || []),
                    ];
                    const explorerBtn = buttons.find((btn) =>
                      btn.textContent?.includes('Explorateur SPARQL')
                    ) as HTMLElement | undefined;
                    if (explorerBtn) {
                      explorerBtn.click();
                      toast.add({
                        title: 'Explorateur SPARQL',
                        description:
                          'Requête copiée dans le presse-papiers et console ouverte.',
                        type: 'info',
                      });
                    } else {
                      toast.add({
                        title: 'Requête copiée',
                        description:
                          'Requête SPARQL copiée dans le presse-papiers.',
                        type: 'success',
                      });
                    }
                  }}
                >
                  <Code2 className="mr-1.5 h-3.5 w-3.5" />
                  Ouvrir dans l&apos;Explorateur
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogue d'ajout */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une indemnisation</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(create)} className="space-y-4">
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <NativeSelect {...field}>
                    <NativeSelectOption value="IndemnisationTotale">
                      Totale
                    </NativeSelectOption>
                    <NativeSelectOption value="IndemnisationPartielle">
                      Partielle
                    </NativeSelectOption>
                    <NativeSelectOption value="IndemnisationRefusee">
                      Refusée
                    </NativeSelectOption>
                  </NativeSelect>
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="habitation"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Habitation</FieldLabel>
                  <NativeSelect {...field}>
                    <NativeSelectOption value="">
                      Sélectionner une habitation
                    </NativeSelectOption>
                    {(habitationsQuery.data ?? []).map((h) => (
                      <NativeSelectOption key={h.id} value={h.id}>
                        {h.label || buildHabitationLabel(h.type, h.adresseBien)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />

            {(['montantIndemnise', 'tauxIndemnisation'] as const).map(
              (name) => (
                <Controller
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>
                        {name === 'montantIndemnise'
                          ? 'Montant (DT)'
                          : 'Taux (%)'}
                      </FieldLabel>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max={name === 'tauxIndemnisation' ? 100 : undefined}
                        step={name === 'montantIndemnise' ? '0.01' : '1'}
                        disabled={watchedType === 'IndemnisationRefusee'}
                      />
                      <FieldError
                        errors={fieldState.error ? [fieldState.error] : []}
                      />
                    </Field>
                  )}
                />
              )
            )}

            {/* Champ motif de refus si le type est Refusée */}
            {watchedType === 'IndemnisationRefusee' && (
              <Controller
                control={form.control}
                name="motifRefus"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>
                      Motif du refus (Explication pour l’assuré)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Ex: Factures justificatives manquantes, déclaration hors délai ou dommage non garanti par le contrat..."
                    />
                    <FieldError
                      errors={fieldState.error ? [fieldState.error] : []}
                    />
                  </Field>
                )}
              />
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue de modification */}
      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l’indemnisation</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              if (!editTarget) return;
              const habObj = habitationsMap[values.habitation];
              const habLabel =
                habObj?.label ||
                (habObj
                  ? buildHabitationLabel(habObj.type, habObj.adresseBien)
                  : '');

              await updateMutation.mutateAsync({
                id: editTarget.id,
                payload: {
                  type: values.type,
                  montantIndemnise: Number.parseFloat(values.montantIndemnise),
                  tauxIndemnisation: Number.parseFloat(
                    values.tauxIndemnisation
                  ),
                  habitation: values.habitation,
                  habitationLabel: habLabel,
                  motifRefus: values.motifRefus?.trim() || undefined,
                },
              });
            })}
            className="space-y-4"
          >
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <NativeSelect {...field}>
                    <NativeSelectOption value="IndemnisationTotale">
                      Totale
                    </NativeSelectOption>
                    <NativeSelectOption value="IndemnisationPartielle">
                      Partielle
                    </NativeSelectOption>
                    <NativeSelectOption value="IndemnisationRefusee">
                      Refusée
                    </NativeSelectOption>
                  </NativeSelect>
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="habitation"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Habitation</FieldLabel>
                  <NativeSelect {...field}>
                    {(habitationsQuery.data ?? []).map((h) => (
                      <NativeSelectOption key={h.id} value={h.id}>
                        {h.label || buildHabitationLabel(h.type, h.adresseBien)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="montantIndemnise"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Montant (DT)</FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={watchedType === 'IndemnisationRefusee'}
                  />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="tauxIndemnisation"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Taux (%)</FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    max={100}
                    step="1"
                    disabled={watchedType === 'IndemnisationRefusee'}
                  />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            {watchedType === 'IndemnisationRefusee' && (
              <Controller
                control={form.control}
                name="motifRefus"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>
                      Motif du refus (Explication pour l’assuré)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Ex: Factures justificatives manquantes..."
                    />
                    <FieldError
                      errors={fieldState.error ? [fieldState.error] : []}
                    />
                  </Field>
                )}
              />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(undefined)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l’indemnisation</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Confirmer la suppression de{' '}
            {deleteTarget?.label || 'cette indemnisation'} ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(undefined)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
