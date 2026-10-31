'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Briefcase, 
  Phone, 
  MapPin, 
  CreditCard, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  Lock, 
  User as UserIcon, 
  ShieldAlert, 
  Mail, 
  Calendar,
  Building2,
  FileCheck2,
  ExternalLink
} from 'lucide-react';

interface Personne {
  personne: string;
  type: string;
  nom: string | null;
  prenom: string | null;
  cin: string | null;
  telephone: string | null;
  adresse: string | null;
}

interface PersonnesViewProps {
  userRole?: string;
  currentUser?: {
    name: string;
    email: string;
    isConnected: boolean;
    role: string;
    ontology_id?: string;
  } | null;
}

export function PersonnesView({ userRole = 'Assure', currentUser }: PersonnesViewProps) {
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState<'Tous' | 'Assure' | 'Agent' | 'Expert' | 'Beneficiaire'>('Tous');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Role determinations
  const isAssure = userRole === 'Assure';
  const isExpert = userRole === 'Expert';
  const canAddPersonne = userRole === 'Agent' || userRole === 'Admin';
  const isAdmin = userRole === 'Admin';

  // New Person form state (Agents can only add Assuré or Bénéficiaire, Admins can add anyone)
  const [newRole, setNewRole] = useState<'Assure' | 'Agent' | 'Expert' | 'Beneficiaire'>('Assure');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [cin, setCin] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchPersonnes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/ontology/personnes`);
      if (res.ok) {
        const data = await res.json();
        const cleaned = data.filter((p: any) => 
          p.personne !== 'aPourAssure' && 
          p.type !== 'ObjectProperty' && 
          p.type !== 'RapportExpertise'
        );
        setPersonnes(cleaned);
      }
    } catch (err) {
      console.warn("Could not fetch personnes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnes();
  }, []);

  const handleCreatePersonne = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canAddPersonne) {
      setFormError("Action refusée : Seuls les Agents et Administrateurs peuvent ajouter des personnes.");
      return;
    }

    if (userRole === 'Agent' && (newRole === 'Agent' || newRole === 'Expert')) {
      setFormError("Droits insuffisants : Un Agent peut uniquement enregistrer des Assurés et des Bénéficiaires.");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/ontology/personnes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newRole,
          nom,
          prenom,
          cin,
          telephone,
          adresse,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNom('');
        setPrenom('');
        setCin('');
        setTelephone('');
        setAdresse('');
        fetchPersonnes();
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.detail || "Erreur lors de l'ajout dans l'ontologie.");
      }
    } catch (err) {
      setFormError("Erreur de connexion au serveur.");
    }
  };

  // Find the logged-in user in the ontology list (or fallback to Assure1)
  const myPersonneData = personnes.find((p) => 
    p.personne === currentUser?.ontology_id ||
    (currentUser?.name && (p.nom || '').toLowerCase() === currentUser.name.split(' ').pop()?.toLowerCase())
  ) || personnes.find((p) => p.personne === 'Assure1') || {
    personne: currentUser?.ontology_id || 'Assure1',
    type: 'Assure',
    nom: currentUser?.name?.split(' ').pop() || 'BenAli',
    prenom: currentUser?.name?.split(' ')[0] || 'Karim',
    cin: '08123456',
    telephone: '20123456',
    adresse: 'Tunis, Ariana',
  };

  // Find the assigned Agent
  const assignedAgent = personnes.find((p) => 
    p.type === 'Agent' || p.personne.includes('Agent')
  ) || {
    personne: 'Agent1',
    type: 'Agent',
    nom: 'Trabelsi',
    prenom: 'Sami',
    cin: '07112233',
    telephone: '71234567',
    adresse: 'Agence Hestia Assur, Centre Urbain Nord',
  };

  // Filter logic for Back-Office (Agent / Admin) & Expert
  const filtered = personnes.filter((p) => {
    if (isExpert) {
      const isAnAssure = (p.type || '').includes('Assure') || (p.personne || '').includes('Assure');
      if (!isAnAssure) return false;
    }

    const matchesRole =
      filterRole === 'Tous'
        ? true
        : (p.type || '').includes(filterRole) || (p.personne || '').includes(filterRole);

    const matchesSearch =
      (p.nom || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.prenom || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.cin || '').includes(search) ||
      (p.personne || '').toLowerCase().includes(search.toLowerCase());

    return matchesRole && matchesSearch;
  });

  // =========================================================================
  // VIEW 1: ESPACE CLIENT ASSURÉ (STRICTE CONFIDENTIALITÉ & RGPD)
  // L'assuré ne voit AUCUN autre client, uniquement sa fiche et son conseiller
  // =========================================================================
  if (isAssure) {
    return (
      <div className="space-y-6">
        {/* Banner Mon Profil */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-zinc-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 border border-blue-400/30">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-300" />
              <span>Espace Client Particulier — Protection RGPD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
              Mon Profil & Dossier Assuré
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Consultez les informations personnelles rattachées à vos polices d'assurance habitation. Vos données sont certifiées et synchronisées avec l'ontologie sémantique.
            </p>
          </div>
          <div className="absolute right-6 -bottom-6 hidden sm:block opacity-15">
            <UserIcon className="h-44 w-44 text-white" />
          </div>
        </div>

        {/* Security & Confidentiality Notice */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Cloisonnement strict des données personnelles (Conformité RGPD)</p>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
              En tant que client souscripteur, vous avez accès uniquement à votre propre dossier d'assurance. L'accès aux répertoires des autres assurés est strictement réservé aux agents gestionnaires de la compagnie.
            </p>
          </div>
        </div>

        {/* Client Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Fiche Personnelle de l'Assuré */}
          <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-lg">
                  {(myPersonneData.prenom?.[0] || 'A') + (myPersonneData.nom?.[0] || 'D')}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-serif">
                    {myPersonneData.prenom} {myPersonneData.nom}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Classe OWL : Assuré (:Assure)
                    </span>
                    <span className="font-mono text-xs text-zinc-400">#{myPersonneData.personne}</span>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Souscripteur Vérifié</span>
              </span>
            </div>

            {/* Details Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 p-4 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span>Numéro de CIN</span>
                </div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                  {myPersonneData.cin || '08123456'}
                </p>
                <span className="text-[10px] text-zinc-400">Propriété datatype : as:cin</span>
              </div>

              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 p-4 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                  <Phone className="h-4 w-4 text-emerald-500" />
                  <span>Téléphone de contact</span>
                </div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                  {myPersonneData.telephone || '20123456'}
                </p>
                <span className="text-[10px] text-zinc-400">Propriété datatype : as:telephone</span>
              </div>

              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 p-4 border border-zinc-100 dark:border-zinc-800 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <span>Adresse du domicile assuré</span>
                </div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {myPersonneData.adresse || 'Tunis, Ariana'}
                </p>
                <span className="text-[10px] text-zinc-400">Propriété datatype : as:adresse (Localisation du risque couvert)</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Pour modifier vos coordonnées déclarées, veuillez fournir un justificatif à votre agent d'assurance.</span>
              <button
                onClick={fetchPersonnes}
                className="text-blue-600 font-semibold hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Card 2 : Conseiller / Agent Référent */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-serif">
                  Votre Conseiller Référent
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      {assignedAgent.prenom} {assignedAgent.nom}
                    </h4>
                    <span className="text-[11px] text-zinc-500 block">Agent Mandataire ({assignedAgent.personne})</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 p-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>Ligne directe : <strong>{assignedAgent.telephone || '71234567'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>{assignedAgent.adresse || 'Agence Hestia Assur'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>contact-agence@hestia.fr</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <a
                href={`tel:${assignedAgent.telephone || '71234567'}`}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Appeler mon conseiller</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ESPACE BACK-OFFICE GESTIONNAIRE (AGENT / ADMIN) & EXPERT
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-serif">
              {isExpert ? 'Répertoire des Assurés (Consultation Expert)' : 'Gestion des Acteurs & Profils d\'Assurance'}
            </h1>
            <p className="text-xs text-zinc-500">
              {isExpert 
                ? 'Coordonnées des assurés à contacter pour audit technique et évaluation des risques' 
                : 'Classe ontologique Personne : Assurés, Agents, Experts et Bénéficiaires modélisés sous Protégé'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPersonnes}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          {canAddPersonne && (
            <button
              onClick={() => {
                setFormError(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Ajouter une personne</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Security Notification Banner */}
      {isExpert && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Espace Expert Technique — Accès Restreint aux Assurés</p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Conformément aux règles de confidentialité RGPD, vous consultez exclusivement la liste des <strong>Assurés</strong> (nom, téléphone, adresse) pour vos missions d'évaluation et d'expertise terrain. L'annuaire interne des agents et confrères experts vous est masqué.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-200/80 dark:bg-amber-900 px-3 py-1 text-[10px] font-bold text-amber-900 dark:text-amber-200 shrink-0 self-start sm:self-auto">
            Filtre Assurés Actif
          </span>
        </div>
      )}

      {userRole === 'Agent' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Habilitation Agent d'Assurance</p>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                Vous êtes habilité à créer et inscrire de nouveaux <strong>Assurés</strong> et <strong>Bénéficiaires</strong> directement dans l'ontologie sémantique.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-200/80 dark:bg-emerald-900 px-3 py-1 text-[10px] font-bold text-emerald-900 dark:text-emerald-200 shrink-0 self-start sm:self-auto">
            Privilège Agent Actif
          </span>
        </div>
      )}

      {userRole === 'Admin' && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-4 text-xs text-purple-900 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Console Super-Administrateur</p>
              <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 mt-0.5">
                Accès illimité : création d'Agents, Experts, Assurés et Bénéficiaires, gestion des axiomes RDF et requêtes SPARQL directes.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-purple-200/80 dark:bg-purple-900 px-3 py-1 text-[10px] font-bold text-purple-900 dark:text-purple-200 shrink-0 self-start sm:self-auto">
            Super-Admin OWL
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {isExpert ? (
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-3.5 py-1.5 text-xs font-bold border border-amber-300 dark:border-amber-800">
              Assurés à expertiser ({filtered.length})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['Tous', 'Assure', 'Agent', 'Expert', 'Beneficiaire'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  filterRole === r
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                }`}
              >
                {r === 'Tous' ? 'Tous les rôles' : r}
              </button>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, CIN, identifiant..."
            className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Persons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    p.type === 'Assure' || p.personne.includes('Assure')
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : p.type === 'Agent' || p.personne.includes('Agent')
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : p.type === 'Expert' || p.personne.includes('Expert')
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  }`}
                >
                  {p.type || 'Personne'}
                </span>
                <span className="font-mono text-zinc-400 text-xs">#{p.personne}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {p.prenom || ''} {p.nom || p.personne}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  <span>CIN : {p.cin || 'Non renseigné'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{p.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{p.adresse || 'Adresse non renseignée'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Ajouter une Personne (Uniquement pour Agent & Admin) */}
      {isModalOpen && canAddPersonne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold font-serif">Ajouter une Personne à l'Ontologie</h2>
              <p className="text-xs text-blue-100">
                {userRole === 'Agent' 
                  ? "Inscription d'un souscripteur (Assuré ou Bénéficiaire)" 
                  : "Création d'un individu conforme au modèle ontologique Personne"}
              </p>
            </div>

            <form onSubmit={handleCreatePersonne} className="p-6 space-y-3.5">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Rôle ontologique à attribuer
                </label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="Assure">Assuré (Souscripteur client)</option>
                  <option value="Beneficiaire">Bénéficiaire (Ayant-droit)</option>
                  {isAdmin && <option value="Agent">Agent d'assurance</option>}
                  {isAdmin && <option value="Expert">Expert technique</option>}
                </select>
                {userRole === 'Agent' && (
                  <p className="text-[10px] text-zinc-400 mt-1">
                    * En tant qu'Agent, vous ne pouvez inscrire que des Assurés et Bénéficiaires.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Ex: Sami"
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: Trabelsi"
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">CIN</label>
                  <input
                    type="text"
                    required
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    placeholder="Ex: 08123456"
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Téléphone</label>
                  <input
                    type="text"
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="Ex: 20123456"
                    className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Adresse</label>
                <input
                  type="text"
                  required
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Ex: Tunis, Ariana"
                  className="w-full rounded-xl border border-zinc-300 p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition-colors"
                >
                  Créer dans l'ontologie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
