'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/insurance/header';
import { Sidebar } from '@/components/insurance/sidebar';
import { DashboardView } from '@/components/insurance/dashboard-view';
import { PersonnesView } from '@/components/insurance/personnes-view';
import { ContratsView } from '@/components/insurance/contrats-view';
import { SemanticWebView } from '@/components/insurance/semantic-web-view';
import { SparqlExplorerView } from '@/components/insurance/sparql-explorer-view';
import { AuthModal } from '@/components/insurance/auth-modal';
import { LandingPage } from '@/components/insurance/landing-page';

interface UserSession {
  name: string;
  email: string;
  isConnected: boolean;
  role: string;
  token?: string;
  ontology_id?: string;
}

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [personnesCount, setPersonnesCount] = useState<number>(4);
  const [assuresCount, setAssuresCount] = useState<number>(4);
  const [contratsCount, setContratsCount] = useState<number>(3);

  // Security & Authentication State
  const [user, setUser] = useState<UserSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [roleNotification, setRoleNotification] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Load session from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hestia_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if actually connected
        if (parsed.isConnected) {
          setUser(parsed);
        }
      }
      // No default demo session — user must log in explicitly
    } catch (e) {
      console.warn("Storage access error:", e);
    }
  }, []);

  // Live Role Sync: automatically update UI when Admin approves promotion or changes role
  useEffect(() => {
    if (!user?.token) return;

    const checkRoleSync = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/ontology/auth/me`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (res.ok) {
          const fresh = await res.json();
          if (fresh.role && fresh.role !== user.role) {
            const oldRole = user.role;
            const updated = { ...user, role: fresh.role };
            setUser(updated);
            localStorage.setItem('hestia_session', JSON.stringify(updated));
            setRoleNotification(
              `🎉 Félicitations ! Votre rôle a été mis à jour de "${oldRole}" à "${fresh.role}". Votre interface a été automatiquement actualisée avec vos nouvelles habilitations.`
            );
          }
        }
      } catch {}
    };

    checkRoleSync();
    const interval = setInterval(checkRoleSync, 4000);
    return () => clearInterval(interval);
  }, [user?.token, user?.role, apiUrl]);

  // Fetch counts from backend (scoped strictly to what the current user can see)
  useEffect(() => {
    // 1. Personnes count scoped by role
    fetch(`${apiUrl}/api/ontology/personnes`)
      .then(res => res.ok ? res.json() : [])
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        if (user?.role === 'Expert') {
          // Expert sees only real Assurés
          const visible = data.filter((p: any) => {
            const role = p.type || (p.personne.includes('Agent') ? 'Agent' : p.personne.includes('Expert') ? 'Expert' : 'Assure');
            return role === 'Assure';
          });
          setPersonnesCount(visible.length);
        } else if (user?.role === 'Agent') {
          // Agent sees only clients
          const visible = data.filter((p: any) => {
            const role = p.type || (p.personne.includes('Agent') ? 'Agent' : p.personne.includes('Expert') ? 'Expert' : 'Assure');
            return role === 'Assure' || role === 'Beneficiaire';
          });
          setPersonnesCount(visible.length);
        } else {
          setPersonnesCount(data.length);
        }
      })
      .catch(() => {});

    // 2. Contrats count scoped by role
    fetch(`${apiUrl}/api/ontology/contrats`)
      .then(res => res.ok ? res.json() : [])
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        if (user?.role === 'Assure') {
          const visible = data.filter((c: any) =>
            c.assure === user.ontology_id ||
            c.assure === 'Assure1' ||
            (user.name && (c.assure || '').toLowerCase().includes(user.name.split(' ').pop()?.toLowerCase() || ''))
          );
          setContratsCount(visible.length);
        } else {
          setContratsCount(data.length);
        }
      })
      .catch(() => {});
  }, [apiUrl, user?.role, user?.ontology_id, user?.name]);

  // Auth Handlers
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hestia_session');
    setCurrentTab('dashboard');
  };

  const handleAuthSuccess = (userData: {
    name: string;
    email: string;
    isConnected: boolean;
    role: string;
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
    <div className="min-h-screen bg-zinc-100/60 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50 flex flex-col">
      {/* Header with Role Badge and Security controls */}
      <Header
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onSelectTab={setCurrentTab}
      />

      {/* Main app container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          personnesCount={personnesCount}
          contratsCount={contratsCount}
          userRole={user?.role || 'Assure'}
        />

        {/* Content area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Notification Banner when user role changes (e.g. Assuré promoted to Agent) */}
          {roleNotification && (
            <div className="mb-6 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 p-4 text-emerald-900 dark:border-emerald-700 dark:text-emerald-200 flex items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎖️</span>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  {roleNotification}
                </p>
              </div>
              <button
                onClick={() => setRoleNotification(null)}
                className="shrink-0 rounded-xl bg-emerald-600/15 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-600/25 dark:text-emerald-200 transition-colors"
              >
                Compris
              </button>
            </div>
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              onSelectTab={setCurrentTab}
              userRole={user?.role}
            />
          )}

          {currentTab === 'personnes' && (
            <PersonnesView
              userRole={user?.role}
              currentUser={user}
              onCountChange={setPersonnesCount}
            />
          )}

          {currentTab === 'contrats' && (
            <ContratsView
              userRole={user?.role}
              userOntologyId={user?.ontology_id}
              currentUser={user}
              onCountChange={setContratsCount}
            />
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
