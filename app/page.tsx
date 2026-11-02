'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { DashboardView } from '@/components/dashboard-view';
import { PersonnesView } from '@/components/insurance/personnes-view';
import { ContratsView } from '@/components/insurance/contrats-view';
import { SemanticWebView } from '@/components/insurance/semantic-web-view';
import { SparqlExplorerView } from '@/components/insurance/sparql-explorer-view';
import { GarantiesView } from '@/components/insurance/garanties-view';
import { SinistresView } from '@/components/insurance/sinistres-view';
import { AuthModal } from '@/components/auth-modal';
import { LandingPage } from '@/components/landing-page';
import { listContrats } from '@/lib/services/contrats';
import { listPersonnes } from '@/lib/services/personnes';
import { me } from '@/lib/services/auth';
import { userSessionSchema } from '@/lib/schemas/auth';
import type { UserRole, UserSession } from '@/lib/types/auth';

function parseStoredSession(saved: string): UserSession | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    console.warn('Storage access error:', error);
    return undefined;
  }
  const result = userSessionSchema.safeParse(parsed);
  return result.success && result.data.isConnected ? result.data : undefined;
}

function setBrowserCookie(value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    globalThis.Document.prototype,
    'cookie'
  )?.set;
  if (!setter) throw new Error('Browser cookie API is unavailable');
  setter.call(globalThis.document, value);
}

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Security & Authentication State
  const [user, setUser] = useState<UserSession | undefined>(() => {
    if (globalThis.window === undefined) return;
    const saved = globalThis.localStorage.getItem('hestia_session');
    if (!saved) return;
    return parseStoredSession(saved);
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const personnesQuery = useQuery({
    queryKey: ['personnes'],
    queryFn: listPersonnes,
    enabled: Boolean(user?.token),
  });
  const contratsQuery = useQuery({
    queryKey: ['contrats'],
    queryFn: listContrats,
    enabled: Boolean(user?.token),
  });
  const roleQuery = useQuery({
    queryKey: ['current-user', user?.token],
    queryFn: () => me(user?.token),
    enabled: Boolean(user?.token),
    refetchInterval: 4000,
  });

  const displayUser =
    user && roleQuery.data ? { ...user, role: roleQuery.data.role } : user;
  const visiblePersonnes = personnesQuery.data ?? [];
  const visibleContrats = contratsQuery.data ?? [];
  const scopedPersonnes =
    displayUser?.role === 'Expert'
      ? visiblePersonnes.filter((personne) => personne.type === 'Assure')
      : displayUser?.role === 'Agent'
        ? visiblePersonnes.filter(
            (personne) =>
              personne.type === 'Assure' || personne.type === 'Beneficiaire'
          )
        : visiblePersonnes;
  const scopedContrats =
    displayUser?.role === 'Assure'
      ? visibleContrats.filter(
          (contrat) =>
            contrat.assure === displayUser.ontology_id ||
            contrat.assure === 'Assure1'
        )
      : visibleContrats;

  // Auth Handlers
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setUser(undefined);
    localStorage.removeItem('hestia_session');
    setBrowserCookie('hestia-token=; Max-Age=0; Path=/');
    setBrowserCookie('hestia-role=; Max-Age=0; Path=/');
    setCurrentTab('dashboard');
  };

  const handleAuthSuccess = (userData: {
    name: string;
    email: string;
    isConnected: boolean;
    role: UserRole;
    token: string;
    ontology_id?: string;
  }) => {
    const session: UserSession = {
      name: userData.name,
      email: userData.email,
      isConnected: true,
      role: userData.role,
      token: userData.token,
      ontology_id: userData.ontology_id,
    };
    setUser(session);
    localStorage.setItem('hestia_session', JSON.stringify(session));
    setBrowserCookie(
      `hestia-token=${encodeURIComponent(userData.token)}; Path=/; SameSite=Lax`
    );
    setBrowserCookie(
      `hestia-role=${encodeURIComponent(userData.role)}; Path=/; SameSite=Lax`
    );
  };

  // Show landing page if not authenticated
  if (!user || !user.isConnected) {
    return (
      <>
        <LandingPage
          onLogin={() => handleOpenAuth('login')}
          onSignup={() => handleOpenAuth('signup')}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="bg-muted/60 text-foreground dark:bg-background dark:text-foreground flex min-h-screen flex-col font-sans antialiased">
      {/* Header with Role Badge and Security controls */}
      <Header
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onSelectTab={setCurrentTab}
      />

      {/* Main app container */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:flex-row">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          personnesCount={scopedPersonnes.length}
          contratsCount={scopedContrats.length}
          userRole={user?.role || 'Assure'}
        />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardView onSelectTab={setCurrentTab} userRole={user?.role} />
          )}

          {currentTab === 'personnes' && (
            <PersonnesView userRole={user?.role} currentUser={user} />
          )}

          {currentTab === 'contrats' && (
            <ContratsView
              userRole={user?.role}
              userOntologyId={user?.ontology_id}
              currentUser={user}
            />
          )}

          {currentTab === 'sinistres' && (
            <SinistresView userRole={user?.role} />
          )}

          {currentTab === 'garanties' && (
            <GarantiesView userRole={user?.role} />
          )}

          {currentTab === 'sparql' && (
            <SemanticWebView userRole={user?.role || 'Assure'} />
          )}

          {currentTab === 'sparql-explorer' && (
            <SparqlExplorerView userRole={user?.role || 'Assure'} />
          )}
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
