'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  createPersonne,
  deletePersonne,
  listPersonnes,
  updatePersonne,
  updatePersonneRole,
} from '@/lib/services/personnes';
import {
  approvePromotion,
  createPromotion,
  listPromotions,
  rejectPromotion,
} from '@/lib/services/promotions';
import type {
  Personne,
  PersonneRole,
  PersonnesViewUser,
} from '@/lib/types/personnes';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import {
  editPersonneFormSchema,
  personneFormSchema,
  promotionFormSchema,
} from '@/lib/schemas/forms';
import type { z } from 'zod';
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
  User as UserIcon,
  ShieldAlert,
  Mail,
  Building2,
  Pencil,
  Save,
} from 'lucide-react';

interface PersonnesViewProps {
  userRole?: string;
  currentUser?: PersonnesViewUser;
  onCountChange?: (count: number) => void;
}

export function PersonnesView({
  userRole = 'Assure',
  currentUser,
  onCountChange,
}: PersonnesViewProps) {
  const queryClient = useQueryClient();
  const personnesQuery = useQuery({
    queryKey: ['personnes'],
    queryFn: listPersonnes,
  });
  const personnes = personnesQuery.data ?? [];
  const loading = personnesQuery.isFetching;
  const [filterRole, setFilterRole] = useState<PersonneRole>('Tous');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Role determinations
  const isAssure = userRole === 'Assure';
  const isExpert = userRole === 'Expert';
  const canAddPersonne = userRole === 'Agent' || userRole === 'Admin';
  const isAdmin = userRole === 'Admin';

  // New Person form state (Agents can only add Assuré or Bénéficiaire, Admins can add anyone)
  const [formError, setFormError] = useState<string | undefined>();

  // Edit modal state
  const [editTarget, setEditTarget] = useState<Personne | undefined>();
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();
  const [editRole, setEditRole] = useState<string>('Assure');

  // Delete confirmation state (Admin)
  const [deleteTarget, setDeleteTarget] = useState<
    { id: string; nom: string } | undefined
  >();

  // Promotion request state (Assure -> Agent)
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [promoError, setPromoError] = useState<string | undefined>();

  // Admin: pending promotion requests
  const promotionsQuery = useQuery({
    queryKey: ['promotions'],
    queryFn: listPromotions,
  });
  const promotions = promotionsQuery.data ?? [];
  const hasPendingPromotion = Boolean(
    currentUser?.ontology_id &&
    promotions.some(
      (promotion) =>
        promotion.ontology_id === currentUser.ontology_id &&
        promotion.status === 'pending'
    )
  );
  const [showPromos, setShowPromos] = useState(false);

  type PersonneFormValues = z.infer<typeof personneFormSchema>;
  type EditPersonneFormValues = z.infer<typeof editPersonneFormSchema>;
  type PromotionFormValues = z.infer<typeof promotionFormSchema>;

  const personneForm = useForm<PersonneFormValues>({
    resolver: zodResolver(personneFormSchema),
    defaultValues: {
      role: 'Assure',
      nom: '',
      prenom: '',
      cin: '',
      telephone: '',
      adresse: '',
    },
  });
  const editPersonneForm = useForm<EditPersonneFormValues>({
    resolver: zodResolver(editPersonneFormSchema),
  });
  const promotionForm = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: { message: '' },
  });

  const fetchPersonnes = () => personnesQuery.refetch();

  const openEditModal = (p: Personne) => {
    setEditTarget(p);
    editPersonneForm.reset({
      nom: p.nom || '',
      prenom: p.prenom || '',
      cin: p.cin || '',
      telephone: p.telephone || '',
      adresse: p.adresse || '',
    });
    setEditRole(p.type || 'Assure');
    setEditError(undefined);
  };

  const handleEditSave = async (values: EditPersonneFormValues) => {
    if (!editTarget) return;
    setEditLoading(true);
    setEditError(undefined);

    const updateRole =
      isAdmin && editRole !== editTarget.type
        ? updatePersonneRole(editTarget.personne, editRole)
        : Promise.resolve();
    try {
      await updatePersonne(editTarget.personne, {
        ...values,
      });
      await updateRole;
      setEditTarget(undefined);
      await queryClient.invalidateQueries({ queryKey: ['personnes'] });
    } catch {
      setEditError('Erreur de connexion au serveur.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (personneId: string, nom: string) => {
    setDeleteTarget({ id: personneId, nom });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePersonne(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['personnes'] });
    } catch {
      toast.add({
        title: 'Erreur',
        description: 'Erreur de connexion.',
        type: 'error',
      });
    } finally {
      setDeleteTarget(undefined);
    }
  };

  const fetchPromotions = async () => {
    await promotionsQuery.refetch();
  };

  const handlePromoAction = async (
    promoId: string,
    action: 'approve' | 'reject'
  ) => {
    const operation =
      action === 'approve'
        ? approvePromotion(promoId)
        : rejectPromotion(promoId);
    try {
      await operation;
    } catch {
      setPromoError(
        `Impossible de ${action === 'approve' ? 'valider' : 'rejeter'} la demande.`
      );
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['promotions'] }),
      queryClient.invalidateQueries({ queryKey: ['personnes'] }),
    ]);
  };

  const handleSubmitPromo = async ({ message }: PromotionFormValues) => {
    setPromoLoading(true);
    setPromoError(undefined);
    const payload = {
      ontology_id: currentUser?.ontology_id || 'Assure1',
      current_name: currentUser?.name || '',
      requested_role: 'Agent' as const,
      message: message || '',
    };
    try {
      await createPromotion(payload);
    } catch {
      setPromoError('Erreur de connexion.');
      setPromoLoading(false);
      return;
    }
    setPromoSuccess(true);
    setPromoModalOpen(false);
    setPromoLoading(false);
  };

  const handleCreatePersonne = async (values: PersonneFormValues) => {
    setFormError(undefined);

    if (!canAddPersonne) {
      setFormError(
        'Action refusée : Seuls les Agents et Administrateurs peuvent ajouter des personnes.'
      );
      return;
    }

    if (
      userRole === 'Agent' &&
      (values.role === 'Agent' || values.role === 'Expert')
    ) {
      setFormError(
        'Droits insuffisants : Un Agent peut uniquement enregistrer des Assurés et des Bénéficiaires.'
      );
      return;
    }

    try {
      await createPersonne({
        ...values,
      });
      setIsModalOpen(false);
      personneForm.reset();
      await queryClient.invalidateQueries({ queryKey: ['personnes'] });
    } catch {
      setFormError('Erreur de connexion au serveur.');
    }
  };

  // Find the logged-in user in the ontology list (or fallback to Assure1)
  const myPersonneData = personnes.find(
    (p) =>
      p.personne === currentUser?.ontology_id ||
      (currentUser?.name &&
        (p.nom || '').toLowerCase() ===
          currentUser.name.split(' ').pop()?.toLowerCase())
  ) ||
    personnes.find((p) => p.personne === 'Assure1') || {
      personne: currentUser?.ontology_id || 'Assure1',
      type: 'Assure',
      nom: currentUser?.name?.split(' ').pop() || 'BenAli',
      prenom: currentUser?.name?.split(' ', 1)[0] || 'Karim',
      cin: '08123456',
      telephone: '20123456',
      adresse: 'Tunis, Ariana',
    };

  // Find the assigned Agent
  const assignedAgent = personnes.find(
    (p) => p.type === 'Agent' || p.personne.includes('Agent')
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
    const currentRole =
      p.type ||
      (p.personne.includes('Agent')
        ? 'Agent'
        : p.personne.includes('Expert')
          ? 'Expert'
          : p.personne.includes('Beneficiaire')
            ? 'Beneficiaire'
            : 'Assure');

    // 1. Expert : Uniquement les Assurés à expertiser (JAMAIS les Agents, Experts ou Admins)
    if (isExpert && currentRole !== 'Assure') return false;

    // 2. Agent : Uniquement ses clients (Assurés et Bénéficiaires, JAMAIS d'autres Agents, Experts ou Admins)
    if (
      userRole === 'Agent' &&
      currentRole !== 'Assure' &&
      currentRole !== 'Beneficiaire'
    )
      return false;

    // 3. Admin : Voit tous les rôles

    const matchesRole =
      filterRole === 'Tous' ? true : currentRole === filterRole;

    const matchesSearch =
      (p.nom || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.prenom || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.cin || '').includes(search) ||
      (p.personne || '').toLowerCase().includes(search.toLowerCase());

    return matchesRole && matchesSearch;
  });

  useEffect(() => {
    if (onCountChange && !isAssure) {
      onCountChange(filtered.length);
    }
  }, [filtered.length, onCountChange, isAssure]);

  // =========================================================================
  // VIEW 1: ESPACE CLIENT ASSURÉ (STRICTE CONFIDENTIALITÉ & RGPD)
  // L'assuré ne voit AUCUN autre client, uniquement sa fiche et son conseiller
  // =========================================================================
  if (isAssure) {
    return (
      <div className="space-y-6">
        {/* Banner Mon Profil */}
        <div className="from-primary to-card text-primary-foreground via-primary relative overflow-hidden rounded-3xl bg-gradient-to-r p-6 shadow-xl sm:p-8">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="border-border bg-muted text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="text-primary h-3.5 w-3.5" />
              <span>Espace Client Particulier — Protection RGPD</span>
            </div>
            <h1 className="text-primary-foreground font-serif text-2xl font-extrabold tracking-tight sm:text-3xl">
              Mon Profil & Dossier Assuré
            </h1>
            <p className="text-primary text-xs leading-relaxed sm:text-sm">
              Consultez les informations personnelles rattachées à vos polices
              d&apos;assurance habitation. Vos données sont certifiées et
              synchronisées avec l&apos;ontologie sémantique.
            </p>
          </div>
          <div className="absolute right-6 -bottom-6 hidden opacity-15 sm:block">
            <UserIcon className="text-primary-foreground h-44 w-44" />
          </div>
        </div>

        {/* Security & Confidentiality Notice */}
        <div className="border-border bg-muted text-primary dark:border-border dark:bg-muted dark:text-primary flex items-start gap-3 rounded-2xl border p-4 text-xs">
          <ShieldCheck className="text-primary dark:text-primary mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">
              Cloisonnement strict des données personnelles (Conformité RGPD)
            </p>
            <p className="text-primary dark:text-primary text-[11px] leading-relaxed">
              En tant que client souscripteur, vous avez accès uniquement à
              votre propre dossier d&apos;assurance. L&apos;accès aux
              répertoires des autres assurés est strictement réservé aux agents
              gestionnaires de la compagnie.
            </p>
          </div>
        </div>

        {/* Client Profile Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card 1: Fiche Personnelle de l'Assuré */}
          <div className="border-border bg-card dark:border-border dark:bg-card space-y-5 rounded-3xl border p-6 shadow-sm lg:col-span-2">
            <div className="border-border dark:border-border flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted text-primary dark:bg-muted dark:text-primary flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold">
                  {(myPersonneData.prenom?.[0] || 'A') +
                    (myPersonneData.nom?.[0] || 'D')}
                </div>
                <div>
                  <h2 className="text-foreground dark:text-foreground font-serif text-lg font-bold">
                    {myPersonneData.prenom} {myPersonneData.nom}
                  </h2>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                      Classe OWL : Assuré (:Assure)
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">
                      #{myPersonneData.personne}
                    </span>
                  </div>
                </div>
              </div>
              <span className="border-border bg-muted text-primary dark:border-border dark:bg-muted inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Souscripteur Vérifié</span>
              </span>
            </div>

            {/* Details Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border-border bg-muted dark:border-border dark:bg-card/40 space-y-1 rounded-2xl border p-4">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
                  <CreditCard className="text-primary h-4 w-4" />
                  <span>Numéro de CIN</span>
                </div>
                <p className="text-foreground dark:text-foreground font-mono text-sm font-bold">
                  {myPersonneData.cin || '08123456'}
                </p>
                <span className="text-muted-foreground text-[10px]">
                  Propriété datatype : as:cin
                </span>
              </div>

              <div className="border-border bg-muted dark:border-border dark:bg-card/40 space-y-1 rounded-2xl border p-4">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
                  <Phone className="text-primary h-4 w-4" />
                  <span>Téléphone de contact</span>
                </div>
                <p className="text-foreground dark:text-foreground font-mono text-sm font-bold">
                  {myPersonneData.telephone || '20123456'}
                </p>
                <span className="text-muted-foreground text-[10px]">
                  Propriété datatype : as:telephone
                </span>
              </div>

              <div className="border-border bg-muted dark:border-border dark:bg-card/40 space-y-1 rounded-2xl border p-4 sm:col-span-2">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
                  <MapPin className="text-destructive h-4 w-4" />
                  <span>Adresse du domicile assuré</span>
                </div>
                <p className="text-foreground dark:text-foreground text-sm font-bold">
                  {myPersonneData.adresse || 'Tunis, Ariana'}
                </p>
                <span className="text-muted-foreground text-[10px]">
                  Propriété datatype : as:adresse (Localisation du risque
                  couvert)
                </span>
              </div>
            </div>

            <div className="bg-muted text-muted-foreground dark:bg-card/30 flex items-center justify-between rounded-xl p-3 text-[11px]">
              <span>
                Pour modifier vos coordonnées déclarées, veuillez fournir un
                justificatif à votre agent d&apos;assurance.
              </span>
              <Button
                onClick={fetchPersonnes}
                className="text-primary ml-2 flex shrink-0 items-center gap-1 font-semibold hover:underline"
              >
                <RefreshCw
                  className={cn('h-3 w-3', loading && 'animate-spin')}
                />
                <span>Actualiser</span>
              </Button>
            </div>
          </div>

          {/* Card 2 : Conseiller / Agent Référent */}
          <div className="border-border bg-card dark:border-border dark:bg-card flex flex-col justify-between space-y-5 rounded-3xl border p-6 shadow-sm">
            <div className="space-y-4">
              <div className="border-border dark:border-border flex items-center gap-2 border-b pb-3">
                <Building2 className="text-primary h-5 w-5" />
                <h3 className="text-foreground dark:text-foreground font-serif text-sm font-bold">
                  Votre Conseiller Référent
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-muted text-primary dark:bg-muted dark:text-primary flex h-10 w-10 items-center justify-center rounded-xl font-bold">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-foreground dark:text-foreground text-sm font-bold">
                      {assignedAgent.prenom} {assignedAgent.nom}
                    </h4>
                    <span className="text-muted-foreground block text-[11px]">
                      Agent Mandataire ({assignedAgent.personne})
                    </span>
                  </div>
                </div>

                <div className="bg-muted text-muted-foreground dark:bg-card/40 dark:text-muted-foreground space-y-2 rounded-2xl p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    <span>
                      Ligne directe :{' '}
                      <strong>{assignedAgent.telephone || '71234567'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    <span>
                      {assignedAgent.adresse || 'Agence Hestia Assur'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    <span>contact-agence@hestia.fr</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-border dark:border-border border-t pt-4">
              <a
                href={`tel:${assignedAgent.telephone || '71234567'}`}
                className="text-primary-foreground bg-muted hover:bg-accent flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Appeler mon conseiller</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Devenir Agent Section ─────────────────────────────────── */}
        {promoSuccess || hasPendingPromotion ? (
          <div className="dark:border-border border-border bg-muted dark:bg-muted flex items-center gap-3 rounded-2xl border p-5">
            <CheckCircle2 className="text-primary h-5 w-5 shrink-0" />
            <div>
              <p className="dark:text-foreground text-primary text-sm font-bold">
                Demande envoyee avec succes
              </p>
              <p className="text-primary dark:text-primary mt-0.5 text-[11px]">
                Un administrateur examinera votre demande. Vous serez notifie
                lors de la prochaine connexion.
              </p>
            </div>
          </div>
        ) : (
          <div className="border-border bg-muted dark:border-border dark:bg-muted flex flex-col items-start justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="bg-muted dark:bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <Briefcase className="text-primary dark:text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-primary dark:text-primary text-sm font-bold">
                  Vous souhaitez devenir Agent ?
                </p>
                <p className="text-primary dark:text-primary mt-0.5 max-w-sm text-[11px]">
                  Soumettez une demande de promotion. Un administrateur
                  examinera votre profil et validera votre acces Agent.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setPromoModalOpen(true)}
              className="text-primary-foreground bg-muted hover:bg-accent flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Demander la promotion Agent</span>
            </Button>
          </div>
        )}

        {/* Promo Modal */}
        <Dialog open={promoModalOpen} onOpenChange={setPromoModalOpen}>
          <DialogContent className="max-w-md overflow-hidden rounded-3xl p-0">
            <DialogHeader className="from-primary to-card text-primary-foreground relative gap-1 bg-gradient-to-r p-6">
              <DialogTitle className="flex items-center gap-2 font-serif text-lg font-bold">
                <Briefcase className="text-primary h-5 w-5" />
                Demande de Promotion Agent
              </DialogTitle>
              <p className="text-primary text-xs">
                Votre demande sera examinee par un administrateur Hestia Assur
              </p>
            </DialogHeader>
            <form
              onSubmit={promotionForm.handleSubmit(handleSubmitPromo)}
              className="space-y-4 p-6"
            >
              {promoError && (
                <div className="border-border bg-muted text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs">
                  <ShieldAlert className="text-destructive h-4 w-4 shrink-0" />
                  <span>{promoError}</span>
                </div>
              )}
              <div className="bg-muted dark:bg-card space-y-1 rounded-xl p-3 text-xs">
                <p className="text-foreground dark:text-muted-foreground font-semibold">
                  Demandeur
                </p>
                <p className="text-muted-foreground">
                  {currentUser?.name} — #{currentUser?.ontology_id}
                </p>
                <p className="text-muted-foreground">
                  Role actuel :{' '}
                  <span className="text-primary font-bold">Assure</span> → Role
                  demande :{' '}
                  <span className="text-primary font-bold">Agent</span>
                </p>
              </div>
              <div>
                <FieldLabel
                  htmlFor="promo-message"
                  className="text-foreground dark:text-muted-foreground mb-1 block text-xs font-semibold"
                >
                  Message de motivation (optionnel)
                </FieldLabel>
                <Textarea
                  id="promo-message"
                  {...promotionForm.register('message')}
                  rows={3}
                  placeholder="Expliquez pourquoi vous souhaitez devenir agent d'assurance..."
                  className="border-input bg-card text-foreground dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full resize-none rounded-xl border px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setPromoModalOpen(false)}
                  className="border-input text-foreground hover:bg-muted dark:border-border dark:text-muted-foreground flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-colors"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={promoLoading}
                  className="text-primary-foreground bg-muted hover:bg-accent flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>
                    {promoLoading ? 'Envoi...' : 'Soumettre la demande'}
                  </span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ESPACE BACK-OFFICE GESTIONNAIRE (AGENT / ADMIN) & EXPERT
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border-border bg-card dark:border-border dark:bg-card flex flex-col justify-between gap-4 rounded-3xl border p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="bg-muted text-primary dark:bg-muted dark:text-primary flex h-10 w-10 items-center justify-center rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground dark:text-foreground font-serif text-xl font-bold">
              {isExpert
                ? 'Répertoire des Assurés (Consultation Expert)'
                : userRole === 'Agent'
                  ? 'Gestion du Portefeuille Clients (Assurés & Bénéficiaires)'
                  : "Gestion Globale des Acteurs & Rôles d'Assurance"}
            </h1>
            <p className="text-muted-foreground text-xs">
              {isExpert
                ? 'Coordonnées des assurés à contacter pour audit technique et évaluation des risques'
                : userRole === 'Agent'
                  ? "En tant qu'Agent d'assurance, vous gérez exclusivement vos clients (Assurés et Bénéficiaires)."
                  : 'Console Super-Admin : Assurés, Agents, Experts et Bénéficiaires modélisés sous Protégé'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchPersonnes}
            className="border-border bg-card text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-foreground flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
            <span>Actualiser</span>
          </Button>

          {canAddPersonne && (
            <Button
              onClick={() => {
                setFormError(undefined);
                setIsModalOpen(true);
              }}
              className="text-primary-foreground bg-muted hover:bg-accent flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Ajouter une personne</span>
            </Button>
          )}
        </div>
      </div>

      {/* Role Security Notification Banner */}
      {isExpert && (
        <div className="border-border bg-muted text-primary dark:border-border dark:bg-muted dark:text-primary flex flex-col justify-between gap-3 rounded-2xl border p-4 text-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Briefcase className="text-primary dark:text-primary h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Espace Expert Technique — Accès Restreint aux Assurés
              </p>
              <p className="text-primary dark:text-primary mt-0.5 text-[11px]">
                Conformément aux règles de confidentialité RGPD, vous consultez
                exclusivement la liste des <strong>Assurés</strong> (nom,
                téléphone, adresse) pour vos missions d&apos;évaluation et
                d&apos;expertise terrain. L&apos;annuaire interne des agents et
                confrères experts vous est masqué.
              </p>
            </div>
          </div>
          <span className="bg-muted text-primary dark:bg-muted dark:text-primary shrink-0 self-start rounded-full px-3 py-1 text-[10px] font-bold sm:self-auto">
            Filtre Assurés Actif
          </span>
        </div>
      )}

      {userRole === 'Agent' && (
        <div className="dark:border-border dark:bg-muted/40 dark:text-foreground border-border bg-muted text-primary flex flex-col justify-between gap-3 rounded-2xl border p-4 text-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <UserCheck className="text-primary dark:text-primary h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Habilitation Agent d&apos;Assurance
              </p>
              <p className="text-primary dark:text-primary mt-0.5 text-[11px]">
                Vous êtes habilité à créer et inscrire de nouveaux{' '}
                <strong>Assurés</strong> et <strong>Bénéficiaires</strong>{' '}
                directement dans l&apos;ontologie sémantique.
              </p>
            </div>
          </div>
          <span className="dark:text-foreground bg-muted text-primary dark:bg-muted shrink-0 self-start rounded-full px-3 py-1 text-[10px] font-bold sm:self-auto">
            Privilège Agent Actif
          </span>
        </div>
      )}

      {userRole === 'Admin' && (
        <div className="border-border bg-muted text-foreground flex flex-col justify-between gap-3 rounded-2xl border p-4 text-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-primary h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Console Super-Administrateur
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Accès illimité : création d&apos;Agents, Experts, Assurés et
                Bénéficiaires, gestion des axiomes RDF et requêtes SPARQL
                directes.
              </p>
            </div>
          </div>
          <span className="bg-secondary text-secondary-foreground shrink-0 self-start rounded-full px-3 py-1 text-[10px] font-bold sm:self-auto">
            Super-Admin OWL
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {isExpert ? (
          <div className="flex items-center gap-2">
            <span className="border-border bg-muted text-primary dark:border-border dark:bg-muted dark:text-primary rounded-xl border px-3.5 py-1.5 text-xs font-bold">
              Assurés à expertiser ({filtered.length})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(userRole === 'Agent'
              ? (['Tous', 'Assure', 'Beneficiaire'] as const)
              : (['Tous', 'Assure', 'Agent', 'Expert', 'Beneficiaire'] as const)
            ).map((r) => (
              <Button
                key={r}
                onClick={() => setFilterRole(r)}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all',
                  filterRole === r
                    ? 'text-primary-foreground bg-muted shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-muted-foreground border'
                )}
              >
                {r === 'Tous'
                  ? userRole === 'Agent'
                    ? 'Tous les clients'
                    : 'Tous les rôles'
                  : r}
              </Button>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, CIN, identifiant..."
            className="border-border bg-card text-foreground placeholder-muted-foreground dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border py-2 pr-3 pl-9 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Persons Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, idx) => (
          <div
            key={idx}
            className="border-border/80 bg-card dark:border-border dark:bg-card relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                    p.type === 'Assure' ||
                      (!p.type && p.personne.includes('Assure')) ||
                      p.type === 'Agent' ||
                      (!p.type && p.personne.includes('Agent')) ||
                      p.type === 'Expert' ||
                      (!p.type && p.personne.includes('Expert'))
                      ? 'bg-muted text-primary dark:bg-muted dark:text-primary'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  {p.type ||
                    (p.personne.includes('Agent')
                      ? 'Agent'
                      : p.personne.includes('Expert')
                        ? 'Expert'
                        : 'Assure')}
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  #{p.personne}
                </span>
                {/* Action buttons - Admin (all) and Agent (clients only) */}
                {(isAdmin ||
                  (userRole === 'Agent' &&
                    ((p.type || '').includes('Assure') ||
                      (p.type || '').includes('Beneficiaire') ||
                      (p.personne || '').includes('Assure') ||
                      (p.personne || '').includes('Beneficiaire')))) && (
                  <div className="flex items-center gap-0.5">
                    <Button
                      onClick={() => openEditModal(p)}
                      title="Modifier les coordonnées du client"
                      className="text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent rounded-lg p-1 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {isAdmin && (
                      <Button
                        onClick={() =>
                          handleDelete(
                            p.personne,
                            `${p.prenom || ''} ${p.nom || p.personne}`.trim()
                          )
                        }
                        title="Supprimer"
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent rounded-lg p-1 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-foreground dark:text-foreground text-base font-bold">
                  {p.prenom || ''} {p.nom || p.personne}
                </h3>
                <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  <span>CIN : {p.cin || 'Non renseigné'}</span>
                </div>
              </div>

              <div className="border-border text-muted-foreground dark:border-border dark:text-muted-foreground space-y-1.5 border-t pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                  <span>{p.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {p.adresse || 'Adresse non renseignée'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(undefined);
        }}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-3xl p-0">
          {/* Header */}
          <DialogHeader className="from-primary text-primary-foreground to-card relative gap-1 bg-gradient-to-r p-6">
            <DialogTitle className="flex items-center gap-2 font-serif text-lg font-bold">
              <Pencil className="text-primary h-5 w-5" />
              Modifier la Personne
            </DialogTitle>
            <p className="text-primary text-xs">
              #{editTarget?.personne} — {editTarget?.type}
            </p>
          </DialogHeader>

          <form
            onSubmit={editPersonneForm.handleSubmit(handleEditSave)}
            className="space-y-3.5 p-6"
          >
            {editError && (
              <div className="border-border bg-muted text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs">
                <ShieldAlert className="text-destructive h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}
            {/* Encart informatif */}
            <div className="border-border bg-muted text-primary dark:border-border dark:bg-muted dark:text-primary flex items-center justify-between rounded-xl border p-3 text-xs">
              <span>
                Tous les champs avec (
                <span className="text-destructive font-bold">*</span>) sont{' '}
                <strong>obligatoires</strong>.
              </span>
              <span className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                Édition OWL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel
                  htmlFor="personne-edit-prenom"
                  className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
                >
                  <span>Prénom</span>
                  <span className="text-destructive font-bold">*</span>
                </FieldLabel>
                <Controller
                  name="prenom"
                  control={editPersonneForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="personne-edit-prenom"
                      type="text"
                      className="border-input bg-card dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                    />
                  )}
                />
                <FieldError
                  errors={[editPersonneForm.formState.errors.prenom]}
                />
              </Field>
              <Field>
                <FieldLabel
                  htmlFor="personne-edit-nom"
                  className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
                >
                  <span>Nom</span>
                  <span className="text-destructive font-bold">*</span>
                </FieldLabel>
                <Controller
                  name="nom"
                  control={editPersonneForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="personne-edit-nom"
                      type="text"
                      className="border-input bg-card dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                    />
                  )}
                />
                <FieldError errors={[editPersonneForm.formState.errors.nom]} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel
                  htmlFor="personne-edit-cin"
                  className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
                >
                  <span>Numéro de CIN</span>
                  <span className="text-destructive font-bold">*</span>
                </FieldLabel>
                <Controller
                  name="cin"
                  control={editPersonneForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="personne-edit-cin"
                      type="text"
                      className="border-input bg-card dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border px-3 py-2 font-mono text-xs focus:outline-none"
                    />
                  )}
                />
                <FieldError errors={[editPersonneForm.formState.errors.cin]} />
              </Field>
              <Field>
                <FieldLabel
                  htmlFor="personne-edit-telephone"
                  className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
                >
                  <span>Téléphone</span>
                  <span className="text-destructive font-bold">*</span>
                </FieldLabel>
                <Controller
                  name="telephone"
                  control={editPersonneForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="personne-edit-telephone"
                      type="text"
                      className="border-input bg-card dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border px-3 py-2 font-mono text-xs focus:outline-none"
                    />
                  )}
                />
                <FieldError
                  errors={[editPersonneForm.formState.errors.telephone]}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel
                htmlFor="personne-edit-adresse"
                className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
              >
                <span>Adresse du domicile</span>
                <span className="text-destructive font-bold">*</span>
              </FieldLabel>
              <Controller
                name="adresse"
                control={editPersonneForm.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="personne-edit-adresse"
                    type="text"
                    className="border-input bg-card dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                  />
                )}
              />
              <FieldError
                errors={[editPersonneForm.formState.errors.adresse]}
              />
            </Field>

            {/* Role change - Admin only */}
            {isAdmin && (
              <div>
                <FieldLabel className="text-foreground dark:text-muted-foreground mb-1 block text-xs font-semibold">
                  Rôle ontologique
                </FieldLabel>
                <NativeSelect
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <NativeSelectOption value="Assure">Assuré</NativeSelectOption>
                  <NativeSelectOption value="Agent">Agent</NativeSelectOption>
                  <NativeSelectOption value="Expert">Expert</NativeSelectOption>
                  <NativeSelectOption value="Beneficiaire">
                    Bénéficiaire
                  </NativeSelectOption>
                </NativeSelect>
                {editRole !== editTarget?.type && (
                  <p className="text-primary mt-1 text-[10px] font-medium">
                    Le rôle sera changé de {editTarget?.type} vers {editRole}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                onClick={() => setEditTarget(undefined)}
                className="border-input text-foreground hover:bg-muted dark:border-border dark:text-muted-foreground flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-colors"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={editLoading}
                className="text-primary-foreground bg-muted hover:bg-accent flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{editLoading ? 'Enregistrement...' : 'Enregistrer'}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Admin Promotions Panel ───────────────────────────────────── */}
      {isAdmin && (
        <div className="border-border bg-card dark:border-border dark:bg-card overflow-hidden rounded-2xl border">
          <Button
            onClick={() => {
              setShowPromos((v) => !v);
              fetchPromotions();
            }}
            className="text-foreground hover:bg-muted dark:text-foreground dark:hover:bg-accent flex w-full items-center justify-between px-5 py-4 text-sm font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-4 w-4" />
              <span>Demandes de promotion en attente</span>
              {promotions.some((p) => p.status === 'pending') && (
                <span className="text-primary-foreground bg-muted rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {promotions.filter((p) => p.status === 'pending').length}
                </span>
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {showPromos ? '▲ Masquer' : '▼ Voir les demandes'}
            </span>
          </Button>

          {showPromos && (
            <div className="border-border dark:border-border divide-border dark:divide-border divide-y border-t">
              {promotions.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-xs">
                  Aucune demande en attente
                </p>
              ) : (
                promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="text-foreground dark:text-foreground text-sm font-semibold">
                        {promo.current_name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        #{promo.ontology_id} &rarr;{' '}
                        <span className="text-primary font-bold">
                          {promo.requested_role}
                        </span>
                      </p>
                      {promo.message && (
                        <p className="text-muted-foreground mt-0.5 text-[11px] italic">
                          {promo.message}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-0.5 text-[10px]">
                        {promo.created_at}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold',
                          promo.status === 'pending' ||
                            promo.status === 'approved'
                            ? 'bg-muted text-primary'
                            : 'bg-muted text-destructive'
                        )}
                      >
                        {promo.status}
                      </span>
                      {promo.status === 'pending' && (
                        <>
                          <Button
                            onClick={() =>
                              handlePromoAction(promo.id, 'approve')
                            }
                            className="text-primary-foreground bg-muted hover:bg-accent rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors"
                          >
                            Approuver
                          </Button>
                          <Button
                            onClick={() =>
                              handlePromoAction(promo.id, 'reject')
                            }
                            className="bg-muted text-destructive hover:bg-accent rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors"
                          >
                            Refuser
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal - Ajouter une Personne (Uniquement pour Agent & Admin) */}
      <Dialog
        open={isModalOpen && canAddPersonne}
        onOpenChange={(open) => {
          if (!open) setIsModalOpen(false);
        }}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-3xl p-0">
          <DialogHeader className="from-primary to-card text-primary-foreground relative gap-1 bg-gradient-to-r p-6">
            <DialogTitle className="font-serif text-lg font-bold">
              Ajouter une Personne
            </DialogTitle>
            <p className="text-primary text-xs">
              {userRole === 'Agent'
                ? "Inscription d'un souscripteur (Assuré ou Bénéficiaire)"
                : "Création d'un individu conforme au modèle ontologique Personne"}
            </p>
          </DialogHeader>

          <form
            onSubmit={personneForm.handleSubmit(handleCreatePersonne)}
            className="space-y-3.5 p-6"
          >
            {formError && (
              <div className="border-border bg-muted text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs">
                <ShieldAlert className="text-destructive h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {/* Encart informatif sur les champs obligatoires */}
            <div className="border-border bg-muted text-primary dark:border-border dark:bg-muted dark:text-primary flex items-center justify-between rounded-xl border p-3 text-xs">
              <span>
                Tous les champs avec (
                <span className="text-destructive font-bold">*</span>) sont{' '}
                <strong>obligatoires</strong>.
              </span>
              <span className="bg-muted text-primary dark:bg-muted dark:text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                Validation stricte
              </span>
            </div>

            <div>
              <FieldLabel
                htmlFor="personne-add-role"
                className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-bold"
              >
                <span>Rôle ontologique à attribuer</span>
                <span className="text-destructive font-bold">*</span>
                <span className="bg-muted text-destructive dark:bg-muted ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold">
                  Obligatoire
                </span>
              </FieldLabel>
              <NativeSelect
                id="personne-add-role"
                {...personneForm.register('role')}
              >
                <NativeSelectOption value="Assure">
                  Assuré (Souscripteur client)
                </NativeSelectOption>
                <NativeSelectOption value="Beneficiaire">
                  Bénéficiaire (Ayant-droit)
                </NativeSelectOption>
                {isAdmin && (
                  <NativeSelectOption value="Agent">
                    Agent d&apos;assurance
                  </NativeSelectOption>
                )}
                {isAdmin && (
                  <NativeSelectOption value="Expert">
                    Expert technique
                  </NativeSelectOption>
                )}
              </NativeSelect>
              {userRole === 'Agent' && (
                <p className="text-muted-foreground mt-1 text-[10px]">
                  * En tant qu&apos;Agent, vous ne pouvez inscrire que des
                  Assurés et Bénéficiaires.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel
                  htmlFor="personne-add-prenom"
                  className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
                >
                  <span>Prénom</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                </FieldLabel>
                <Input
                  id="personne-add-prenom"
                  type="text"
                  {...personneForm.register('prenom')}
                  placeholder="Ex: Sami"
                  className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                />
              </div>
              <div>
                <FieldLabel
                  htmlFor="personne-add-nom"
                  className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
                >
                  <span>Nom</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                </FieldLabel>
                <Input
                  id="personne-add-nom"
                  type="text"
                  {...personneForm.register('nom')}
                  placeholder="Ex: Trabelsi"
                  className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel
                  htmlFor="personne-add-cin"
                  className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
                >
                  <span>Numéro de CIN</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                </FieldLabel>
                <Input
                  id="personne-add-cin"
                  type="text"
                  {...personneForm.register('cin')}
                  placeholder="Ex: 08123456"
                  className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 font-mono text-xs focus:outline-none"
                />
              </div>
              <div>
                <FieldLabel
                  htmlFor="personne-add-telephone"
                  className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
                >
                  <span>Téléphone</span>
                  <span className="text-destructive font-bold">*</span>
                  <span className="bg-muted text-destructive dark:bg-muted ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold">
                    Obligatoire
                  </span>
                </FieldLabel>
                <Input
                  id="personne-add-telephone"
                  type="text"
                  {...personneForm.register('telephone')}
                  placeholder="Ex: 20123456"
                  className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <FieldLabel
                htmlFor="personne-add-adresse"
                className="text-foreground dark:text-muted-foreground mb-1 flex items-center gap-1 text-xs font-bold"
              >
                <span>Adresse du domicile</span>
                <span className="text-destructive font-bold">*</span>
                <span className="bg-muted text-destructive dark:bg-muted ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold">
                  Obligatoire
                </span>
              </FieldLabel>
              <Input
                id="personne-add-adresse"
                type="text"
                {...personneForm.register('adresse')}
                placeholder="Ex: Tunis, Ariana"
                className="border-input dark:border-border dark:bg-card dark:text-foreground focus:border-border w-full rounded-xl border p-2 text-xs focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3">
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
                Créer dans l&apos;ontologie
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression (Admin) */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la personne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer définitivement « {deleteTarget?.nom} » (
              {deleteTarget?.id}) de l&apos;ontologie ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
