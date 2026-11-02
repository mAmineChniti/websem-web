'use client';

import React, { useState, useEffect } from 'react';
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
  DollarSign,
  FileText,
  Activity,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface Dommage {
  id: string;
  type: string;
  description: string;
  montant: number;
  gravite: string;
  sinistre?: string | null;
  date?: string | null;
  lieu?: string | null;
}

interface DommagesViewProps {
  userRole?: string;
  onCountChange?: (count: number) => void;
}

export function DommagesView({ userRole = 'Assure', onCountChange }: DommagesViewProps) {
  const [dommages, setDommages] = useState<Dommage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [addError, setAddError] = useState<string | null>(null);

  // Modale d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Dommage | null>(null);
  const [editType, setEditType] = useState('DommageMateriel');
  const [editDescription, setEditDescription] = useState('');
  const [editMontant, setEditMontant] = useState('');
  const [editGravite, setEditGravite] = useState('Faible');
  const [editSinistreId, setEditSinistreId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLieu, setEditLieu] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Suppression
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Habilitations selon le rôle
  const canManage = userRole === 'Agent' || userRole === 'Admin' || userRole === 'Expert';
  const canDelete = userRole === 'Admin';

  const fetchDommages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/dommages/`);
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setDommages(data);
      if (onCountChange) onCountChange(data.length);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les dommages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDommages();
  }, []);

  const handleCreateDommage = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addDescription.trim()) {
      setAddError('La description du dommage est obligatoire.');
      return;
    }

    try {
      const payload = {
        type_dommage: addType,
        description: addDescription,
        montant: parseFloat(addMontant) || 0,
        gravite: addGravite,
        sinistre_id: addSinistreId || null,
        date: addDate,
        lieu: addLieu,
      };

      const res = await fetch(`${apiUrl}/api/dommages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erreur lors de la création');
      }

      setIsAddModalOpen(false);
      setAddDescription('');
      fetchDommages();
    } catch (err: any) {
      setAddError(err.message);
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
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateDommage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);

    try {
      const payload = {
        type_dommage: editType,
        description: editDescription,
        montant: parseFloat(editMontant) || 0,
        gravite: editGravite,
        sinistre_id: editSinistreId || null,
        date: editDate,
        lieu: editLieu,
      };

      const res = await fetch(`${apiUrl}/api/dommages/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erreur lors de la mise à jour');
      }

      setIsEditModalOpen(false);
      fetchDommages();
    } catch (err: any) {
      setEditError(err.message);
    }
  };

  const handleDeleteDommage = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/dommages/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setDeleteConfirmId(null);
      fetchDommages();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
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

  const getGraviteBadge = (gravite: string) => {
    switch (gravite) {
      case 'Grave':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800';
      case 'Moyen':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'Faible':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
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
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
        icon: '📑',
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Gestion des Dommages & Conséquences
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Classe ontologique <code className="font-mono text-amber-600 dark:text-amber-400">Dommage</code> rattachée aux Sinistres déclarés (Module Montaha Trabelsi).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDommages}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nouveau Dommage</span>
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
            placeholder="Rechercher par description, lieu, ID ou sinistre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-500">Sous-classe :</span>
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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDommages} className="font-bold underline ml-4">Réessayer</button>
        </div>
      )}

      {/* Tableau des dommages */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <th className="py-3.5 px-4">Identifiant & Type</th>
                <th className="py-3.5 px-4">Description du Sinistre</th>
                <th className="py-3.5 px-4">Gravité</th>
                <th className="py-3.5 px-4">Montant Estimé / Indemnisé</th>
                <th className="py-3.5 px-4">Sinistre Associé</th>
                <th className="py-3.5 px-4">Date & Lieu</th>
                {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
                      <span>Chargement des triplets Dommage depuis le graphe RDF...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDommages.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="py-12 text-center text-zinc-400">
                    Aucun dommage ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredDommages.map((d) => {
                  const typeInfo = getTypeBadge(d.type);
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{typeInfo.icon}</span>
                          <div>
                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {d.id}
                            </span>
                            <div className="mt-0.5">
                              <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">
                          {d.description || <span className="text-zinc-400 italic">Aucune description</span>}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getGraviteBadge(d.gravite)}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {d.gravite || 'Non qualifié'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {d.montant ? Number(d.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0,00'} DT
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {d.sinistre ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-blue-700 dark:text-blue-300 font-semibold">
                            <Activity className="h-3 w-3" />
                            {d.sinistre}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">Non lié</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
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
                          {!d.date && !d.lieu && <span className="italic">Non renseigné</span>}
                        </div>
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(d)}
                              title="Modifier ce dommage"
                              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {canDelete && (
                              <button
                                onClick={() => setDeleteConfirmId(d.id)}
                                title="Supprimer ce dommage de l'ontologie"
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

      {/* Modal Ajout Dommage */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Sous-classe OWL
                  </label>
                  <select
                    value={addType}
                    onChange={(e) => setAddType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="DommageMateriel">Dommage Matériel</option>
                    <option value="DommageCorporel">Dommage Corporel</option>
                    <option value="DommageImmateriel">Dommage Immatériel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Créer dans l'ontologie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Édition Dommage */}
      {isEditModalOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Sous-classe OWL
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="DommageMateriel">Dommage Matériel</option>
                    <option value="DommageCorporel">Dommage Corporel</option>
                    <option value="DommageImmateriel">Dommage Immatériel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
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
                  Enregistrer les modifications
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
                Supprimer le dommage ?
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
              Êtes-vous sûr de vouloir supprimer définitivement <strong className="text-zinc-900 dark:text-zinc-200">{deleteConfirmId}</strong> de l'ontologie RDF ? Tous les triplets associés seront retirés du graphe de connaissances.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
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
