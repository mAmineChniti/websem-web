'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  CreditCard, 
  User, 
  Search, 
  Filter, 
  RefreshCw,
  X,
  ShieldCheck,
  Lock,
  ShieldAlert,
  Home,
  Shield,
  Users,
  DollarSign,
  CheckSquare,
} from 'lucide-react';

interface Contrat {
  contrat: string;
  typeContrat: string;
  numeroContrat: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  montantPrime: string | null;
  assure: string | null;
  habitation?: string | null;
  garanties?: string | null;
  beneficiaire?: string | null;
  franchise?: string | null;
}

interface ContratsViewProps {
  userRole?: string;
  userOntologyId?: string;
  currentUser?: {
    name: string;
    email: string;
    isConnected: boolean;
    role: string;
    ontology_id?: string;
  } | null;
  onCountChange?: (count: number) => void;
}

export function ContratsView({ 
  userRole = 'Assure', 
  userOntologyId = 'Assure1', 
  currentUser,
  onCountChange
}: ContratsViewProps) {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'Tous' | 'ContratProprietaire' | 'ContratLocataire' | 'ContratCopropriete'>('Tous');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewScope, setViewScope] = useState<'mes_contrats' | 'tous'>(userRole === 'Assure' ? 'mes_contrats' : 'tous');

  // Liste des assurés chargée depuis l'API
  const [assuresList, setAssuresList] = useState<{id: string; nom: string; prenom: string}[]>([]);
  const [beneficiairesList, setBeneficiairesList] = useState<{id: string; nom: string; prenom: string}[]>([]);

  // Strict Permissions
  const canCreateContrat = userRole === 'Agent' || userRole === 'Admin';
  const canDeleteContrat = userRole === 'Admin';

  // New Contract form state
  const [type, setType] = useState('ContratProprietaire');
  const [numeroContrat, setNumeroContrat] = useState(`C-2026-00${Math.floor(2 + Math.random() * 9)}`);
  const [dateDebut, setDateDebut] = useState('2026-01-01T00:00:00');
  const [dateFin, setDateFin] = useState('2026-12-31T00:00:00');
  const [montantPrime, setMontantPrime] = useState('650');
  const [assure, setAssure] = useState('');
  const [habitation, setHabitation] = useState('Maison');
  const [selectedGaranties, setSelectedGaranties] = useState<string[]>(['Incendie']);
  const [beneficiaire, setBeneficiaire] = useState('');
  const [franchise, setFranchise] = useState('150');
  const [formError, setFormError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const GARANTIES_DISPONIBLES = [
    { id: 'Incendie', label: 'Incendie', icon: '🔥' },
    { id: 'DegatDesEaux', label: 'Dégât des eaux', icon: '💧' },
    { id: 'CatastropheNaturelle', label: 'Catastrophe naturelle', icon: '🌊' },
    { id: 'Vol', label: 'Vol & Cambriolage', icon: '🔒' },
    { id: 'BrisDeGlace', label: 'Bris de glace', icon: '🪟' },
    { id: 'ResponsabiliteCivile', label: 'Responsabilité civile', icon: '⚖️' },
  ];

  const HABITATIONS = [
    { id: 'Maison', label: 'Maison', icon: '🏠' },
    { id: 'Appartement', label: 'Appartement', icon: '🏢' },
    { id: 'Villa', label: 'Villa', icon: '🏡' },
    { id: 'Studio', label: 'Studio', icon: '🏬' },
  ];

  const fetchContrats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/ontology/contrats`);
      if (res.ok) {
        const data = await res.json();
        const cleaned = data.filter((c: any) =>
          c.contrat !== 'souscritContrat' &&
          c.contrat !== 'numeroContrat' &&
          c.typeContrat !== 'ObjectProperty' &&
          c.typeContrat !== 'FunctionalProperty' &&
          c.typeContrat !== 'DatatypeProperty'
        );
        setContrats(cleaned);
      }
    } catch (err) {
      console.warn("Could not fetch contrats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des assurés et bénéficiaires pour les menus déroulants
  const fetchPersonnes = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/ontology/personnes`);
      if (res.ok) {
        const data = await res.json();
        const assures = data
          .filter((p: any) => {
            const t = (p.type || '').toLowerCase();
            const id = (p.personne || '').toLowerCase();
            return t.includes('assure') || id.includes('assure');
          })
          .filter((p: any) => p.nom || p.prenom)
          .map((p: any) => ({
            id: p.personne || p.assure || '',
            nom: p.nom || '',
            prenom: p.prenom || '',
          }));
        setAssuresList(assures);
        if (assures.length > 0 && !assure) {
          setAssure(assures[0].id);
        }

        const beneficiaires = data
          .filter((p: any) => {
            const t = (p.type || '').toLowerCase();
            const id = (p.personne || '').toLowerCase();
            return t.includes('beneficiaire') || id.includes('beneficiaire');
          })
          .filter((p: any) => p.nom || p.prenom)
          .map((p: any) => ({
            id: p.personne || p.beneficiaire || '',
            nom: p.nom || '',
            prenom: p.prenom || '',
          }));
        setBeneficiairesList(beneficiaires);
      }
    } catch {}
  };

  useEffect(() => {
    fetchContrats();
    fetchPersonnes();
  }, []);

  const toggleGarantie = (id: string) => {
    setSelectedGaranties(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleCreateContrat = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canCreateContrat) {
      setFormError("Droits insuffisants : Seuls les Agents d'assurance et Administrateurs peuvent émettre des contrats.");
      return;
    }

    if (!assure) {
      setFormError("Veuillez sélectionner un assuré souscripteur.");
      return;
    }

    if (selectedGaranties.length === 0) {
      setFormError("Veuillez sélectionner au moins une garantie.");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/ontology/contrats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          numeroContrat,
          dateDebut,
          dateFin,
          montantPrime: parseFloat(montantPrime) || 500,
          assure: assure,
          habitation,
          garanties: selectedGaranties.join(','),
          beneficiaire: beneficiaire || null,
          franchise: parseFloat(franchise) || 0,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchContrats();
        // Reset form
        setNumeroContrat(`C-2026-00${Math.floor(2 + Math.random() * 9)}`);
        setSelectedGaranties(['Incendie']);
        setBeneficiaire('');
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.detail || "Erreur lors de la création du contrat.");
      }
    } catch (err) {
      setFormError("Erreur de connexion au serveur.");
    }
  };

  const handleDeleteContrat = async (contratId: string) => {
    if (!canDeleteContrat) {
      alert("Action interdite : Seul un Administrateur est autorisé à supprimer une police juridique.");
      return;
    }

    if (!confirm(`Confirmer la suppression définitive du contrat ${contratId} de l'ontologie ?`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/ontology/contrats/${contratId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchContrats();
      }
    } catch (err) {
      console.error("Error deleting contract:", err);
    }
  };

  // Filter logic
  const filtered = contrats.filter((c) => {
    const isMyContract = 
      c.assure === userOntologyId || 
      c.assure === 'Assure1' ||
      (currentUser?.name && (c.assure || '').toLowerCase().includes(currentUser.name.split(' ').pop()?.toLowerCase() || ''));

    if (viewScope === 'mes_contrats' && userRole === 'Assure' && !isMyContract) {
      return false;
    }

    const matchesType =
      filterType === 'Tous' ? true : (c.typeContrat || '').includes(filterType);

    const matchesSearch =
      (c.numeroContrat || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contrat || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.assure || '').toLowerCase().includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  useEffect(() => {
    if (onCountChange) {
      onCountChange(filtered.length);
    }
  }, [filtered.length, onCountChange]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-serif">
              Gestion des Contrats d'Assurance Habitation
            </h1>
            <p className="text-xs text-zinc-500">
              Classe ontologique <code className="text-emerald-600 font-mono">Contrat</code> : ContratPropriétaire, ContratLocataire, ContratCopropriété
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchContrats}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          {/* Conditional Contract Creation - Strict Role Permission */}
          {canCreateContrat ? (
            <button
              onClick={() => {
                setFormError(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nouveau contrat</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              <Lock className="h-3.5 w-3.5" />
              <span>Émission réservée aux Agents</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Security Notification Banner */}
      {userRole === 'Assure' && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-4 text-xs text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Espace Souscripteur — Vos Polices Actives</p>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
                Vous visualisez vos contrats et montants de prime. Conformément aux règles d'assurance, seul votre <strong>Agent référent</strong> est habilité à rédiger ou modifier une police juridique.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/70 dark:bg-zinc-800/70 p-1 rounded-xl border border-emerald-200 dark:border-zinc-700 self-start sm:self-auto">
            <button
              onClick={() => setViewScope('mes_contrats')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewScope === 'mes_contrats' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Mes Contrats
            </button>
            <button
              onClick={() => setViewScope('tous')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewScope === 'tous' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Tous les Contrats
            </button>
          </div>
        </div>
      )}

      {userRole === 'Agent' && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Gestionnaire de Contrats (Habilitation Agent)</p>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                Vous pouvez créer des contrats pour vos assurés. Choisissez l'assuré, l'habitation, le type de contrat et les garanties.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-blue-200/80 dark:bg-blue-900 px-3 py-1 text-[10px] font-bold text-blue-900 dark:text-blue-200 shrink-0 self-start sm:self-auto">
            Émission de Contrats Autorisée
          </span>
        </div>
      )}

      {userRole === 'Admin' && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-4 text-xs text-purple-900 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Supervision Globale des Polices (Administrateur)</p>
              <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 mt-0.5">
                Plein pouvoir sur les polices d'assurance : création, modification et suppression.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-purple-200/80 dark:bg-purple-900 px-3 py-1 text-[10px] font-bold text-purple-900 dark:text-purple-200 shrink-0 self-start sm:self-auto">
            Contrôle Total CRUD
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['Tous', 'ContratProprietaire', 'ContratLocataire', 'ContratCopropriete'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterType === t
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
              }`}
            >
              {t === 'Tous' ? 'Toutes les formules' : t.replace('Contrat', '')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Numéro, formule, assuré..."
            className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c, idx) => {
          const isMyContract = 
            c.assure === userOntologyId || 
            c.assure === 'Assure1' ||
            (currentUser?.name && (c.assure || '').toLowerCase().includes(currentUser.name.split(' ').pop()?.toLowerCase() || ''));

          return (
            <div
              key={idx}
              className={`rounded-3xl border bg-white p-5 shadow-sm transition-all dark:bg-zinc-900 relative overflow-hidden flex flex-col justify-between ${
                isMyContract && userRole === 'Assure'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10 dark:border-emerald-400'
                  : 'border-zinc-200/80 hover:shadow-md dark:border-zinc-800'
              }`}
            >
              {isMyContract && userRole === 'Assure' && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-3 py-0.5 rounded-bl-xl shadow-sm flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Votre Police Active</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {c.typeContrat || 'Contrat d\'assurance'}
                  </span>
                  <span className="font-mono text-zinc-400 text-xs">#{c.contrat}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    {c.numeroContrat || c.contrat}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span>Assuré : <strong className="text-zinc-800 dark:text-zinc-200">{c.assure || 'Non spécifié'}</strong></span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Montant de la prime :</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {c.montantPrime ? `${c.montantPrime} DT` : '850 DT'} / an
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Période :</span>
                    <span>{c.dateDebut ? c.dateDebut.split('T')[0] : '2026-01-01'} au {c.dateFin ? c.dateFin.split('T')[0] : '2026-12-31'}</span>
                  </div>
                </div>
              </div>

              {/* Delete button strictly restricted to Admin */}
              {canDeleteContrat && (
                <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  <button
                    onClick={() => handleDeleteContrat(c.contrat)}
                    title="Supprimer ce contrat de l'ontologie (Réservé à l'Admin)"
                    className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 transition-colors p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Supprimer (Admin)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — Créer un Contrat (Agent & Admin)
          Formulaire complet : Assuré → Habitation → Type → Garanties → Bénéficiaire → Dates/Prime/Franchise
         ══════════════════════════════════════════════════════════════════ */}
      {isModalOpen && canCreateContrat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative sticky top-0 z-10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold font-serif">Créer un Contrat d'Assurance</h2>
              <p className="text-xs text-emerald-100">Souscription pour un assuré — conforme au modèle ontologique OWL</p>
            </div>

            <form onSubmit={handleCreateContrat} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ── 1. Assuré (liste déroulante) ────────────────────────── */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  <span>1. Assuré souscripteur</span>
                  <span className="text-[9px] font-normal text-emerald-600 ml-auto">(aPourAssure)</span>
                </label>
                <select
                  value={assure}
                  onChange={(e) => setAssure(e.target.value)}
                  required
                  className="w-full rounded-lg border border-emerald-200 bg-white p-2 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">— Sélectionner un assuré —</option>
                  {assuresList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.prenom} {a.nom} ({a.id})
                    </option>
                  ))}
                </select>
                {assuresList.length === 0 && (
                  <p className="text-[10px] text-amber-700">⚠ Aucun assuré trouvé dans l'ontologie. Créez d'abord un assuré.</p>
                )}
              </div>

              {/* ── 2. Habitation ─────────────────────────────────────── */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Home className="h-3.5 w-3.5 text-blue-600" />
                  <span>2. Habitation concernée</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {HABITATIONS.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHabitation(h.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-semibold transition-all ${
                        habitation === h.id
                          ? 'border-blue-500 bg-blue-100 text-blue-800 shadow-sm ring-1 ring-blue-300'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-blue-300'
                      }`}
                    >
                      <span className="text-lg">{h.icon}</span>
                      <span>{h.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── 3. Type de contrat ────────────────────────────────── */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  <FileCheck2 className="h-3.5 w-3.5 text-zinc-500" />
                  <span>3. Type de contrat</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="ContratProprietaire">Propriétaire (Résidence principale/secondaire)</option>
                  <option value="ContratLocataire">Locataire (Risques locatifs)</option>
                  <option value="ContratCopropriete">Copropriété (Immeuble / Parties communes)</option>
                </select>
              </div>

              {/* ── 4. Garanties (multi-sélection) ───────────────────── */}
              <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold text-violet-900">
                  <Shield className="h-3.5 w-3.5 text-violet-600" />
                  <span>4. Garanties</span>
                  <span className="text-[9px] font-normal text-violet-600 ml-auto">{selectedGaranties.length} sélectionnée{selectedGaranties.length > 1 ? 's' : ''}</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {GARANTIES_DISPONIBLES.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGarantie(g.id)}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-medium transition-all text-left ${
                        selectedGaranties.includes(g.id)
                          ? 'border-violet-500 bg-violet-100 text-violet-800 shadow-sm'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-violet-300'
                      }`}
                    >
                      <span>{g.icon}</span>
                      <span className="flex-1">{g.label}</span>
                      {selectedGaranties.includes(g.id) && (
                        <CheckSquare className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── 5. Bénéficiaire (facultatif) ─────────────────────── */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-500" />
                  <span>5. Bénéficiaire</span>
                  <span className="text-[9px] font-normal text-zinc-400 ml-auto">Facultatif</span>
                </label>
                <select
                  value={beneficiaire}
                  onChange={(e) => setBeneficiaire(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">— Aucun bénéficiaire —</option>
                  {beneficiairesList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.prenom} {b.nom} ({b.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* ── 6. Numéro de police ───────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  6. Numéro de Police
                </label>
                <input
                  type="text"
                  required
                  value={numeroContrat}
                  onChange={(e) => setNumeroContrat(e.target.value)}
                  placeholder="Ex: C-2026-004"
                  className="w-full rounded-xl border border-zinc-300 p-2 text-xs font-mono focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* ── 7. Prime + Franchise ──────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    <DollarSign className="h-3 w-3 text-zinc-500" />
                    Prime Annuelle (DT)
                  </label>
                  <input
                    type="number"
                    required
                    value={montantPrime}
                    onChange={(e) => setMontantPrime(e.target.value)}
                    placeholder="Ex: 650"
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    <DollarSign className="h-3 w-3 text-zinc-500" />
                    Franchise (DT)
                  </label>
                  <input
                    type="number"
                    required
                    value={franchise}
                    onChange={(e) => setFranchise(e.target.value)}
                    placeholder="Ex: 150"
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* ── 8. Dates ──────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    <Calendar className="h-3 w-3 text-zinc-500" />
                    Date Début
                  </label>
                  <input
                    type="date"
                    required
                    value={dateDebut.split('T')[0]}
                    onChange={(e) => setDateDebut(`${e.target.value}T00:00:00`)}
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    <Calendar className="h-3 w-3 text-zinc-500" />
                    Date Fin
                  </label>
                  <input
                    type="date"
                    required
                    value={dateFin.split('T')[0]}
                    onChange={(e) => setDateFin(`${e.target.value}T00:00:00`)}
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-colors"
                >
                  Créer le contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
