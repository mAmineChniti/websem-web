'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  X,
  ShieldAlert,
  Percent,
  FileCheck2,
  Ban,
  CheckCircle2,
} from 'lucide-react';

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
  const [addType, setAddType] = useState('ClauseExclusion');
  const [addTexte, setAddTexte] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addTauxFranchise, setAddTauxFranchise] = useState('10');
  const [addContratId, setAddContratId] = useState('Contrat1');
  const [addError, setAddError] = useState<string | undefined>();

  // Modale d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Clause | undefined>();
  const [editType, setEditType] = useState('ClauseExclusion');
  const [editTexte, setEditTexte] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTauxFranchise, setEditTauxFranchise] = useState('');
  const [editContratId, setEditContratId] = useState('');
  const [editError, setEditError] = useState<string | undefined>();

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

  const handleCreateClause = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setAddError(undefined);
    if (!addTexte.trim()) {
      setAddError('Le texte de la clause est obligatoire.');
      return;
    }

    const payload: CreateClausePayload = {
      type_clause: addType,
      texte_clause: addTexte,
      description: addDescription || undefined,
      contrat_id: addContratId || undefined,
    };

    if (addType === 'ClauseFranchise') {
      payload.taux_franchise = Number.parseFloat(addTauxFranchise) || 0;
    }

    try {
      await createMutation.mutateAsync(payload);
      setIsAddModalOpen(false);
      setAddTexte('');
      setAddDescription('');
    } catch (error_: unknown) {
      setAddError((error_ as Error).message);
    }
  };

  const openEditModal = (c: Clause) => {
    setEditTarget(c);
    setEditType(c.type || 'ClauseExclusion');
    setEditTexte(c.texte_clause || '');
    setEditDescription(c.description || '');
    setEditTauxFranchise(
      c.taux_franchise === null ? '' : String(c.taux_franchise)
    );
    setEditContratId(c.contrat || '');
    setEditError(undefined);
    setIsEditModalOpen(true);
  };

  const handleUpdateClause = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(undefined);

    const payload: UpdateClausePayload = {
      type_clause: editType,
      texte_clause: editTexte,
      description: editDescription || undefined,
      contrat_id: editContratId || undefined,
    };

    if (editType === 'ClauseFranchise') {
      payload.taux_franchise = editTauxFranchise
        ? Number.parseFloat(editTauxFranchise)
        : 0;
    } else {
      payload.taux_franchise = undefined;
    }

    try {
      await updateMutation.mutateAsync({ id: editTarget.id, payload });
      setIsEditModalOpen(false);
    } catch (error_: unknown) {
      setEditError((error_ as Error).message);
    }
  };

  const handleDeleteClause = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirmId(undefined);
    } catch (error_: unknown) {
      alert(`Erreur: ${(error_ as Error).message}`);
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

  const getClauseTypeInfo = (type: string) => {
    if (type.includes('Exclusion')) {
      return {
        label: 'Exclusion',
        color:
          'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900',
        icon: Ban,
        iconColor: 'text-rose-600',
      };
    } else if (type.includes('Franchise')) {
      return {
        label: 'Franchise',
        color:
          'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
        icon: Percent,
        iconColor: 'text-amber-600',
      };
    } else {
      return {
        label: 'Obligatoire',
        color:
          'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900',
        icon: CheckCircle2,
        iconColor: 'text-indigo-600',
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Scale className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
                Clauses Juridiques & Contractuelles
              </h1>
              <p className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
                Classe ontologique{' '}
                <code className="font-mono text-purple-600 dark:text-purple-400">
                  Clause
                </code>{' '}
                reliée aux Contrats via{' '}
                <code className="font-mono text-purple-600 dark:text-purple-400">
                  aPourClause
                </code>{' '}
                (Module Montaha Trabelsi).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchClauses}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-purple-700"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nouvelle Clause</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher par libellé de clause, ID, contrat lié..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pr-4 pl-10 text-xs text-zinc-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-500">
            Type de clause :
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs font-medium text-zinc-800 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="Tous">Toutes les clauses</option>
            <option value="Exclusion">Clause d&apos;Exclusion</option>
            <option value="Franchise">Clause de Franchise</option>
            <option value="Obligatoire">Clause Obligatoire</option>
          </select>
        </div>
      </div>

      {/* Erreur de chargement */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span>{error}</span>
          <button onClick={fetchClauses} className="ml-4 font-bold underline">
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau des clauses */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <th className="px-4 py-3.5">Identifiant & Type</th>
                <th className="px-4 py-3.5">Texte de la Clause</th>
                <th className="px-4 py-3.5">Taux de Franchise</th>
                <th className="px-4 py-3.5">Contrat Rattaché</th>
                <th className="px-4 py-3.5">Description</th>
                {canManage && (
                  <th className="px-4 py-3.5 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="py-12 text-center text-zinc-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
                      <span>
                        Chargement des clauses depuis l&apos;ontologie...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredClauses.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="py-12 text-center text-zinc-400"
                  >
                    Aucune clause trouvée selon vos filtres.
                  </td>
                </tr>
              ) : (
                filteredClauses.map((c) => {
                  const typeInfo = getClauseTypeInfo(c.type);
                  const Icon = typeInfo.icon;
                  return (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`rounded-lg bg-zinc-100 p-1.5 dark:bg-zinc-800 ${typeInfo.iconColor}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {c.id}
                            </span>
                            <div className="mt-0.5">
                              <span
                                className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${typeInfo.color}`}
                              >
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-sm px-4 py-3.5">
                        <p className="line-clamp-3 font-medium text-zinc-800 dark:text-zinc-200">
                          {c.texte_clause}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        {c.taux_franchise === null ? (
                          <span className="text-[11px] text-zinc-400 italic">
                            {c.type.includes('Franchise')
                              ? 'Non fixé'
                              : 'Non applicable'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                            <Percent className="h-3 w-3" />
                            {c.taux_franchise}%
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {c.contrat ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <FileCheck2 className="h-3 w-3" />
                            {c.contrat}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">
                            Clause globale
                          </span>
                        )}
                      </td>

                      <td className="max-w-xs px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                        <p className="line-clamp-2 text-[11px]">
                          {c.description || (
                            <span className="text-zinc-400 italic">
                              Aucune description
                            </span>
                          )}
                        </p>
                      </td>

                      {canManage && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(c)}
                              title="Modifier la clause"
                              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {canDelete && (
                              <button
                                onClick={() => setDeleteConfirmId(c.id)}
                                title="Supprimer la clause"
                                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout Clause */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl duration-200 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-purple-600">
                <Scale className="h-5 w-5" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Ajouter une Nouvelle Clause
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateClause} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Sous-classe OWL
                  </label>
                  <select
                    value={addType}
                    onChange={(e) => setAddType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="ClauseExclusion">
                      Clause d&apos;Exclusion
                    </option>
                    <option value="ClauseFranchise">Clause de Franchise</option>
                    <option value="ClauseObligatoire">
                      Clause Obligatoire
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Contrat lié (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Contrat1"
                    value={addContratId}
                    onChange={(e) => setAddContratId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Champ conditionnel pour ClauseFranchise */}
              {addType === 'ClauseFranchise' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <label className="mb-1 block text-xs font-semibold text-amber-900 dark:text-amber-300">
                    Taux de Franchise (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      placeholder="10.0"
                      value={addTauxFranchise}
                      onChange={(e) => setAddTauxFranchise(e.target.value)}
                      className="w-full rounded-xl border border-amber-200 bg-white p-2 pr-8 text-xs font-medium dark:border-amber-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <Percent className="absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-amber-600" />
                  </div>
                  <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">
                    Propriété OWL :{' '}
                    <code className="font-mono">as:tauxFranchise</code>{' '}
                    (DatatypeProperty xsd:float).
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Texte juridique de la clause *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Exclusion de garantie pour les dommages causés par humidité constante sans sinistre soudain..."
                  value={addTexte}
                  onChange={(e) => setAddTexte(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Description / Remarque
                </label>
                <input
                  type="text"
                  placeholder="Note interne ou explicatif pour l'assuré"
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Ajouter à l&apos;ontologie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Édition Clause */}
      {isEditModalOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl duration-200 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-blue-600">
                <Pencil className="h-5 w-5" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Modifier la Clause : {editTarget.id}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateClause} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Sous-classe OWL
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="ClauseExclusion">
                      Clause d&apos;Exclusion
                    </option>
                    <option value="ClauseFranchise">Clause de Franchise</option>
                    <option value="ClauseObligatoire">
                      Clause Obligatoire
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Contrat lié
                  </label>
                  <input
                    type="text"
                    value={editContratId}
                    onChange={(e) => setEditContratId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Champ conditionnel pour Franchise */}
              {editType === 'ClauseFranchise' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <label className="mb-1 block text-xs font-semibold text-amber-900 dark:text-amber-300">
                    Taux de Franchise (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={editTauxFranchise}
                    onChange={(e) => setEditTauxFranchise(e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-white p-2 text-xs font-medium dark:border-amber-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Texte juridique de la clause
                </label>
                <textarea
                  rows={3}
                  value={editTexte}
                  onChange={(e) => setEditTexte(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-zinc-900">
            <div className="mb-3 flex items-center gap-3 text-red-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Supprimer la clause ?
              </h3>
            </div>
            <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
              Êtes-vous sûr de vouloir retirer la clause{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">
                {deleteConfirmId}
              </strong>{' '}
              du graphe ontologique ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(undefined)}
                className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteClause(deleteConfirmId)}
                className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
