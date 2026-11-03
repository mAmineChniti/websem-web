'use client';

import React, { useState, useEffect } from 'react';
import type { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  PlusCircle,
  Trash2,
  Pencil,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  Calendar,
  MapPin,
  Activity,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { dommageFormSchema } from '@/lib/schemas/forms';

import type {
  CreateDommagePayload,
  Dommage,
  UpdateDommagePayload,
} from '@/lib/types/dommages';
import {
  createDommage,
  deleteDommage,
  listDommages,
  updateDommage,
} from '@/lib/services/dommages';

type DommageFormValues = z.infer<typeof dommageFormSchema>;

const getGraviteBadge = (gravite: string) => {
  switch (gravite) {
    case 'Grave': {
      return 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:border-destructive';
    }
    case 'Moyen': {
      return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary';
    }
    default: {
      return 'bg-secondary/10 text-secondary-foreground border-secondary/20 dark:bg-secondary/20 dark:text-secondary-foreground dark:border-secondary';
    }
  }
};

const getTypeBadge = (type: string) => {
  if (type.includes('Materiel')) {
    return {
      label: 'Matériel',
      color: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
      icon: '🏚️',
    };
  } else if (type.includes('Corporel')) {
    return {
      label: 'Corporel',
      color:
        'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive',
      icon: '🩺',
    };
  } else {
    return {
      label: 'Immatériel',
      color: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
      icon: '📑',
    };
  }
};

interface DommagesViewProps {
  userRole?: string;
  onCountChange?: (count: number) => void;
}

export function DommagesView({
  userRole = 'Assure',
  onCountChange,
}: DommagesViewProps) {
  const queryClient = useQueryClient();
  const dommagesQuery = useQuery({
    queryKey: ['dommages'],
    queryFn: listDommages,
  });
  const createMutation = useMutation({
    mutationFn: createDommage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dommages'] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateDommagePayload;
    }) => updateDommage(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dommages'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDommage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dommages'] });
    },
  });
  const dommages = dommagesQuery.data ?? [];
  const loading = dommagesQuery.isPending;
  const error = dommagesQuery.error
    ? dommagesQuery.error instanceof Error
      ? dommagesQuery.error.message
      : 'Impossible de charger les dommages.'
    : undefined;
  const [filterType, setFilterType] = useState<string>('Tous');
  const [search, setSearch] = useState('');

  // Modale d'ajout
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addError, setAddError] = useState<string | undefined>();

  const dommageForm = useForm<DommageFormValues>({
    resolver: zodResolver(dommageFormSchema),
    defaultValues: {
      type: 'DommageMateriel',
      description: '',
      montant: '1200',
      gravite: 'Faible',
      sinistre_id: 'Sinistre1',
      date: '2026-03-20T10:00:00',
      lieu: 'Tunis',
    },
  });

  // Modale d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Dommage | undefined>();
  const [editError, setEditError] = useState<string | undefined>();

  const editDommageForm = useForm<DommageFormValues>({
    resolver: zodResolver(dommageFormSchema),
  });

  // Suppression
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | undefined>();

  // Habilitations selon le rôle
  const canManage = ['Agent', 'Admin', 'Expert'].includes(userRole);
  const canDelete = userRole === 'Admin';

  useEffect(() => {
    if (onCountChange && dommagesQuery.data) {
      onCountChange(dommagesQuery.data.length);
    }
  }, [dommagesQuery.data, onCountChange]);

  const fetchDommages = () => {
    void dommagesQuery.refetch();
  };

  const handleCreateDommage = async (values: DommageFormValues) => {
    setAddError(undefined);

    const payload: CreateDommagePayload = {
      type_dommage: values.type,
      description: values.description,
      montant: Number.parseFloat(values.montant) || 0,
      gravite: values.gravite,
      sinistre_id: values.sinistre_id || undefined,
      date: values.date || undefined,
      lieu: values.lieu || undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      setIsAddModalOpen(false);
      dommageForm.reset();
    } catch (error_: unknown) {
      setAddError((error_ as Error).message);
    }
  };

  const openEditModal = (d: Dommage) => {
    setEditTarget(d);
    editDommageForm.reset({
      type:
        d.type === 'DommageCorporel' || d.type === 'DommageImmateriel'
          ? d.type
          : 'DommageMateriel',
      description: d.description || '',
      montant: String(d.montant ?? 0),
      gravite:
        d.gravite === 'Moyen' || d.gravite === 'Grave' ? d.gravite : 'Faible',
      sinistre_id: d.sinistre ?? '',
      date: d.date ?? '2026-03-20T10:00:00',
      lieu: d.lieu ?? '',
    });
    setEditError(undefined);
    setIsEditModalOpen(true);
  };

  const handleUpdateDommage = async (values: DommageFormValues) => {
    if (!editTarget) return;
    setEditError(undefined);

    const payload: UpdateDommagePayload = {
      type_dommage: values.type,
      description: values.description,
      montant: Number.parseFloat(values.montant) || 0,
      gravite: values.gravite,
      sinistre_id: values.sinistre_id || undefined,
      date: values.date || undefined,
      lieu: values.lieu || undefined,
    };

    try {
      await updateMutation.mutateAsync({ id: editTarget.id, payload });
      setIsEditModalOpen(false);
    } catch (error_: unknown) {
      setEditError((error_ as Error).message);
    }
  };

  const handleDeleteDommage = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirmId(undefined);
    } catch (error_: unknown) {
      toast.add({
        title: 'Erreur',
        description: (error_ as Error).message,
        type: 'error',
      });
    }
  };

  // Filtrage
  const filteredDommages = dommages.filter((d) => {
    const matchType =
      filterType === 'Tous' ||
      d.type.toLowerCase().includes(filterType.toLowerCase());
    const matchSearch =
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      (d.lieu && d.lieu.toLowerCase().includes(search.toLowerCase())) ||
      (d.sinistre && d.sinistre.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-card text-primary dark:bg-card dark:text-primary rounded-xl p-2">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-foreground dark:text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                Gestion des Dommages & Conséquences
              </h1>
              <p className="text-muted-foreground dark:text-muted-foreground text-xs sm:text-sm">
                Classe ontologique{' '}
                <code className="text-primary dark:text-primary font-mono">
                  Dommage
                </code>{' '}
                rattachée aux Sinistres déclarés (Module Montaha Trabelsi).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDommages}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            <span>Actualiser</span>
          </Button>

          {canManage && (
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              <span>Nouveau Dommage</span>
            </Button>
          )}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="border-border bg-card dark:border-border dark:bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Rechercher par description, lieu, ID ou sinistre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-muted/50 dark:bg-muted/50 pl-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-xs font-medium">
            Sous-classe :
          </span>
          <NativeSelect
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            size="sm"
          >
            <NativeSelectOption value="Tous">
              Tous les dommages
            </NativeSelectOption>
            <NativeSelectOption value="Materiel">
              Dommage Matériel
            </NativeSelectOption>
            <NativeSelectOption value="Corporel">
              Dommage Corporel
            </NativeSelectOption>
            <NativeSelectOption value="Immateriel">
              Dommage Immatériel
            </NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      {/* Erreur de chargement */}
      {error && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive flex items-center justify-between rounded-2xl border p-4 text-xs">
          <span>{error}</span>
          <Button
            variant="link"
            size="sm"
            onClick={fetchDommages}
            className="ml-4 h-auto p-0 font-bold underline"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Tableau des dommages */}
      <div className="border-border bg-card dark:border-border dark:bg-card overflow-hidden rounded-2xl border shadow-sm">
        <Table className="text-left">
          <TableHeader>
            <TableRow className="bg-muted/50 text-muted-foreground hover:bg-muted/50 dark:bg-muted/50 dark:text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Identifiant & Type
              </TableHead>
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Description du Sinistre
              </TableHead>
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Gravité
              </TableHead>
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Montant Estimé / Indemnisé
              </TableHead>
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Sinistre Associé
              </TableHead>
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Date & Lieu
              </TableHead>
              {canManage && (
                <TableHead className="h-auto px-4 py-3.5 text-right font-semibold">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 7 : 6}
                  className="text-muted-foreground py-12 text-center whitespace-normal"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="text-primary h-6 w-6 animate-spin" />
                    <span>
                      Chargement des triplets Dommage depuis le graphe RDF...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDommages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 7 : 6}
                  className="text-muted-foreground py-12 text-center whitespace-normal"
                >
                  Aucun dommage ne correspond aux critères de recherche.
                </TableCell>
              </TableRow>
            ) : (
              filteredDommages.map((d) => {
                const typeInfo = getTypeBadge(d.type);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{typeInfo.icon}</span>
                        <div>
                          <span className="text-foreground dark:text-foreground font-mono font-semibold">
                            {d.id}
                          </span>
                          <div className="mt-0.5">
                            <span
                              className={cn(
                                'inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                                typeInfo.color
                              )}
                            >
                              {typeInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs px-4 py-3.5 whitespace-normal">
                      <p className="text-foreground dark:text-foreground line-clamp-2 font-medium">
                        {d.description || (
                          <span className="text-muted-foreground italic">
                            Aucune description
                          </span>
                        )}
                      </p>
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                          getGraviteBadge(d.gravite)
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {d.gravite || 'Non qualifié'}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      <div className="text-foreground dark:text-foreground font-mono font-semibold">
                        {d.montant
                          ? Number(d.montant).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                            })
                          : '0,00'}{' '}
                        DT
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      {d.sinistre ? (
                        <span className="bg-muted text-foreground dark:bg-card dark:text-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold">
                          <Activity className="h-3 w-3" />
                          {d.sinistre}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">
                          Non lié
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-muted-foreground dark:text-muted-foreground px-4 py-3.5 whitespace-normal">
                      <div className="space-y-0.5 text-[11px]">
                        {d.date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="text-muted-foreground h-3 w-3" />
                            <span>{d.date.replace('T', ' ')}</span>
                          </div>
                        )}
                        {d.lieu && (
                          <div className="flex items-center gap-1">
                            <MapPin className="text-muted-foreground h-3 w-3" />
                            <span>{d.lieu}</span>
                          </div>
                        )}
                        {!d.date && !d.lieu && (
                          <span className="italic">Non renseigné</span>
                        )}
                      </div>
                    </TableCell>

                    {canManage && (
                      <TableCell className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditModal(d)}
                            title="Modifier ce dommage"
                            className="text-muted-foreground hover:text-primary dark:text-muted-foreground dark:hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteConfirmId(d.id)}
                              title="Supprimer ce dommage de l'ontologie"
                              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive dark:text-muted-foreground dark:hover:bg-destructive/20 dark:hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Ajout Dommage */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Déclarer un Nouveau Dommage
            </DialogTitle>
          </DialogHeader>

          {addError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive rounded-xl border p-3 text-xs">
              {addError}
            </div>
          )}

          <form
            onSubmit={dommageForm.handleSubmit(handleCreateDommage)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="dommage-add-type">
                  Sous-classe OWL
                </FieldLabel>
                <Controller
                  name="type"
                  control={dommageForm.control}
                  render={({ field }) => (
                    <NativeSelect id="dommage-add-type" {...field}>
                      <NativeSelectOption value="DommageMateriel">
                        Dommage Matériel
                      </NativeSelectOption>
                      <NativeSelectOption value="DommageCorporel">
                        Dommage Corporel
                      </NativeSelectOption>
                      <NativeSelectOption value="DommageImmateriel">
                        Dommage Immatériel
                      </NativeSelectOption>
                    </NativeSelect>
                  )}
                />
                <FieldError errors={[dommageForm.formState.errors.type]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="dommage-add-gravite">
                  Niveau de Gravité
                </FieldLabel>
                <Controller
                  name="gravite"
                  control={dommageForm.control}
                  render={({ field }) => (
                    <NativeSelect id="dommage-add-gravite" {...field}>
                      <NativeSelectOption value="Faible">
                        Faible
                      </NativeSelectOption>
                      <NativeSelectOption value="Moyen">
                        Moyen
                      </NativeSelectOption>
                      <NativeSelectOption value="Grave">
                        Grave
                      </NativeSelectOption>
                    </NativeSelect>
                  )}
                />
                <FieldError errors={[dommageForm.formState.errors.gravite]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="dommage-add-description">
                Description du dommage *
              </FieldLabel>
              <Controller
                name="description"
                control={dommageForm.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="dommage-add-description"
                    rows={3}
                    placeholder="Ex: Fissuration de la toiture suite à infiltration des eaux pluviales..."
                    aria-invalid={Boolean(
                      dommageForm.formState.errors.description
                    )}
                  />
                )}
              />
              <FieldError errors={[dommageForm.formState.errors.description]} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="dommage-add-montant">
                  Montant estimé (DT)
                </FieldLabel>
                <Controller
                  name="montant"
                  control={dommageForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="dommage-add-montant"
                      type="number"
                      step="0.01"
                      min="0"
                      aria-invalid={Boolean(
                        dommageForm.formState.errors.montant
                      )}
                    />
                  )}
                />
                <FieldError errors={[dommageForm.formState.errors.montant]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="dommage-add-sinistre">
                  Sinistre rattaché
                </FieldLabel>
                <Controller
                  name="sinistre_id"
                  control={dommageForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="dommage-add-sinistre"
                      type="text"
                      placeholder="Sinistre1"
                    />
                  )}
                />
                <FieldError
                  errors={[dommageForm.formState.errors.sinistre_id]}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="dommage-add-date">
                  Date du sinistre
                </FieldLabel>
                <Controller
                  name="date"
                  control={dommageForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="dommage-add-date"
                      type="text"
                      placeholder="2026-03-20T10:00:00"
                    />
                  )}
                />
                <FieldError errors={[dommageForm.formState.errors.date]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="dommage-add-lieu">Lieu</FieldLabel>
                <Controller
                  name="lieu"
                  control={dommageForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="dommage-add-lieu"
                      type="text"
                      placeholder="Tunis, Ariane..."
                    />
                  )}
                />
                <FieldError errors={[dommageForm.formState.errors.lieu]} />
              </Field>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Créer dans l&apos;ontologie</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Édition Dommage */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsEditModalOpen(false);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Modifier le Dommage : {editTarget?.id}
            </DialogTitle>
          </DialogHeader>

          {editError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive rounded-xl border p-3 text-xs">
              {editError}
            </div>
          )}

          <form
            onSubmit={editDommageForm.handleSubmit(handleUpdateDommage)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="dommage-edit-type">
                  Sous-classe OWL
                </FieldLabel>
                <Controller
                  name="type"
                  control={editDommageForm.control}
                  render={({ field }) => (
                    <NativeSelect id="dommage-edit-type" {...field}>
                      <NativeSelectOption value="DommageMateriel">
                        Dommage Matériel
                      </NativeSelectOption>
                      <NativeSelectOption value="DommageCorporel">
                        Dommage Corporel
                      </NativeSelectOption>
                      <NativeSelectOption value="DommageImmateriel">
                        Dommage Immatériel
                      </NativeSelectOption>
                    </NativeSelect>
                  )}
                />
                <FieldError errors={[editDommageForm.formState.errors.type]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="dommage-edit-gravite">
                  Niveau de Gravité
                </FieldLabel>
                <Controller
                  name="gravite"
                  control={editDommageForm.control}
                  render={({ field }) => (
                    <NativeSelect id="dommage-edit-gravite" {...field}>
                      <NativeSelectOption value="Faible">
                        Faible
                      </NativeSelectOption>
                      <NativeSelectOption value="Moyen">
                        Moyen
                      </NativeSelectOption>
                      <NativeSelectOption value="Grave">
                        Grave
                      </NativeSelectOption>
                    </NativeSelect>
                  )}
                />
                <FieldError
                  errors={[editDommageForm.formState.errors.gravite]}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="dommage-edit-description">
                Description du dommage *
              </FieldLabel>
              <Controller
                name="description"
                control={editDommageForm.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="dommage-edit-description"
                    rows={3}
                    aria-invalid={Boolean(
                      editDommageForm.formState.errors.description
                    )}
                  />
                )}
              />
              <FieldError
                errors={[editDommageForm.formState.errors.description]}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="dommage-edit-montant">
                  Montant estimé (DT)
                </FieldLabel>
                <Controller
                  name="montant"
                  control={editDommageForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="dommage-edit-montant"
                      type="number"
                      step="0.01"
                      min="0"
                      aria-invalid={Boolean(
                        editDommageForm.formState.errors.montant
                      )}
                    />
                  )}
                />
                <FieldError
                  errors={[editDommageForm.formState.errors.montant]}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="dommage-edit-sinistre">
                  Sinistre rattaché
                </FieldLabel>
                <Controller
                  name="sinistre_id"
                  control={editDommageForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="dommage-edit-sinistre"
                      type="text"
                      placeholder="Sinistre1"
                    />
                  )}
                />
                <FieldError
                  errors={[editDommageForm.formState.errors.sinistre_id]}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="dommage-edit-date">
                  Date du sinistre
                </FieldLabel>
                <Controller
                  name="date"
                  control={editDommageForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="dommage-edit-date"
                      type="text"
                      placeholder="2026-03-20T10:00:00"
                    />
                  )}
                />
                <FieldError errors={[editDommageForm.formState.errors.date]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="dommage-edit-lieu">Lieu</FieldLabel>
                <Controller
                  name="lieu"
                  control={editDommageForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="dommage-edit-lieu"
                      type="text"
                      placeholder="Tunis, Ariane..."
                    />
                  )}
                />
                <FieldError errors={[editDommageForm.formState.errors.lieu]} />
              </Field>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <Dialog
        open={Boolean(deleteConfirmId)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(undefined);
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-3">
              <ShieldAlert className="h-6 w-6" />
              Supprimer le dommage ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground dark:text-muted-foreground text-xs">
            Êtes-vous sûr de vouloir supprimer définitivement{' '}
            <strong className="text-foreground dark:text-foreground">
              {deleteConfirmId}
            </strong>{' '}
            de l&apos;ontologie RDF ? Tous les triplets associés seront retirés
            du graphe de connaissances.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(undefined)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmId && handleDeleteDommage(deleteConfirmId)
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
