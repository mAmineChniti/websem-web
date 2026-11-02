'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  createContrat,
  deleteContrat,
  listContrats,
  listPersonnesForSelect,
  updateContrat,
} from '@/lib/services/contrats';
import type {
  Contrat,
  ContratType,
  ContratsViewUser,
} from '@/lib/types/contrats';
import { contratFormSchema } from '@/lib/schemas/forms';
import { cn } from '@/lib/utils';
import type { z } from 'zod';
import {
  FileCheck2,
  PlusCircle,
  Trash2,
  Pencil,
  Calendar,
  User,
  Search,
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

interface ContratsViewProps {
  userRole?: string;
  userOntologyId?: string;
  currentUser?: ContratsViewUser;
  onCountChange?: (count: number) => void;
}

export function ContratsView({
  userRole = 'Assure',
  userOntologyId = 'Assure1',
  currentUser,
  onCountChange,
}: ContratsViewProps) {
  const queryClient = useQueryClient();
  const contratsQuery = useQuery({
    queryKey: ['contrats'],
    queryFn: listContrats,
  });
  const personnesQuery = useQuery({
    queryKey: ['personnes', 'select'],
    queryFn: listPersonnesForSelect,
  });
  const contrats = contratsQuery.data ?? [];
  const loading = contratsQuery.isFetching;
  const [filterType, setFilterType] = useState<ContratType>('Tous');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewScope, setViewScope] = useState<'mes_contrats' | 'tous'>(
    userRole === 'Assure' ? 'mes_contrats' : 'tous'
  );

  // Liste des assurés chargée depuis l'API
  const emptyPersonnes = useMemo(() => [], []);
  const personnes = personnesQuery.data ?? emptyPersonnes;
  const assuresList = useMemo(
    () =>
      personnes
        .filter((personne) => {
          const type = (personne.type || '').toLowerCase();
          const id = (personne.personne || '').toLowerCase();
          return (
            (type.includes('assure') || id.includes('assure')) &&
            Boolean(personne.nom || personne.prenom)
          );
        })
        .map((personne) => ({
          id: personne.personne,
          nom: personne.nom || '',
          prenom: personne.prenom || '',
        })),
    [personnes]
  );
  const beneficiairesList = useMemo(
    () =>
      personnes
        .filter((personne) => {
          const type = (personne.type || '').toLowerCase();
          const id = (personne.personne || '').toLowerCase();
          return (
            (type.includes('beneficiaire') || id.includes('beneficiaire')) &&
            Boolean(personne.nom || personne.prenom)
          );
        })
        .map((personne) => ({
          id: personne.personne,
          nom: personne.nom || '',
          prenom: personne.prenom || '',
        })),
    [personnes]
  );

  // Strict Permissions
  const canCreateContrat = userRole === 'Agent' || userRole === 'Admin';
  const canEditContrat = userRole === 'Agent' || userRole === 'Admin';
  const canDeleteContrat = userRole === 'Admin';

  // New Contract form state
  const [formError, setFormError] = useState<string | undefined>();

  // Edit Contract state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contrat | undefined>();
  const [editFormError, setEditFormError] = useState<string | undefined>();
  const [editLoading, setEditLoading] = useState(false);

  type ContratFormValues = z.infer<typeof contratFormSchema>;
  const defaultContratValues: ContratFormValues = {
    type: 'ContratProprietaire',
    numeroContrat: 'C-2026-002',
    dateDebut: '2026-01-01T00:00:00',
    dateFin: '2026-12-31T00:00:00',
    montantPrime: '650',
    assure: '',
    habitation: 'Maison',
    garanties: ['Incendie'],
    beneficiaire: '',
    franchise: '150',
  };
  const createForm = useForm<ContratFormValues>({
    resolver: zodResolver(contratFormSchema),
    defaultValues: defaultContratValues,
  });
  const editForm = useForm<ContratFormValues>({
    resolver: zodResolver(contratFormSchema),
    defaultValues: defaultContratValues,
  });
  const createWatched = useWatch({
    control: createForm.control,
    defaultValue: defaultContratValues,
  });
  const editWatched = useWatch({
    control: editForm.control,
    defaultValue: defaultContratValues,
  });
  const createValues = {
    ...defaultContratValues,
    ...createWatched,
    garanties: createWatched.garanties ?? defaultContratValues.garanties,
    dateDebut: createWatched.dateDebut ?? defaultContratValues.dateDebut,
    dateFin: createWatched.dateFin ?? defaultContratValues.dateFin,
  };
  const editValues = {
    ...defaultContratValues,
    ...editWatched,
    garanties: editWatched.garanties ?? defaultContratValues.garanties,
    dateDebut: editWatched.dateDebut ?? defaultContratValues.dateDebut,
    dateFin: editWatched.dateFin ?? defaultContratValues.dateFin,
  };

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

  const fetchContrats = () => contratsQuery.refetch();

  const openEditModal = (c: Contrat) => {
    setEditTarget(c);
    editForm.reset({
      type: c.typeContrat || 'ContratProprietaire',
      numeroContrat: c.numeroContrat || c.contrat,
      dateDebut: c.dateDebut?.includes('T')
        ? c.dateDebut
        : `${c.dateDebut || '2026-01-01'}T00:00:00`,
      dateFin: c.dateFin?.includes('T')
        ? c.dateFin
        : `${c.dateFin || '2026-12-31'}T00:00:00`,
      montantPrime: c.montantPrime || '650',
      assure: c.assure || assuresList[0]?.id || '',
      habitation: c.habitation || 'Maison',
      garanties: c.garanties
        ? c.garanties.split(',').map((value) => value.trim())
        : ['Incendie'],
      beneficiaire: c.beneficiaire || '',
      franchise: c.franchise || '150',
    });
    setEditFormError(undefined);
    setIsEditModalOpen(true);
  };

  const handleCreateContrat = async (values: ContratFormValues) => {
    setFormError(undefined);

    if (!canCreateContrat) {
      setFormError(
        "Droits insuffisants : Seuls les Agents d'assurance et Administrateurs peuvent émettre des contrats."
      );
      return;
    }

    const payload = {
      ...values,
      numeroContrat: values.numeroContrat.trim(),
      montantPrime: Number.parseFloat(values.montantPrime),
      garanties: values.garanties.join(','),
      beneficiaire: values.beneficiaire || undefined,
      franchise: Number.parseFloat(values.franchise) || 0,
    };
    try {
      await createContrat(payload);
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['contrats'] });
      createForm.reset(defaultContratValues);
    } catch {
      setFormError('Erreur de connexion au serveur.');
    }
  };

  const handleEditContrat = async (values: ContratFormValues) => {
    if (!editTarget) return;
    setEditFormError(undefined);

    setEditLoading(true);
    const payload = {
      ...values,
      numeroContrat: values.numeroContrat.trim(),
      montantPrime: Number.parseFloat(values.montantPrime),
      garanties: values.garanties.join(','),
      beneficiaire: values.beneficiaire || undefined,
      franchise: Number.parseFloat(values.franchise) || 0,
    };
    try {
      await updateContrat(editTarget.contrat, payload);
      setIsEditModalOpen(false);
      setEditTarget(undefined);
      await queryClient.invalidateQueries({ queryKey: ['contrats'] });
    } catch {
      setEditFormError('Erreur de connexion au serveur.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteContrat = async (contratId: string) => {
    if (!canDeleteContrat) {
      alert(
        'Action interdite : Seul un Administrateur est autorisé à supprimer une police juridique.'
      );
      return;
    }

    if (
      !confirm(
        `Confirmer la suppression définitive du contrat ${contratId} de l'ontologie ?`
      )
    )
      return;
    try {
      await deleteContrat(contratId);
      await queryClient.invalidateQueries({ queryKey: ['contrats'] });
    } catch (error) {
      console.error('Error deleting contract:', error);
    }
  };

  // Filter logic
  const filtered = contrats.filter((c) => {
    const isMyContract =
      c.assure === userOntologyId ||
      c.assure === 'Assure1' ||
      (currentUser?.name &&
        (c.assure || '')
          .toLowerCase()
          .includes(currentUser.name.split(' ').pop()?.toLowerCase() || ''));

    if (
      viewScope === 'mes_contrats' &&
      userRole === 'Assure' &&
      !isMyContract
    ) {
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
      <div className="border-border bg-card dark:border-border dark:bg-card flex flex-col justify-between gap-4 rounded-3xl border p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="bg-muted text-primary dark:bg-muted dark:text-primary flex h-10 w-10 items-center justify-center rounded-xl">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground dark:text-foreground font-serif text-xl font-bold">
              Gestion des Contrats d&apos;Assurance Habitation
            </h1>
            <p className="text-muted-foreground text-xs">
              Classe ontologique{' '}
              <code className="text-primary font-mono">Contrat</code> :
              ContratPropriétaire, ContratLocataire, ContratCopropriété
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchContrats}
            className="border-border bg-card text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-foreground flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
            <span>Actualiser</span>
          </Button>

          {/* Conditional Contract Creation - Strict Role Permission */}
          {canCreateContrat ? (
            <Button
              onClick={() => {
                setFormError(undefined);
                setIsModalOpen(true);
              }}
              className="text-primary-foreground bg-muted hover:bg-accent flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nouveau contrat</span>
            </Button>
          ) : (
            <div className="border-border bg-muted text-muted-foreground dark:border-border dark:bg-card dark:text-muted-foreground flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium">
              <Lock className="h-3.5 w-3.5" />
              <span>Émission réservée aux Agents</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Security Notification Banner */}
      {userRole === 'Assure' && (
        <div className="from-muted to-muted text-foreground dark:border-border dark:bg-muted/40 dark:text-foreground border-border flex flex-col justify-between gap-3 rounded-2xl border bg-gradient-to-r p-4 text-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-primary dark:text-primary h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Espace Souscripteur — Vos Polices Actives
              </p>
              <p className="text-primary dark:text-primary mt-0.5 text-[11px]">
                Vous visualisez vos contrats et montants de prime. Conformément
                aux règles d&apos;assurance, seul votre{' '}
                <strong>Agent référent</strong> est habilité à rédiger ou
                modifier une police juridique.
              </p>
            </div>
          </div>
          <div className="bg-card/70 dark:border-border dark:bg-card/70 border-border flex items-center gap-1.5 self-start rounded-xl border p-1 sm:self-auto">
            <Button
              onClick={() => setViewScope('mes_contrats')}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                viewScope === 'mes_contrats'
                  ? 'text-primary-foreground bg-muted shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mes Contrats
            </Button>
            <Button
              onClick={() => setViewScope('tous')}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                viewScope === 'tous'
                  ? 'text-primary-foreground bg-muted shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tous les Contrats
            </Button>
          </div>
        </div>
      )}

      {userRole === 'Agent' && (
        <div className="border-border bg-muted text-primary dark:border-border dark:bg-muted dark:text-primary flex flex-col justify-between gap-3 rounded-2xl border p-4 text-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="text-primary dark:text-primary h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Gestionnaire de Contrats (Habilitation Agent)
              </p>
              <p className="text-primary dark:text-primary mt-0.5 text-[11px]">
                Vous pouvez créer des contrats pour vos assurés. Choisissez
                l&apos;assuré, l&apos;habitation, le type de contrat et les
                garanties.
              </p>
            </div>
          </div>
          <span className="bg-muted text-primary dark:bg-muted dark:text-primary shrink-0 self-start rounded-full px-3 py-1 text-[10px] font-bold sm:self-auto">
            Émission de Contrats Autorisée
          </span>
        </div>
      )}

      {userRole === 'Admin' && (
        <div className="border-border bg-muted text-foreground flex flex-col justify-between gap-3 rounded-2xl border p-4 text-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-primary h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Supervision Globale des Polices (Administrateur)
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Plein pouvoir sur les polices d&apos;assurance : création,
                modification et suppression.
              </p>
            </div>
          </div>
          <span className="bg-secondary text-secondary-foreground shrink-0 self-start rounded-full px-3 py-1 text-[10px] font-bold sm:self-auto">
            Contrôle Total CRUD
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {/* Type Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              'Tous',
              'ContratProprietaire',
              'ContratLocataire',
              'ContratCopropriete',
            ] as const
          ).map((t) => (
            <Button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all',
                filterType === t
                  ? 'text-primary-foreground bg-muted shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-muted-foreground border'
              )}
            >
              {t === 'Tous' ? 'Toutes les formules' : t.replace('Contrat', '')}
            </Button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Numéro, formule, assuré..."
            className="w-full rounded-xl py-2 pr-3 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c, idx) => {
          const isMyContract =
            c.assure === userOntologyId ||
            c.assure === 'Assure1' ||
            (currentUser?.name &&
              (c.assure || '')
                .toLowerCase()
                .includes(
                  currentUser.name.split(' ').pop()?.toLowerCase() || ''
                ));

          return (
            <div
              key={idx}
              className={cn(
                'bg-card dark:bg-card relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 shadow-sm transition-all',
                isMyContract && userRole === 'Assure'
                  ? 'border-border ring-ring dark:border-border shadow-sm ring-2'
                  : 'border-border/80 dark:border-border hover:shadow-md'
              )}
            >
              {isMyContract && userRole === 'Assure' && (
                <div className="text-primary-foreground bg-muted absolute top-0 right-0 flex items-center gap-1 rounded-bl-xl px-3 py-0.5 text-[9px] font-bold shadow-sm">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Votre Police Active</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {c.typeContrat || "Contrat d'assurance"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {c.habitation && (
                      <span className="border-border bg-muted text-primary dark:border-border dark:bg-muted dark:text-primary flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium">
                        <Home className="h-3 w-3" />
                        <span>{c.habitation}</span>
                      </span>
                    )}
                    <span className="text-muted-foreground font-mono text-xs">
                      #{c.contrat}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-foreground dark:text-foreground font-mono text-base font-bold">
                    {c.numeroContrat || c.contrat}
                  </h3>
                  <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                    <User className="text-primary h-3.5 w-3.5 shrink-0" />
                    <span>
                      Assuré :{' '}
                      <strong className="text-foreground dark:text-foreground">
                        {c.assure || 'Non spécifié'}
                      </strong>
                    </span>
                  </div>
                  {c.beneficiaire && (
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
                      <Users className="h-3 w-3 shrink-0" />
                      <span>Bénéficiaire : {c.beneficiaire}</span>
                    </div>
                  )}
                </div>

                {c.garanties && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.garanties.split(',').map((g, gi) => (
                      <span
                        key={gi}
                        className="bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      >
                        {g.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-border dark:border-border space-y-1 border-t pt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Prime annuelle :
                    </span>
                    <span className="text-primary dark:text-primary text-sm font-bold">
                      {c.montantPrime ? `${c.montantPrime} DT` : '850 DT'} / an
                    </span>
                  </div>
                  {c.franchise && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        Franchise contractuelle :
                      </span>
                      <span className="text-foreground dark:text-muted-foreground font-semibold">
                        {c.franchise} DT
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Période :</span>
                    <span className="text-muted-foreground dark:text-muted-foreground font-mono">
                      {c.dateDebut
                        ? c.dateDebut.split('T', 1)[0]
                        : '2026-01-01'}{' '}
                      au {c.dateFin ? c.dateFin.split('T', 1)[0] : '2026-12-31'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons (CRUD : Modifier pour Agent/Admin, Supprimer pour Admin) */}
              {(canEditContrat || canDeleteContrat) && (
                <div className="border-border dark:border-border mt-3 flex items-center justify-between gap-2 border-t pt-3">
                  {canEditContrat ? (
                    <Button
                      onClick={() => openEditModal(c)}
                      title="Modifier les informations de ce contrat"
                      className="bg-muted text-primary hover:bg-accent hover:text-accent-foreground dark:bg-muted dark:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Modifier</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  {canDeleteContrat && (
                    <Button
                      onClick={() => handleDeleteContrat(c.contrat)}
                      title="Supprimer ce contrat de l'ontologie (Réservé à l'Admin)"
                      className="text-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Supprimer</span>
                    </Button>
                  )}
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
        <div className="animate-in fade-in bg-foreground/60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm duration-200">
          <div className="border-border bg-card dark:border-border dark:bg-card relative max-h-[90vh] w-full max-w-lg overflow-hidden overflow-y-auto rounded-3xl border shadow-2xl">
            <div className="from-primary to-card text-primary-foreground relative sticky top-0 z-10 bg-gradient-to-r p-6">
              <Button
                onClick={() => setIsModalOpen(false)}
                className="bg-card/10 text-primary-foreground hover:bg-card/20 absolute top-4 right-4 rounded-full p-1.5 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
              <h2 className="font-serif text-lg font-bold">
                Créer un Contrat d&apos;Assurance
              </h2>
              <p className="text-primary text-xs">
                Souscription pour un assuré — conforme au modèle ontologique OWL
              </p>
            </div>

            <form
              onSubmit={createForm.handleSubmit(handleCreateContrat)}
              className="space-y-4 p-6"
            >
              {/* Encart informatif sur les champs obligatoires */}
              <div className="dark:bg-muted/40 dark:text-foreground border-border bg-muted text-primary dark:border-border flex items-center justify-between rounded-xl border p-3 text-xs">
                <span>
                  Tous les champs marqués d&apos;une étoile (
                  <span className="text-destructive text-sm font-bold">*</span>)
                  sont <strong>obligatoires</strong>.
                </span>
                <span className="text-foreground bg-muted dark:bg-muted dark:text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                  Validation stricte
                </span>
              </div>

              {formError && (
                <div className="border-border bg-muted text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs">
                  <ShieldAlert className="text-destructive h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ── 1. Assuré (liste déroulante) ────────────────────────── */}
              <div className="border-border bg-muted space-y-1.5 rounded-xl border p-3">
                <label className="text-primary flex items-center gap-2 text-xs font-bold">
                  <User className="text-primary h-3.5 w-3.5" />
                  <span>1. Assuré souscripteur</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                  <span className="text-primary ml-auto text-[9px] font-normal">
                    (aPourAssure)
                  </span>
                </label>
                <NativeSelect {...createForm.register('assure')} required>
                  <NativeSelectOption value="">
                    — Sélectionner un assuré (obligatoire) —
                  </NativeSelectOption>
                  {assuresList.map((a) => (
                    <NativeSelectOption key={a.id} value={a.id}>
                      {a.prenom} {a.nom} ({a.id})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {assuresList.length === 0 && (
                  <p className="text-primary text-[10px]">
                    ⚠ Aucun assuré trouvé dans l&apos;ontologie. Créez
                    d&apos;abord un assuré.
                  </p>
                )}
              </div>

              {/* ── 2. Habitation ─────────────────────────────────────── */}
              <div className="border-border bg-muted space-y-1.5 rounded-xl border p-3">
                <label className="text-primary flex items-center gap-2 text-xs font-bold">
                  <Home className="text-primary h-3.5 w-3.5" />
                  <span>2. Habitation concernée</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {HABITATIONS.map((h) => (
                    <Button
                      key={h.id}
                      type="button"
                      onClick={() => createForm.setValue('habitation', h.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-semibold transition-all',
                        createValues.habitation === h.id
                          ? 'border-border bg-muted text-primary ring-ring shadow-sm ring-1'
                          : 'border-border bg-card text-muted-foreground hover:border-border'
                      )}
                    >
                      <span className="text-lg">{h.icon}</span>
                      <span>{h.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* ── 3. Type de contrat ────────────────────────────────── */}
              <div>
                <label className="text-foreground dark:text-muted-foreground mb-1.5 flex items-center gap-2 text-xs font-bold">
                  <FileCheck2 className="text-muted-foreground h-3.5 w-3.5" />
                  <span>3. Formule de contrat</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                </label>
                <NativeSelect {...createForm.register('type')} required>
                  <NativeSelectOption value="ContratProprietaire">
                    Propriétaire (Résidence principale / secondaire)
                  </NativeSelectOption>
                  <NativeSelectOption value="ContratLocataire">
                    Locataire (Risques locatifs)
                  </NativeSelectOption>
                  <NativeSelectOption value="ContratCopropriete">
                    Copropriété (Immeuble / Parties communes)
                  </NativeSelectOption>
                </NativeSelect>
              </div>

              {/* ── 4. Garanties (multi-sélection) ───────────────────── */}
              <div className="border-border bg-muted space-y-1.5 rounded-xl border p-3">
                <label className="text-primary flex items-center gap-2 text-xs font-bold">
                  <Shield className="text-primary h-3.5 w-3.5" />
                  <span>4. Garanties souscrites</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Au moins 1
                  </span>
                  <span className="text-primary ml-auto text-[9px] font-normal">
                    {createValues.garanties.length} sélectionnée
                    {createValues.garanties.length > 1 ? 's' : ''}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {GARANTIES_DISPONIBLES.map((g) => (
                    <Button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        const garanties = createValues.garanties.includes(g.id)
                          ? createValues.garanties.filter(
                              (value) => value !== g.id
                            )
                          : [...createValues.garanties, g.id];
                        createForm.setValue('garanties', garanties, {
                          shouldValidate: true,
                        });
                      }}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition-all',
                        createValues.garanties.includes(g.id)
                          ? 'border-border bg-muted text-primary shadow-sm'
                          : 'border-border bg-card text-muted-foreground hover:border-border'
                      )}
                    >
                      <span>{g.icon}</span>
                      <span className="flex-1">{g.label}</span>
                      {createValues.garanties.includes(g.id) && (
                        <CheckSquare className="text-primary h-3.5 w-3.5 shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* ── 5. Bénéficiaire (facultatif) ─────────────────────── */}
              <div>
                <label className="text-foreground dark:text-muted-foreground mb-1.5 flex items-center gap-2 text-xs font-bold">
                  <Users className="text-muted-foreground h-3.5 w-3.5" />
                  <span>5. Bénéficiaire désigné</span>
                  <span className="bg-muted text-muted-foreground dark:bg-card ml-auto rounded px-1.5 py-0.5 text-[9px] font-normal">
                    Facultatif
                  </span>
                </label>
                <NativeSelect {...createForm.register('beneficiaire')}>
                  <NativeSelectOption value="">
                    — Aucun bénéficiaire (facultatif) —
                  </NativeSelectOption>
                  {beneficiairesList.map((b) => (
                    <NativeSelectOption key={b.id} value={b.id}>
                      {b.prenom} {b.nom} ({b.id})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              {/* ── 6. Numéro de police ───────────────────────────────── */}
              <div>
                <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-bold">
                  <span>6. Numéro de Police contractuelle</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                </label>
                <Input
                  type="text"
                  required
                  {...createForm.register('numeroContrat')}
                  placeholder="Ex: C-2026-004"
                  className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 font-mono text-xs focus:outline-none"
                />
              </div>

              {/* ── 7. Prime + Franchise ──────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold">
                    <DollarSign className="text-primary h-3 w-3" />
                    <span>Prime Annuelle (DT)</span>
                    <span className="text-destructive font-bold">*</span>
                  </label>
                  <Input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    {...createForm.register('montantPrime')}
                    placeholder="Ex: 650"
                    className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold">
                    <DollarSign className="text-muted-foreground h-3 w-3" />
                    <span>Franchise (DT)</span>
                    <span className="text-muted-foreground ml-auto text-[9px] font-normal">
                      Optionnel
                    </span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...createForm.register('franchise')}
                    placeholder="Ex: 150"
                    className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* ── 8. Dates ──────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold">
                    <Calendar className="text-primary h-3 w-3" />
                    <span>Date Début d&apos;effet</span>
                    <span className="text-destructive font-bold">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={createValues.dateDebut.split('T', 1)[0]}
                    onChange={(e) =>
                      createForm.setValue(
                        'dateDebut',
                        `${e.target.value}T00:00:00`,
                        { shouldValidate: true }
                      )
                    }
                    className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold">
                    <Calendar className="text-primary h-3 w-3" />
                    <span>Date Fin d&apos;échéance</span>
                    <span className="text-destructive font-bold">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={createValues.dateFin.split('T', 1)[0]}
                    onChange={(e) =>
                      createForm.setValue(
                        'dateFin',
                        `${e.target.value}T00:00:00`,
                        { shouldValidate: true }
                      )
                    }
                    className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="border-border dark:border-border flex justify-end gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl px-5 py-2 text-xs font-bold shadow"
                >
                  Créer le contrat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — MODIFIER UN CONTRAT (Agent & Admin)
          Mise à jour directe dans l'ontologie RDF/OWL
         ══════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && editTarget && canEditContrat && (
        <div className="animate-in fade-in bg-foreground/60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm duration-200">
          <div className="border-border bg-card dark:border-border dark:bg-card relative max-h-[90vh] w-full max-w-lg overflow-hidden overflow-y-auto rounded-3xl border shadow-2xl">
            {/* Header */}
            <div className="from-primary text-primary-foreground via-primary to-card relative sticky top-0 z-10 bg-gradient-to-r p-6">
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditTarget(undefined);
                }}
                className="bg-card/10 text-primary-foreground hover:bg-card/20 absolute top-4 right-4 rounded-full p-1.5 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mb-1 flex items-center gap-2">
                <Pencil className="text-primary h-5 w-5" />
                <h2 className="font-serif text-lg font-bold">
                  Modifier le Contrat d&apos;Assurance
                </h2>
              </div>
              <p className="text-primary font-mono text-xs">
                Police #{editTarget.numeroContrat || editTarget.contrat} —{' '}
                {editTarget.contrat}
              </p>
            </div>

            <form
              onSubmit={editForm.handleSubmit(handleEditContrat)}
              className="space-y-4 p-6"
            >
              {/* Encart informatif */}
              <div className="border-border bg-muted text-primary dark:border-border dark:bg-muted dark:text-primary flex items-center justify-between rounded-xl border p-3 text-xs">
                <span>
                  Modification des propriétés RDF et relations OWL dans{' '}
                  <code className="font-mono">assurance.rdf</code>.
                </span>
                <span className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                  Édition OWL
                </span>
              </div>

              {editFormError && (
                <div className="border-border bg-muted text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs">
                  <ShieldAlert className="text-destructive h-4 w-4 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              {/* ── 1. Assuré souscripteur ──────────────────────────── */}
              <div className="border-border bg-muted space-y-1.5 rounded-xl border p-3">
                <label className="text-primary flex items-center gap-2 text-xs font-bold">
                  <User className="text-primary h-3.5 w-3.5" />
                  <span>1. Assuré souscripteur</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                </label>
                <NativeSelect {...editForm.register('assure')} required>
                  <NativeSelectOption value="">
                    — Sélectionner un assuré (obligatoire) —
                  </NativeSelectOption>
                  {assuresList.map((a) => (
                    <NativeSelectOption key={a.id} value={a.id}>
                      {a.prenom} {a.nom} ({a.id})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              {/* ── 2. Habitation ─────────────────────────────────────── */}
              <div className="border-border bg-muted space-y-1.5 rounded-xl border p-3">
                <label className="text-primary flex items-center gap-2 text-xs font-bold">
                  <Home className="text-primary h-3.5 w-3.5" />
                  <span>2. Habitation couverte</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {HABITATIONS.map((h) => (
                    <Button
                      key={h.id}
                      type="button"
                      onClick={() => editForm.setValue('habitation', h.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-semibold transition-all',
                        editValues.habitation === h.id
                          ? 'border-border bg-muted text-primary ring-ring shadow-sm ring-1'
                          : 'border-border bg-card text-muted-foreground hover:border-border'
                      )}
                    >
                      <span className="text-lg">{h.icon}</span>
                      <span>{h.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* ── 3. Type de contrat ────────────────────────────────── */}
              <div>
                <label className="text-foreground dark:text-muted-foreground mb-1.5 flex items-center gap-2 text-xs font-bold">
                  <FileCheck2 className="text-muted-foreground h-3.5 w-3.5" />
                  <span>3. Formule de contrat</span>
                  <span className="text-destructive font-bold">*</span>
                </label>
                <NativeSelect {...editForm.register('type')} required>
                  <NativeSelectOption value="ContratProprietaire">
                    Propriétaire (Résidence principale / secondaire)
                  </NativeSelectOption>
                  <NativeSelectOption value="ContratLocataire">
                    Locataire (Risques locatifs)
                  </NativeSelectOption>
                  <NativeSelectOption value="ContratCopropriete">
                    Copropriété (Immeuble / Parties communes)
                  </NativeSelectOption>
                </NativeSelect>
              </div>

              {/* ── 4. Garanties (multi-sélection) ───────────────────── */}
              <div className="border-border bg-muted space-y-1.5 rounded-xl border p-3">
                <label className="text-primary flex items-center gap-2 text-xs font-bold">
                  <Shield className="text-primary h-3.5 w-3.5" />
                  <span>4. Garanties souscrites</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Au moins 1
                  </span>
                  <span className="text-primary ml-auto text-[9px] font-normal">
                    {editValues.garanties.length} sélectionnée
                    {editValues.garanties.length > 1 ? 's' : ''}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {GARANTIES_DISPONIBLES.map((g) => (
                    <Button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        const garanties = editValues.garanties.includes(g.id)
                          ? editValues.garanties.filter(
                              (value) => value !== g.id
                            )
                          : [...editValues.garanties, g.id];
                        editForm.setValue('garanties', garanties, {
                          shouldValidate: true,
                        });
                      }}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition-all',
                        editValues.garanties.includes(g.id)
                          ? 'border-border bg-muted text-primary shadow-sm'
                          : 'border-border bg-card text-muted-foreground hover:border-border'
                      )}
                    >
                      <span>{g.icon}</span>
                      <span className="flex-1">{g.label}</span>
                      {editValues.garanties.includes(g.id) && (
                        <CheckSquare className="text-primary h-3.5 w-3.5 shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* ── 5. Bénéficiaire (facultatif) ─────────────────────── */}
              <div>
                <label className="text-foreground dark:text-muted-foreground mb-1.5 flex items-center gap-2 text-xs font-bold">
                  <Users className="text-muted-foreground h-3.5 w-3.5" />
                  <span>5. Bénéficiaire désigné</span>
                  <span className="bg-muted text-muted-foreground dark:bg-card ml-auto rounded px-1.5 py-0.5 text-[9px] font-normal">
                    Facultatif
                  </span>
                </label>
                <NativeSelect {...editForm.register('beneficiaire')}>
                  <NativeSelectOption value="">
                    — Aucun bénéficiaire (facultatif) —
                  </NativeSelectOption>
                  {beneficiairesList.map((b) => (
                    <NativeSelectOption key={b.id} value={b.id}>
                      {b.prenom} {b.nom} ({b.id})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              {/* ── 6. Numéro de police ───────────────────────────────── */}
              <div>
                <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-bold">
                  <span>6. Numéro de Police contractuelle</span>
                  <span className="text-destructive font-bold">*</span>
                </label>
                <Input
                  type="text"
                  required
                  {...editForm.register('numeroContrat')}
                  placeholder="Ex: C-2026-004"
                  className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 font-mono text-xs focus:outline-none"
                />
              </div>

              {/* ── 7. Prime + Franchise ──────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold">
                    <DollarSign className="text-primary h-3 w-3" />
                    <span>Prime Annuelle (DT)</span>
                    <span className="text-destructive font-bold">*</span>
                  </label>
                  <Input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    {...editForm.register('montantPrime')}
                    placeholder="Ex: 650"
                    className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold">
                    <DollarSign className="text-muted-foreground h-3 w-3" />
                    <span>Franchise (DT)</span>
                    <span className="text-muted-foreground ml-auto text-[9px] font-normal">
                      Optionnel
                    </span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...editForm.register('franchise')}
                    placeholder="Ex: 150"
                    className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* ── 8. Dates ──────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold">
                    <Calendar className="text-primary h-3 w-3" />
                    <span>Date Début d&apos;effet</span>
                    <span className="text-destructive font-bold">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={editValues.dateDebut.split('T', 1)[0]}
                    onChange={(e) =>
                      editForm.setValue(
                        'dateDebut',
                        `${e.target.value}T00:00:00`,
                        { shouldValidate: true }
                      )
                    }
                    className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold">
                    <Calendar className="text-primary h-3 w-3" />
                    <span>Date Fin d&apos;échéance</span>
                    <span className="text-destructive font-bold">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={editValues.dateFin.split('T', 1)[0]}
                    onChange={(e) =>
                      editForm.setValue(
                        'dateFin',
                        `${e.target.value}T00:00:00`,
                        { shouldValidate: true }
                      )
                    }
                    className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="border-border dark:border-border flex justify-end gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditTarget(undefined);
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold shadow"
                >
                  {editLoading && (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>Enregistrer les modifications</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
