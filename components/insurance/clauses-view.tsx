'use client';

import React, { useState, useEffect } from 'react';
import type { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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

import { clauseFormSchema } from '@/lib/schemas/forms';
import type {
  Clause,
  CreateClausePayload,
  UpdateClausePayload,
} from '@/lib/types/clauses';
import {
  createClause,
  deleteClause,
  listClauses,
  updateClause,
} from '@/lib/services/clauses';
import {
  Scale,
  PlusCircle,
  Trash2,
  Pencil,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  Percent,
  FileCheck2,
  Ban,
  CheckCircle2,
} from 'lucide-react';

type ClauseFormValues = z.infer<typeof clauseFormSchema>;

const getClauseTypeInfo = (type: string) => {
  if (type.includes('Exclusion')) {
    return {
      label: 'Exclusion',
      color:
        'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:border-destructive',
      icon: Ban,
      iconColor: 'text-destructive',
    };
  } else if (type.includes('Franchise')) {
    return {
      label: 'Franchise',
      color:
        'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary',
      icon: Percent,
      iconColor: 'text-primary',
    };
  }
  return {
    label: 'Obligatoire',
    color:
      'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary',
    icon: CheckCircle2,
    iconColor: 'text-primary',
  };
};

interface ClausesViewProps {
  userRole?: string;
  onCountChange?: (count: number) => void;
}

export function ClausesView({
  userRole = 'Assure',
  onCountChange,
}: ClausesViewProps) {
  const queryClient = useQueryClient();
  const clausesQuery = useQuery({
    queryKey: ['clauses'],
    queryFn: listClauses,
  });
  const createMutation = useMutation({
    mutationFn: createClause,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clauses'] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateClausePayload;
    }) => updateClause(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clauses'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteClause,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clauses'] });
    },
  });
  const clauses = clausesQuery.data ?? [];
  const loading = clausesQuery.isPending;
  const error = clausesQuery.error
    ? clausesQuery.error instanceof Error
      ? clausesQuery.error.message
      : 'Impossible de charger les clauses.'
    : undefined;
  const [filterType, setFilterType] = useState<string>('Tous');
  const [search, setSearch] = useState('');

  // Modale d'ajout
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addError, setAddError] = useState<string | undefined>();

  const clauseForm = useForm<ClauseFormValues>({
    resolver: zodResolver(clauseFormSchema),
    defaultValues: {
      type: 'ClauseExclusion',
      texte_clause: '',
      description: '',
      taux_franchise: '10',
      contrat_id: 'Contrat1',
    },
  });

  // Modale d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Clause | undefined>();
  const [editError, setEditError] = useState<string | undefined>();

  const editClauseForm = useForm<ClauseFormValues>({
    resolver: zodResolver(clauseFormSchema),
  });

  // Suppression
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | undefined>();

  const canManage = ['Agent', 'Admin'].includes(userRole);
  const canDelete = userRole === 'Admin';

  useEffect(() => {
    if (onCountChange && clausesQuery.data) {
      onCountChange(clausesQuery.data.length);
    }
  }, [clausesQuery.data, onCountChange]);

  const fetchClauses = () => {
    void clausesQuery.refetch();
  };

  const handleCreateClause = async (values: ClauseFormValues) => {
    setAddError(undefined);
    const payload: CreateClausePayload = {
      type_clause: values.type,
      texte_clause: values.texte_clause,
      description: values.description || undefined,
      contrat_id: values.contrat_id || undefined,
    };
    if (values.type === 'ClauseFranchise') {
      payload.taux_franchise = values.taux_franchise
        ? Number.parseFloat(values.taux_franchise)
        : 0;
    }
    try {
      await createMutation.mutateAsync(payload);
      setIsAddModalOpen(false);
      clauseForm.reset();
    } catch (error_: unknown) {
      setAddError((error_ as Error).message);
    }
  };

  const openEditModal = (c: Clause) => {
    setEditTarget(c);
    editClauseForm.reset({
      type: (c.type || 'ClauseExclusion') as ClauseFormValues['type'],
      texte_clause: c.texte_clause || '',
      description: c.description || '',
      taux_franchise: c.taux_franchise === null ? '' : String(c.taux_franchise),
      contrat_id: c.contrat || '',
    });
    setEditError(undefined);
    setIsEditModalOpen(true);
  };

  const handleUpdateClause = async (values: ClauseFormValues) => {
    if (!editTarget) return;
    setEditError(undefined);
    const payload: UpdateClausePayload = {
      type_clause: values.type,
      texte_clause: values.texte_clause,
      description: values.description || undefined,
      contrat_id: values.contrat_id || undefined,
    };
    if (values.type === 'ClauseFranchise') {
      payload.taux_franchise = values.taux_franchise
        ? Number.parseFloat(values.taux_franchise)
        : 0;
    } else {
      payload.taux_franchise = undefined;
    }
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, payload });
      setIsEditModalOpen(false);
      editClauseForm.reset();
    } catch (error_: unknown) {
      setEditError((error_ as Error).message);
    }
  };

  const handleDeleteClause = async (id: string) => {
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
  const filteredClauses = clauses.filter((c) => {
    const matchType =
      filterType === 'Tous' ||
      c.type.toLowerCase().includes(filterType.toLowerCase());
    const matchSearch =
      c.texte_clause.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      (c.description &&
        c.description.toLowerCase().includes(search.toLowerCase())) ||
      (c.contrat && c.contrat.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-card text-primary dark:bg-card dark:text-primary rounded-xl p-2">
              <Scale className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-foreground dark:text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                Clauses Juridiques & Contractuelles
              </h1>
              <p className="text-muted-foreground dark:text-muted-foreground text-xs sm:text-sm">
                Classe ontologique{' '}
                <code className="text-primary dark:text-primary font-mono">
                  Clause
                </code>{' '}
                reliée aux Contrats via{' '}
                <code className="text-primary dark:text-primary font-mono">
                  aPourClause
                </code>{' '}
                (Module Montaha Trabelsi).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchClauses}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            <span>Actualiser</span>
          </Button>

          {canManage && (
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              <span>Nouvelle Clause</span>
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
            placeholder="Rechercher par libellé de clause, ID, contrat lié..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-muted/50 dark:bg-muted/50 pl-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-xs font-medium">
            Type de clause :
          </span>
          <NativeSelect
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            size="sm"
          >
            <NativeSelectOption value="Tous">
              Toutes les clauses
            </NativeSelectOption>
            <NativeSelectOption value="Exclusion">
              Clause d&apos;Exclusion
            </NativeSelectOption>
            <NativeSelectOption value="Franchise">
              Clause de Franchise
            </NativeSelectOption>
            <NativeSelectOption value="Obligatoire">
              Clause Obligatoire
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
            onClick={fetchClauses}
            className="ml-4 h-auto p-0 font-bold underline"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Tableau des clauses */}
      <div className="border-border bg-card dark:border-border dark:bg-card overflow-hidden rounded-2xl border shadow-sm">
        <Table className="text-left">
          <TableHeader>
            <TableRow className="bg-muted/50 text-muted-foreground hover:bg-muted/50 dark:bg-muted/50 dark:text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Identifiant & Type
              </TableHead>
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Texte de la Clause
              </TableHead>
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Taux de Franchise
              </TableHead>
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Contrat Rattaché
              </TableHead>
              <TableHead className="h-auto px-4 py-3.5 font-semibold">
                Description
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
                  colSpan={canManage ? 6 : 5}
                  className="text-muted-foreground py-12 text-center whitespace-normal"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="text-primary h-6 w-6 animate-spin" />
                    <span>
                      Chargement des clauses depuis l&apos;ontologie...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredClauses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className="text-muted-foreground py-12 text-center whitespace-normal"
                >
                  Aucune clause trouvée selon vos filtres.
                </TableCell>
              </TableRow>
            ) : (
              filteredClauses.map((c) => {
                const typeInfo = getClauseTypeInfo(c.type);
                const Icon = typeInfo.icon;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'bg-muted dark:bg-card rounded-lg p-1.5',
                            typeInfo.iconColor
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <span className="text-foreground dark:text-foreground font-mono font-semibold">
                            {c.id}
                          </span>
                          <div className="mt-0.5">
                            <span
                              className={cn(
                                'inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold',
                                typeInfo.color
                              )}
                            >
                              {typeInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-sm px-4 py-3.5 whitespace-normal">
                      <p className="text-foreground dark:text-foreground line-clamp-3 font-medium">
                        {c.texte_clause}
                      </p>
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      {c.taux_franchise === null ? (
                        <span className="text-muted-foreground text-[11px] italic">
                          {c.type.includes('Franchise')
                            ? 'Non fixé'
                            : 'Non applicable'}
                        </span>
                      ) : (
                        <span className="border-primary/20 bg-primary/10 text-primary dark:border-primary dark:bg-primary/20 dark:text-primary inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold">
                          <Percent className="h-3 w-3" />
                          {c.taux_franchise}%
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3.5">
                      {c.contrat ? (
                        <span className="border-primary/20 bg-primary/10 text-primary dark:border-primary dark:bg-primary/20 dark:text-primary inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold">
                          <FileCheck2 className="h-3 w-3" />
                          {c.contrat}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">
                          Clause globale
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-muted-foreground dark:text-muted-foreground max-w-xs px-4 py-3.5 whitespace-normal">
                      <p className="line-clamp-2 text-[11px]">
                        {c.description || (
                          <span className="text-muted-foreground italic">
                            Aucune description
                          </span>
                        )}
                      </p>
                    </TableCell>

                    {canManage && (
                      <TableCell className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditModal(c)}
                            title="Modifier la clause"
                            className="text-muted-foreground hover:text-primary dark:text-muted-foreground dark:hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteConfirmId(c.id)}
                              title="Supprimer la clause"
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

      {/* Modal Ajout Clause */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Ajouter une Nouvelle Clause
            </DialogTitle>
          </DialogHeader>

          {addError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive rounded-xl border p-3 text-xs">
              {addError}
            </div>
          )}

          <form
            onSubmit={clauseForm.handleSubmit(handleCreateClause)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="clause-add-type">
                  Sous-classe OWL
                </FieldLabel>
                <Controller
                  name="type"
                  control={clauseForm.control}
                  render={({ field }) => (
                    <NativeSelect {...field} id="clause-add-type">
                      <NativeSelectOption value="ClauseExclusion">
                        Clause d&apos;Exclusion
                      </NativeSelectOption>
                      <NativeSelectOption value="ClauseFranchise">
                        Clause de Franchise
                      </NativeSelectOption>
                      <NativeSelectOption value="ClauseObligatoire">
                        Clause Obligatoire
                      </NativeSelectOption>
                    </NativeSelect>
                  )}
                />
                <FieldError errors={[clauseForm.formState.errors.type]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="clause-add-contrat">
                  Contrat lié (optionnel)
                </FieldLabel>
                <Controller
                  name="contrat_id"
                  control={clauseForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="clause-add-contrat"
                      type="text"
                      placeholder="Contrat1"
                    />
                  )}
                />
                <FieldError errors={[clauseForm.formState.errors.contrat_id]} />
              </Field>
            </div>
            {clauseForm.getValues('type') === 'ClauseFranchise' && (
              <div className="border-primary/20 bg-primary/10 dark:border-primary/20 dark:bg-primary/20 rounded-xl border p-3">
                <Field>
                  <FieldLabel htmlFor="clause-add-taux">
                    Taux de Franchise (%) *
                  </FieldLabel>
                  <Controller
                    name="taux_franchise"
                    control={clauseForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="clause-add-taux"
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                      />
                    )}
                  />
                  <FieldError
                    errors={[clauseForm.formState.errors.taux_franchise]}
                  />
                </Field>
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="clause-add-texte">
                Texte juridique de la clause *
              </FieldLabel>
              <Controller
                name="texte_clause"
                control={clauseForm.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="clause-add-texte"
                    rows={3}
                    placeholder="Ex: Exclusion de garantie pour les dommages causés par humidité constante..."
                    aria-invalid={Boolean(
                      clauseForm.formState.errors.texte_clause
                    )}
                  />
                )}
              />
              <FieldError errors={[clauseForm.formState.errors.texte_clause]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="clause-add-desc">
                Description / Remarque
              </FieldLabel>
              <Controller
                name="description"
                control={clauseForm.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="clause-add-desc"
                    type="text"
                    placeholder="Note interne ou explicatif pour l'assuré"
                  />
                )}
              />
              <FieldError errors={[clauseForm.formState.errors.description]} />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Ajouter à l&apos;ontologie</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Édition Clause */}
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
              Modifier la Clause : {editTarget?.id}
            </DialogTitle>
          </DialogHeader>

          {editError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive rounded-xl border p-3 text-xs">
              {editError}
            </div>
          )}

          <form
            onSubmit={editClauseForm.handleSubmit(handleUpdateClause)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="clause-edit-type">
                  Sous-classe OWL
                </FieldLabel>
                <Controller
                  name="type"
                  control={editClauseForm.control}
                  render={({ field }) => (
                    <NativeSelect {...field} id="clause-edit-type">
                      <NativeSelectOption value="ClauseExclusion">
                        Clause d&apos;Exclusion
                      </NativeSelectOption>
                      <NativeSelectOption value="ClauseFranchise">
                        Clause de Franchise
                      </NativeSelectOption>
                      <NativeSelectOption value="ClauseObligatoire">
                        Clause Obligatoire
                      </NativeSelectOption>
                    </NativeSelect>
                  )}
                />
                <FieldError errors={[editClauseForm.formState.errors.type]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="clause-edit-contrat">
                  Contrat lié
                </FieldLabel>
                <Controller
                  name="contrat_id"
                  control={editClauseForm.control}
                  render={({ field }) => (
                    <Input {...field} id="clause-edit-contrat" type="text" />
                  )}
                />
                <FieldError
                  errors={[editClauseForm.formState.errors.contrat_id]}
                />
              </Field>
            </div>
            {editClauseForm.getValues('type') === 'ClauseFranchise' && (
              <div className="border-primary/20 bg-primary/10 dark:border-primary/20 dark:bg-primary/20 rounded-xl border p-3">
                <Field>
                  <FieldLabel htmlFor="clause-edit-taux">
                    Taux de Franchise (%)
                  </FieldLabel>
                  <Controller
                    name="taux_franchise"
                    control={editClauseForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="clause-edit-taux"
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                      />
                    )}
                  />
                  <FieldError
                    errors={[editClauseForm.formState.errors.taux_franchise]}
                  />
                </Field>
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="clause-edit-texte">
                Texte juridique de la clause
              </FieldLabel>
              <Controller
                name="texte_clause"
                control={editClauseForm.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="clause-edit-texte"
                    rows={3}
                    aria-invalid={Boolean(
                      editClauseForm.formState.errors.texte_clause
                    )}
                  />
                )}
              />
              <FieldError
                errors={[editClauseForm.formState.errors.texte_clause]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="clause-edit-desc">Description</FieldLabel>
              <Controller
                name="description"
                control={editClauseForm.control}
                render={({ field }) => (
                  <Input {...field} id="clause-edit-desc" type="text" />
                )}
              />
              <FieldError
                errors={[editClauseForm.formState.errors.description]}
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
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
              Supprimer la clause ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground dark:text-muted-foreground text-xs">
            Êtes-vous sûr de vouloir retirer la clause{' '}
            <strong className="text-foreground dark:text-foreground">
              {deleteConfirmId}
            </strong>{' '}
            du graphe ontologique ?
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
                deleteConfirmId && handleDeleteClause(deleteConfirmId)
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
