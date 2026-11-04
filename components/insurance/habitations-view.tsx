'use client';

import React, { useMemo, useState } from 'react';
import type { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code2,
  Coins,
  Copy,
  Maximize2,
  Pencil,
  Plus,
  Search,
  Terminal,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { habitationFormSchema } from '@/lib/schemas/habitations';
import {
  createHabitation,
  deleteHabitation,
  getHabitationStats,
  queryHabitations,
  updateHabitation,
} from '@/lib/services/habitations';
import {
  buildHabitationLabel,
  type Habitation,
  type HabitationsFilterParams,
} from '@/lib/types/habitations';
import type { UserSession } from '@/lib/types/auth';

type HabitationFormValues = z.infer<typeof habitationFormSchema>;

type SortBy = HabitationsFilterParams['sortBy'];
type SortOrder = 'asc' | 'desc';

interface ActiveChip {
  key: string;
  label: string;
}

interface HabitationsViewProps {
  userRole?: string;
  currentUser?: UserSession;
}

const PAGE_SIZE = 6;

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

export function HabitationsView({
  userRole = 'Assure',
  currentUser,
}: HabitationsViewProps) {
  const isAssure = userRole === 'Assure';
  const isAdmin = userRole === 'Admin';
  const queryClient = useQueryClient();

  // Filtres
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [superficieMin, setSuperficieMin] = useState('');
  const [superficieMax, setSuperficieMax] = useState('');
  const [valeurBienMin, setValeurBienMin] = useState('');
  const [valeurBienMax, setValeurBienMax] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('adresseBien');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Habitation>();
  const [deleteTarget, setDeleteTarget] = useState<Habitation>();
  const [error, setError] = useState<string>();
  const [sparqlOpen, setSparqlOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Params SPARQL
  const filterParams: HabitationsFilterParams = useMemo(
    () => ({
      assureId: isAssure
        ? (currentUser?.ontology_id ?? '__no_access__')
        : undefined,
      search: search || undefined,
      type: typeFilter === 'Tous' ? undefined : typeFilter,
      superficieMin: superficieMin ? Number(superficieMin) : undefined,
      superficieMax: superficieMax ? Number(superficieMax) : undefined,
      valeurBienMin: valeurBienMin ? Number(valeurBienMin) : undefined,
      valeurBienMax: valeurBienMax ? Number(valeurBienMax) : undefined,
      sortBy,
      sortOrder,
      page,
      pageSize: PAGE_SIZE,
    }),
    [
      isAssure,
      currentUser?.ontology_id,
      search,
      typeFilter,
      superficieMin,
      superficieMax,
      valeurBienMin,
      valeurBienMax,
      sortBy,
      sortOrder,
      page,
    ]
  );

  const query = useQuery({
    queryKey: ['habitations', filterParams],
    queryFn: () => queryHabitations(filterParams),
  });

  const statsQuery = useQuery({
    queryKey: ['habitations-stats', currentUser?.ontology_id, isAssure],
    queryFn: () =>
      getHabitationStats(
        isAssure ? (currentUser?.ontology_id ?? '__no_access__') : undefined
      ),
  });

  const form = useForm<HabitationFormValues>({
    resolver: zodResolver(habitationFormSchema),
    defaultValues: {
      type: 'Maison',
      adresseBien: '',
      superficie: '',
      valeurBien: '',
    },
  });

  const mutation = useMutation({
    mutationFn: createHabitation,
    onError: (error_: Error) => {
      setError(error_.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habitations'] });
      void queryClient.invalidateQueries({ queryKey: ['habitations-stats'] });
      toast.add({ title: 'Habitation créée', type: 'success' });
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
      payload: Parameters<typeof updateHabitation>[1];
    }) => updateHabitation(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habitations'] });
      void queryClient.invalidateQueries({ queryKey: ['habitations-stats'] });
      toast.add({ title: 'Habitation modifiée', type: 'success' });
      setEditTarget(undefined);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteHabitation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habitations'] });
      void queryClient.invalidateQueries({ queryKey: ['habitations-stats'] });
      toast.add({ title: 'Habitation supprimée', type: 'success' });
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
    if (search) chips.push({ key: 'search', label: `Texte : "${search}"` });
    if (typeFilter !== 'Tous') chips.push({ key: 'type', label: typeFilter });
    if (superficieMin)
      chips.push({ key: 'supMin', label: `Sup. ≥ ${superficieMin} m²` });
    if (superficieMax)
      chips.push({ key: 'supMax', label: `Sup. ≤ ${superficieMax} m²` });
    if (valeurBienMin)
      chips.push({ key: 'valMin', label: `Valeur ≥ ${valeurBienMin} DT` });
    if (valeurBienMax)
      chips.push({ key: 'valMax', label: `Valeur ≤ ${valeurBienMax} DT` });
    return chips;
  }, [
    search,
    typeFilter,
    superficieMin,
    superficieMax,
    valeurBienMin,
    valeurBienMax,
  ]);

  const removeChip = (key: string) => {
    switch (key) {
      case 'search': {
        applyFilter(setSearch)('');
        break;
      }
      case 'type': {
        applyFilter(setTypeFilter)('Tous');
        break;
      }
      case 'supMin': {
        applyFilter(setSuperficieMin)('');
        break;
      }
      case 'supMax': {
        applyFilter(setSuperficieMax)('');
        break;
      }
      case 'valMin': {
        applyFilter(setValeurBienMin)('');
        break;
      }
      case 'valMax': {
        applyFilter(setValeurBienMax)('');
        // No default
        break;
      }
    }
  };

  if (!isAssure && !isAdmin) {
    return (
      <div className="border-border bg-card text-muted-foreground rounded-2xl border p-6 text-sm">
        Accès réservé aux assurés et administrateurs.
      </div>
    );
  }

  const create = async (values: HabitationFormValues) => {
    setError(undefined);
    if (isAssure && !currentUser?.ontology_id) {
      setError('Session utilisateur incomplète.');
      return;
    }
    await mutation.mutateAsync({
      type: values.type,
      adresseBien: values.adresseBien,
      superficie: Number.parseFloat(values.superficie),
      valeurBien: values.valeurBien
        ? Number.parseFloat(values.valeurBien)
        : undefined,
      assure: currentUser?.ontology_id ?? '',
    });
  };

  const paginatedData = query.data;
  const totalPages = paginatedData?.totalPages ?? 1;
  const totalCount = paginatedData?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Habitations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isAssure ? 'Mes habitations' : 'Toutes les habitations'}
          </p>
        </div>
        {isAssure && (
          <Button
            onClick={() => {
              form.reset({
                type: 'Maison',
                adresseBien: '',
                superficie: '',
                valeurBien: '',
              });
              setAddOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une habitation
          </Button>
        )}
      </div>

      {/* Cartes statistiques SPARQL — Admin uniquement */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 shadow-sm">
            <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Habitations
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {statsQuery.isPending
                  ? '...'
                  : (statsQuery.data?.totalCount ?? 0)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                COUNT habitations
              </p>
            </div>
          </div>

          <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 shadow-sm">
            <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <Maximize2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Superficie moy.
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {statsQuery.isPending
                  ? '...'
                  : statsQuery.data?.avgSuperficie
                    ? `${statsQuery.data.avgSuperficie} m²`
                    : '0 m²'}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                AVG superficie
              </p>
            </div>
          </div>

          <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 shadow-sm">
            <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <Coins className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Valeur totale
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {statsQuery.isPending
                  ? '...'
                  : statsQuery.data?.sumValeurBien
                    ? `${statsQuery.data.sumValeurBien.toLocaleString('fr-TN')} DT`
                    : '0 DT'}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                SUM valeurBien
              </p>
            </div>
          </div>

          <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 shadow-sm">
            <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Valeur max
              </p>
              <p className="text-foreground mt-1 text-2xl font-bold">
                {statsQuery.isPending
                  ? '...'
                  : statsQuery.data?.maxValeurBien
                    ? `${statsQuery.data.maxValeurBien.toLocaleString('fr-TN')} DT`
                    : '0 DT'}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                MAX valeurBien
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barre de filtres */}
      <div className="border-border bg-card space-y-3 rounded-2xl border p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => applyFilter(setSearch)(e.target.value)}
              className="pl-9"
              placeholder="Ville, adresse, type..."
            />
          </div>
          <NativeSelect
            value={typeFilter}
            onChange={(e) => applyFilter(setTypeFilter)(e.target.value)}
            className="w-full sm:w-40"
          >
            <NativeSelectOption value="Tous">Tous les types</NativeSelectOption>
            <NativeSelectOption value="Maison">Maison</NativeSelectOption>
            <NativeSelectOption value="Appartement">
              Appartement
            </NativeSelectOption>
            <NativeSelectOption value="Studio">Studio</NativeSelectOption>
            <NativeSelectOption value="Villa">Villa</NativeSelectOption>
          </NativeSelect>
          <NativeSelect
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split(':');
              setSortBy(by as SortBy);
              setSortOrder(order as SortOrder);
              setPage(1);
            }}
            className="w-full sm:w-56"
          >
            <NativeSelectOption value="adresseBien:asc">
              Adresse A→Z
            </NativeSelectOption>
            <NativeSelectOption value="adresseBien:desc">
              Adresse Z→A
            </NativeSelectOption>
            <NativeSelectOption value="superficie:asc">
              Superficie croissante
            </NativeSelectOption>
            <NativeSelectOption value="superficie:desc">
              Superficie décroissante
            </NativeSelectOption>
            <NativeSelectOption value="valeurBien:asc">
              Valeur croissante
            </NativeSelectOption>
            <NativeSelectOption value="valeurBien:desc">
              Valeur décroissante
            </NativeSelectOption>
          </NativeSelect>
        </div>

        {/* Filtres numériques */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <Label className="text-muted-foreground mb-1 block text-xs">
              Sup. min (m²)
            </Label>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={superficieMin}
              onChange={(e) => applyFilter(setSuperficieMin)(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-muted-foreground mb-1 block text-xs">
              Sup. max (m²)
            </Label>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="∞"
              value={superficieMax}
              onChange={(e) => applyFilter(setSuperficieMax)(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-muted-foreground mb-1 block text-xs">
              Valeur min (DT)
            </Label>
            <Input
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              value={valeurBienMin}
              onChange={(e) => applyFilter(setValeurBienMin)(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-muted-foreground mb-1 block text-xs">
              Valeur max (DT)
            </Label>
            <Input
              type="number"
              min="0"
              step="1000"
              placeholder="∞"
              value={valeurBienMax}
              onChange={(e) => applyFilter(setValeurBienMax)(e.target.value)}
            />
          </div>
        </div>

        {/* Pastilles filtres actifs */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
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
              onClick={() => {
                setSearch('');
                setTypeFilter('Tous');
                setSuperficieMin('');
                setSuperficieMax('');
                setValeurBienMin('');
                setValeurBienMax('');
                setPage(1);
              }}
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
          Impossible de charger les habitations.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(paginatedData?.items ?? []).map((item) => (
          <article
            key={item.id}
            className="border-border bg-card rounded-2xl border p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="bg-muted text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
                {item.type}
              </span>
            </div>
            <h2 className="mt-4 font-semibold">
              {item.label || buildHabitationLabel(item.type, item.adresseBien)}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {item.adresseBien || 'Adresse non renseignée'}
            </p>
            <p className="mt-3 text-sm font-medium">{item.superficie} m²</p>
            {item.valeurBien !== undefined && (
              <p className="text-muted-foreground mt-1 text-sm">
                Valeur : {item.valeurBien.toLocaleString('fr-TN')} DT
              </p>
            )}
            {isAssure && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditTarget(item);
                    form.reset({
                      type: item.type,
                      adresseBien: item.adresseBien,
                      superficie: String(item.superficie),
                      valeurBien: item.valeurBien
                        ? String(item.valeurBien)
                        : '',
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
        ))}
      </div>

      {!query.isPending && (paginatedData?.items ?? []).length === 0 && (
        <div className="border-border bg-card text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
          Aucune habitation trouvée.
        </div>
      )}

      {/* Pagination */}
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

      {/* Dialog Ajouter */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une habitation</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(create)} className="space-y-4">
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <NativeSelect {...field}>
                    <NativeSelectOption value="Maison">
                      Maison
                    </NativeSelectOption>
                    <NativeSelectOption value="Appartement">
                      Appartement
                    </NativeSelectOption>
                    <NativeSelectOption value="Studio">
                      Studio
                    </NativeSelectOption>
                    <NativeSelectOption value="Villa">Villa</NativeSelectOption>
                  </NativeSelect>
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="adresseBien"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Adresse</FieldLabel>
                  <Input {...field} />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="superficie"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Superficie (m²)</FieldLabel>
                  <Input {...field} type="number" min="1" step="0.1" />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="valeurBien"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Valeur du bien (DT)</FieldLabel>
                  <Input {...field} type="number" min="0" step="0.01" />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier */}
      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;habitation</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              if (!editTarget) return;
              await updateMutation.mutateAsync({
                id: editTarget.id,
                payload: {
                  type: values.type,
                  adresseBien: values.adresseBien,
                  superficie: Number.parseFloat(values.superficie),
                  valeurBien: values.valeurBien
                    ? Number.parseFloat(values.valeurBien)
                    : undefined,
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
                    <NativeSelectOption value="Maison">
                      Maison
                    </NativeSelectOption>
                    <NativeSelectOption value="Appartement">
                      Appartement
                    </NativeSelectOption>
                    <NativeSelectOption value="Studio">
                      Studio
                    </NativeSelectOption>
                    <NativeSelectOption value="Villa">Villa</NativeSelectOption>
                  </NativeSelect>
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="adresseBien"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Adresse</FieldLabel>
                  <Input {...field} />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="superficie"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Superficie (m²)</FieldLabel>
                  <Input {...field} type="number" min="1" step="0.1" />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="valeurBien"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Valeur du bien (DT)</FieldLabel>
                  <Input {...field} type="number" min="0" step="0.01" />
                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : []}
                  />
                </Field>
              )}
            />
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

      {/* Dialog Supprimer */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;habitation</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Confirmer la suppression de{' '}
            {deleteTarget
              ? deleteTarget.label ||
                buildHabitationLabel(
                  deleteTarget.type,
                  deleteTarget.adresseBien
                )
              : ''}{' '}
            ?
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
