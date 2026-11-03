'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  PlusCircle,
  Trash2,
  Pencil,
  Search,
  Filter,
  RefreshCw,
  X,
  ShieldAlert,
  Calendar,
  MapPin,
  Activity,
} from 'lucide-react';

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

const getGraviteBadge = (gravite: string) => {
  switch (gravite) {
    case 'Grave': {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800';
    }
    case 'Moyen': {
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    }
    default: {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    }
  }
};

const getTypeBadge = (type: string) => {
  if (type.includes('Materiel')) {
    return {
      label: 'Matériel',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      icon: '🏚️',
    };
  } else if (type.includes('Corporel')) {
    return {
      label: 'Corporel',
      color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      icon: '🩺',
    };
  } else {
    return {
      label: 'Immatériel',
      color:
        'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
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
  const [addType, setAddType] = useState('DommageMateriel');
  const [addDescription, setAddDescription] = useState('');
  const [addMontant, setAddMontant] = useState('1200');
  const [addGravite, setAddGravite] = useState('Faible');
  const [addSinistreId, setAddSinistreId] = useState('Sinistre1');
  const [addDate, setAddDate] = useState('2026-03-20T10:00:00');
  const [addLieu, setAddLieu] = useState('Tunis');
  const [addError, setAddError] = useState<string | undefined>();

  // Modale d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Dommage | undefined>();
  const [editType, setEditType] = useState('DommageMateriel');
  const [editDescription, setEditDescription] = useState('');
  const [editMontant, setEditMontant] = useState('');
  const [editGravite, setEditGravite] = useState('Faible');
  const [editSinistreId, setEditSinistreId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLieu, setEditLieu] = useState('');
  const [editError, setEditError] = useState<string | undefined>();

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

  const handleCreateDommage = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setAddError(undefined);
    if (!addDescription.trim()) {
      setAddError('La description du dommage est obligatoire.');
      return;
    }

    const payload: CreateDommagePayload = {
      type_dommage: addType,
      description: addDescription,
      montant: Number.parseFloat(addMontant) || 0,
      gravite: addGravite,
      sinistre_id: addSinistreId || undefined,
      date: addDate,
      lieu: addLieu,
    };

    try {
      await createMutation.mutateAsync(payload);
      setIsAddModalOpen(false);
      setAddDescription('');
    } catch (error_: unknown) {
      setAddError((error_ as Error).message);
    }
  };

  const openEditModal = (d: Dommage) => {
    setEditTarget(d);
    setEditType(d.type || 'DommageMateriel');
    setEditDescription(d.description || '');
    setEditMontant(d.montant ? String(d.montant) : '0');
    setEditGravite(d.gravite || 'Faible');
    setEditSinistreId(d.sinistre || '');
    setEditDate(d.date || '2026-03-20T10:00:00');
    setEditLieu(d.lieu || '');
    setEditError(undefined);
    setIsEditModalOpen(true);
  };

  const handleUpdateDommage = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(undefined);

    const payload: UpdateDommagePayload = {
      type_dommage: editType,
      description: editDescription,
      montant: Number.parseFloat(editMontant) || 0,
      gravite: editGravite,
      sinistre_id: editSinistreId || undefined,
      date: editDate,
      lieu: editLieu,
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
      alert(`Erreur : ${(error_ as Error).message}`);
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
            <span className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
                Gestion des Dommages & Conséquences
              </h1>
              <p className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
                Classe ontologique{' '}
                <code className="font-mono text-amber-600 dark:text-amber-400">
                  Dommage
                </code>{' '}
                rattachée aux Sinistres déclarés (Module Montaha Trabelsi).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDommages}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nouveau Dommage</span>
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
            placeholder="Rechercher par description, lieu, ID ou sinistre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pr-4 pl-10 text-xs text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-500">
            Sous-classe :
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs font-medium text-zinc-800 focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="Tous">Tous les dommages</option>
            <option value="Materiel">Dommage Matériel</option>
            <option value="Corporel">Dommage Corporel</option>
            <option value="Immateriel">Dommage Immatériel</option>
          </select>
        </div>
      </div>

      {/* Erreur de chargement */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span>{error}</span>
          <button onClick={fetchDommages} className="ml-4 font-bold underline">
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau des dommages */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <th className="px-4 py-3.5">Identifiant & Type</th>
                <th className="px-4 py-3.5">Description du Sinistre</th>
                <th className="px-4 py-3.5">Gravité</th>
                <th className="px-4 py-3.5">Montant Estimé / Indemnisé</th>
                <th className="px-4 py-3.5">Sinistre Associé</th>
                <th className="px-4 py-3.5">Date & Lieu</th>
                {canManage && (
                  <th className="px-4 py-3.5 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="py-12 text-center text-zinc-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
                      <span>
                        Chargement des triplets Dommage depuis le graphe RDF...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredDommages.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="py-12 text-center text-zinc-400"
                  >
                    Aucun dommage ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredDommages.map((d) => {
                  const typeInfo = getTypeBadge(d.type);
                  return (
                    <tr
                      key={d.id}
                      className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{typeInfo.icon}</span>
                          <div>
                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {d.id}
                            </span>
                            <div className="mt-0.5">
                              <span
                                className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${typeInfo.color}`}
                              >
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-xs px-4 py-3.5">
                        <p className="line-clamp-2 font-medium text-zinc-800 dark:text-zinc-200">
                          {d.description || (
                            <span className="text-zinc-400 italic">
                              Aucune description
                            </span>
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getGraviteBadge(d.gravite)}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {d.gravite || 'Non qualifié'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {d.montant
                            ? Number(d.montant).toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                              })
                            : '0,00'}{' '}
                          DT
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {d.sinistre ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700 dark:bg-zinc-800 dark:text-blue-300">
                            <Activity className="h-3 w-3" />
                            {d.sinistre}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">
                            Non lié
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                        <div className="space-y-0.5 text-[11px]">
                          {d.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-zinc-400" />
                              <span>{d.date.replace('T', ' ')}</span>
                            </div>
                          )}
                          {d.lieu && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-zinc-400" />
                              <span>{d.lieu}</span>
                            </div>
                          )}
                          {!d.date && !d.lieu && (
                            <span className="italic">Non renseigné</span>
                          )}
                        </div>
                      </td>

                      {canManage && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(d)}
                              title="Modifier ce dommage"
                              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {canDelete && (
                              <button
                                onClick={() => setDeleteConfirmId(d.id)}
                                title="Supprimer ce dommage de l'ontologie"
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

      {/* Modal Ajout Dommage */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl duration-200 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Déclarer un Nouveau Dommage
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

            <form onSubmit={handleCreateDommage} className="mt-4 space-y-4">
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
                    <option value="DommageMateriel">Dommage Matériel</option>
                    <option value="DommageCorporel">Dommage Corporel</option>
                    <option value="DommageImmateriel">
                      Dommage Immatériel
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Niveau de Gravité
                  </label>
                  <select
                    value={addGravite}
                    onChange={(e) => setAddGravite(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="Faible">Faible</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Grave">Grave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Description du dommage *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Fissuration de la toiture suite à infiltration des eaux pluviales..."
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Montant estimé (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={addMontant}
                    onChange={(e) => setAddMontant(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Sinistre rattaché
                  </label>
                  <input
                    type="text"
                    placeholder="Sinistre1"
                    value={addSinistreId}
                    onChange={(e) => setAddSinistreId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Date du sinistre
                  </label>
                  <input
                    type="text"
                    placeholder="2026-03-20T10:00:00"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Lieu
                  </label>
                  <input
                    type="text"
                    placeholder="Tunis, Ariane..."
                    value={addLieu}
                    onChange={(e) => setAddLieu(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
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
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Créer dans l&apos;ontologie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Édition Dommage */}
      {isEditModalOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl duration-200 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-blue-600">
                <Pencil className="h-5 w-5" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Modifier le Dommage : {editTarget.id}
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

            <form onSubmit={handleUpdateDommage} className="mt-4 space-y-4">
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
                    <option value="DommageMateriel">Dommage Matériel</option>
                    <option value="DommageCorporel">Dommage Corporel</option>
                    <option value="DommageImmateriel">
                      Dommage Immatériel
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Niveau de Gravité
                  </label>
                  <select
                    value={editGravite}
                    onChange={(e) => setEditGravite(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="Faible">Faible</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Grave">Grave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Description du dommage
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Montant estimé (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editMontant}
                    onChange={(e) => setEditMontant(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Sinistre rattaché
                  </label>
                  <input
                    type="text"
                    value={editSinistreId}
                    onChange={(e) => setEditSinistreId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Date du sinistre
                  </label>
                  <input
                    type="text"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Lieu
                  </label>
                  <input
                    type="text"
                    value={editLieu}
                    onChange={(e) => setEditLieu(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
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
                  Enregistrer les modifications
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
                Supprimer le dommage ?
              </h3>
            </div>
            <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
              Êtes-vous sûr de vouloir supprimer définitivement{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">
                {deleteConfirmId}
              </strong>{' '}
              de l&apos;ontologie RDF ? Tous les triplets associés seront
              retirés du graphe de connaissances.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(undefined)}
                className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteDommage(deleteConfirmId)}
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
