'use client';

import React, { useState, useEffect } from 'react';
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
  FileText,
  AlertCircle,
  ShieldCheck,
  Ban,
  CheckCircle2,
} from 'lucide-react';

interface Clause {
  id: string;
  type: string;
  texte_clause: string;
  description?: string;
  taux_franchise?: number | null;
  contrat?: string | null;
}

interface ClausesViewProps {
  userRole?: string;
  onCountChange?: (count: number) => void;
}

export function ClausesView({ userRole = 'Assure', onCountChange }: ClausesViewProps) {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('Tous');
  const [search, setSearch] = useState('');

  // Modale d'ajout
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState('ClauseExclusion');
  const [addTexte, setAddTexte] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addTauxFranchise, setAddTauxFranchise] = useState('10');
  const [addContratId, setAddContratId] = useState('Contrat1');
  const [addError, setAddError] = useState<string | null>(null);

  // Modale d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Clause | null>(null);
  const [editType, setEditType] = useState('ClauseExclusion');
  const [editTexte, setEditTexte] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTauxFranchise, setEditTauxFranchise] = useState('');
  const [editContratId, setEditContratId] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Suppression
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const canManage = userRole === 'Agent' || userRole === 'Admin';
  const canDelete = userRole === 'Admin';

  const fetchClauses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/clauses/`);
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setClauses(data);
      if (onCountChange) onCountChange(data.length);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les clauses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClauses();
  }, []);

  const handleCreateClause = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addTexte.trim()) {
      setAddError('Le texte de la clause est obligatoire.');
      return;
    }

    try {
      const payload: any = {
        type_clause: addType,
        texte_clause: addTexte,
        description: addDescription,
        contrat_id: addContratId || null,
      };

      if (addType === 'ClauseFranchise') {
        payload.taux_franchise = parseFloat(addTauxFranchise) || 0;
      }

      const res = await fetch(`${apiUrl}/api/clauses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erreur lors de la création de la clause');
      }

      setIsAddModalOpen(false);
      setAddTexte('');
      setAddDescription('');
      fetchClauses();
    } catch (err: any) {
      setAddError(err.message);
    }
  };

  const openEditModal = (c: Clause) => {
    setEditTarget(c);
    setEditType(c.type || 'ClauseExclusion');
    setEditTexte(c.texte_clause || '');
    setEditDescription(c.description || '');
    setEditTauxFranchise(c.taux_franchise !== undefined && c.taux_franchise !== null ? String(c.taux_franchise) : '');
    setEditContratId(c.contrat || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateClause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);

    try {
      const payload: any = {
        type_clause: editType,
        texte_clause: editTexte,
        description: editDescription,
        contrat_id: editContratId || null,
      };

      if (editType === 'ClauseFranchise') {
        payload.taux_franchise = editTauxFranchise ? parseFloat(editTauxFranchise) : 0;
      } else {
        payload.taux_franchise = null;
      }

      const res = await fetch(`${apiUrl}/api/clauses/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erreur lors de la modification');
      }

      setIsEditModalOpen(false);
      fetchClauses();
    } catch (err: any) {
      setEditError(err.message);
    }
  };

  const handleDeleteClause = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/clauses/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setDeleteConfirmId(null);
      fetchClauses();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
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
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
      (c.contrat && c.contrat.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const getClauseTypeInfo = (type: string) => {
    if (type.includes('Exclusion')) {
      return {
        label: 'Exclusion',
        color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900',
        icon: Ban,
        iconColor: 'text-rose-600',
      };
    } else if (type.includes('Franchise')) {
      return {
        label: 'Franchise',
        color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
        icon: Percent,
        iconColor: 'text-amber-600',
      };
    } else {
      return {
        label: 'Obligatoire',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900',
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
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Scale className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Clauses Juridiques & Contractuelles
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Classe ontologique <code className="font-mono text-purple-600 dark:text-purple-400">Clause</code> reliée aux Contrats via <code className="font-mono text-purple-600 dark:text-purple-400">aPourClause</code> (Module Montaha Trabelsi).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchClauses}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nouvelle Clause</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher par libellé de clause, ID, contrat lié..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-500">Type de clause :</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs font-medium text-zinc-800 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="Tous">Toutes les clauses</option>
            <option value="Exclusion">Clause d'Exclusion</option>
            <option value="Franchise">Clause de Franchise</option>
            <option value="Obligatoire">Clause Obligatoire</option>
          </select>
        </div>
      </div>

      {/* Erreur de chargement */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchClauses} className="font-bold underline ml-4">Réessayer</button>
        </div>
      )}

      {/* Tableau des clauses */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <th className="py-3.5 px-4">Identifiant & Type</th>
                <th className="py-3.5 px-4">Texte de la Clause</th>
                <th className="py-3.5 px-4">Taux de Franchise</th>
                <th className="py-3.5 px-4">Contrat Rattaché</th>
                <th className="py-3.5 px-4">Description</th>
                {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
                      <span>Chargement des clauses depuis l'ontologie...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClauses.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="py-12 text-center text-zinc-400">
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
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${typeInfo.iconColor}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {c.id}
                            </span>
                            <div className="mt-0.5">
                              <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 line-clamp-3">
                          {c.texte_clause}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {c.type.includes('Franchise') || c.taux_franchise !== null ? (
                          c.taux_franchise !== null && c.taux_franchise !== undefined ? (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-1 rounded-md text-[11px] border border-amber-200 dark:border-amber-900">
                              <Percent className="h-3 w-3" />
                              {c.taux_franchise}%
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">Non fixé</span>
                          )
                        ) : (
                          <span className="text-zinc-400 text-[11px] italic">Non applicable</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {c.contrat ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md font-semibold border border-emerald-200 dark:border-emerald-900">
                            <FileCheck2 className="h-3 w-3" />
                            {c.contrat}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">Clause globale</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 max-w-xs">
                        <p className="line-clamp-2 text-[11px]">
                          {c.description || <span className="italic text-zinc-400">Aucune description</span>}
                        </p>
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(c)}
                              title="Modifier la clause"
                              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {canDelete && (
                              <button
                                onClick={() => setDeleteConfirmId(c.id)}
                                title="Supprimer la clause"
                                className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Sous-classe OWL
                  </label>
                  <select
                    value={addType}
                    onChange={(e) => setAddType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="ClauseExclusion">Clause d'Exclusion</option>
                    <option value="ClauseFranchise">Clause de Franchise</option>
                    <option value="ClauseObligatoire">Clause Obligatoire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
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
                      className="w-full rounded-xl border border-amber-200 bg-white p-2 text-xs font-medium dark:border-amber-800 dark:bg-zinc-900 dark:text-zinc-100 pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">
                    Propriété OWL : <code className="font-mono">as:tauxFranchise</code> (DatatypeProperty xsd:float).
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
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
                  Ajouter à l'ontologie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Édition Clause */}
      {isEditModalOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Sous-classe OWL
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="ClauseExclusion">Clause d'Exclusion</option>
                    <option value="ClauseFranchise">Clause de Franchise</option>
                    <option value="ClauseObligatoire">Clause Obligatoire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
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
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-zinc-900">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Supprimer la clause ?
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
              Êtes-vous sûr de vouloir retirer la clause <strong className="text-zinc-900 dark:text-zinc-200">{deleteConfirmId}</strong> du graphe ontologique ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
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
