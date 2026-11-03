'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { login, register as registerUser } from '@/lib/services/auth';
import { loginPayloadSchema, registerPayloadSchema } from '@/lib/schemas/auth';
import type { LoginPayload, RegisterPayload, UserRole } from '@/lib/types/auth';
import { cn } from '@/lib/utils';
import {
  X,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (userData: {
    name: string;
    email: string;
    isConnected: boolean;
    role: UserRole;
    token: string;
    ontology_id?: string;
  }) => void;
}

export function AuthModal({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const loginForm = useForm<LoginPayload>({
    resolver: zodResolver(loginPayloadSchema),
    defaultValues: { email: '', password: '' },
  });
  const registerForm = useForm<RegisterPayload>({
    resolver: zodResolver(registerPayloadSchema),
    defaultValues: {
      email: '',
      password: '',
      nom: '',
      prenom: '',
      cin: '',
      telephone: '',
      adresse: '',
      role: 'Assure',
    },
  });

  const [lastOpenState, setLastOpenState] = useState({
    isOpen,
    initialMode,
  });

  if (
    lastOpenState.isOpen !== isOpen ||
    lastOpenState.initialMode !== initialMode
  ) {
    setLastOpenState({ isOpen, initialMode });
    if (isOpen) {
      setMode(initialMode);
      setError(undefined);
      loginForm.clearErrors();
      registerForm.clearErrors();
    }
  }

  if (!isOpen) return;

  const handleSubmit = async (values: LoginPayload | RegisterPayload) => {
    setError(undefined);
    setLoading(true);
    const request =
      mode === 'signup'
        ? registerUser(values as RegisterPayload)
        : login(values as LoginPayload);

    try {
      const data = await request;
      onSuccess({
        name: `${data.user.prenom} ${data.user.nom}`,
        email: data.user.email,
        isConnected: true,
        role: data.user.role,
        token: data.token,
        ontology_id: data.user.ontology_id,
      });
      onClose();
    } catch (error_: unknown) {
      setError(
        error_ instanceof Error ? error_.message : 'Une erreur est survenue.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="bg-card border-border w-full max-w-md gap-0 overflow-hidden rounded-3xl border p-0 shadow-2xl"
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground relative p-6 text-center">
          <Button
            onClick={onClose}
            className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 absolute top-4 right-4 rounded-full p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="bg-primary-foreground/20 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl backdrop-blur-md">
            <ShieldCheck className="text-primary-foreground h-7 w-7" />
          </div>
          <h2 className="font-serif text-xl font-bold tracking-tight">
            {mode === 'login'
              ? 'Authentification Sécurisée'
              : 'Inscription — Module Personne'}
          </h2>
          <p className="text-primary-foreground/80 mt-1 text-xs">
            {mode === 'login'
              ? 'Acces securise par role'
              : 'Inscription publique — Compte Assure'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="border-border bg-primary flex border-b">
          <Button
            type="button"
            onClick={() => {
              setMode('login');
              setError(undefined);
            }}
            className={cn(
              'flex-1 py-3 text-center text-xs font-semibold transition-all',
              mode === 'login'
                ? 'border-primary text-primary bg-card border-b-2'
                : 'text-primary-foreground/70 hover:text-primary-foreground'
            )}
          >
            Connexion
          </Button>
          <Button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(undefined);
            }}
            className={cn(
              'flex-1 py-3 text-center text-xs font-semibold transition-all',
              mode === 'signup'
                ? 'border-primary text-primary bg-card border-b-2'
                : 'text-primary-foreground/70 hover:text-primary-foreground'
            )}
          >
            Inscription
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border-destructive/30 text-destructive m-4 flex items-center gap-2 rounded-xl border p-3 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={
            mode === 'signup'
              ? registerForm.handleSubmit(handleSubmit)
              : loginForm.handleSubmit(handleSubmit)
          }
          className="max-h-[70vh] space-y-3.5 overflow-y-auto p-6"
        >
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel className="text-foreground mb-1 block text-xs font-semibold">
                    Prénom
                  </FieldLabel>
                  <Controller
                    name="prenom"
                    control={registerForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        placeholder="Karim"
                        className="border-border text-foreground focus:border-primary bg-card w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                      />
                    )}
                  />
                  <FieldError errors={[registerForm.formState.errors.prenom]} />
                </Field>
                <Field>
                  <FieldLabel className="text-foreground mb-1 block text-xs font-semibold">
                    Nom
                  </FieldLabel>
                  <Controller
                    name="nom"
                    control={registerForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        placeholder="BenAli"
                        className="border-border text-foreground focus:border-primary bg-card w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                      />
                    )}
                  />
                  <FieldError errors={[registerForm.formState.errors.nom]} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel className="text-foreground mb-1 block text-xs font-semibold">
                    CIN
                  </FieldLabel>
                  <Controller
                    name="cin"
                    control={registerForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        placeholder="08123456"
                        className="border-border text-foreground focus:border-primary bg-card w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                      />
                    )}
                  />
                  <FieldError errors={[registerForm.formState.errors.cin]} />
                </Field>
                <Field>
                  <FieldLabel className="text-foreground mb-1 block text-xs font-semibold">
                    Téléphone
                  </FieldLabel>
                  <Controller
                    name="telephone"
                    control={registerForm.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        placeholder="20123456"
                        className="border-border text-foreground focus:border-primary bg-card w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                      />
                    )}
                  />
                  <FieldError
                    errors={[registerForm.formState.errors.telephone]}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel className="text-foreground mb-1 block text-xs font-semibold">
                  Adresse
                </FieldLabel>
                <Controller
                  name="adresse"
                  control={registerForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Tunis, Ariana"
                      className="border-border text-foreground focus:border-primary bg-card w-full rounded-xl border px-3 py-2 text-xs focus:outline-none"
                    />
                  )}
                />
                <FieldError errors={[registerForm.formState.errors.adresse]} />
              </Field>
            </>
          )}

          <Field>
            <FieldLabel className="text-foreground mb-1 block text-xs font-semibold">
              Adresse e-mail
            </FieldLabel>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5" />
              {mode === 'signup' ? (
                <Controller
                  name="email"
                  control={registerForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="assure@hestia.fr"
                      className="border-border text-foreground focus:border-primary bg-card w-full rounded-xl border py-2 pr-3 pl-9 text-xs focus:outline-none"
                    />
                  )}
                />
              ) : (
                <Controller
                  name="email"
                  control={loginForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="assure@hestia.fr"
                      className="border-border text-foreground focus:border-primary bg-card w-full rounded-xl border py-2 pr-3 pl-9 text-xs focus:outline-none"
                    />
                  )}
                />
              )}
            </div>
            <FieldError
              errors={
                mode === 'signup'
                  ? [registerForm.formState.errors.email]
                  : [loginForm.formState.errors.email]
              }
            />
          </Field>

          <Field>
            <FieldLabel className="text-foreground mb-1 block text-xs font-semibold">
              Mot de passe
            </FieldLabel>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-2.5 left-3 h-3.5 w-3.5" />
              {mode === 'signup' ? (
                <Controller
                  name="password"
                  control={registerForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••••••"
                      className="border-border text-foreground focus:border-primary bg-card w-full rounded-xl border py-2 pr-3 pl-9 text-xs focus:outline-none"
                    />
                  )}
                />
              ) : (
                <Controller
                  name="password"
                  control={loginForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••••••"
                      className="border-border text-foreground focus:border-primary bg-card w-full rounded-xl border py-2 pr-3 pl-9 text-xs focus:outline-none"
                    />
                  )}
                />
              )}
            </div>
            <FieldError
              errors={
                mode === 'signup'
                  ? [registerForm.formState.errors.password]
                  : [loginForm.formState.errors.password]
              }
            />
          </Field>

          <Button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-md transition-opacity hover:opacity-95"
          >
            <span>
              {loading
                ? 'Traitement sécurisé...'
                : mode === 'login'
                  ? 'Se Connecter'
                  : 'Créer mon compte & individu'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Security Notice & Mode Switch */}
          <div className="border-border space-y-2 border-t pt-3 text-center">
            {mode === 'login' ? (
              <p className="text-muted-foreground text-xs">
                Vous n&apos;avez pas encore de compte client ?{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setMode('signup');
                    setError(undefined);
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Créer un compte
                </Button>
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Vous avez déjà un compte ?{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setMode('login');
                    setError(undefined);
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Se connecter
                </Button>
              </p>
            )}

            <div className="text-muted-foreground flex items-center justify-center gap-1.5 pt-1 text-[11px]">
              <ShieldCheck className="text-primary h-3.5 w-3.5" />
              <span>Chiffrement SSL & Hachage sécurisé SHA-256</span>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
