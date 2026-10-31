'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/insurance/header';
import { Sidebar } from '@/components/insurance/sidebar';
import { DashboardView } from '@/components/insurance/dashboard-view';
import { PersonnesView } from '@/components/insurance/personnes-view';
import { ContratsView } from '@/components/insurance/contrats-view';
import { SemanticWebView } from '@/components/insurance/semantic-web-view';
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
  const [contratsCount, setContratsCount] = useState<number>(3);

  // Security & Authentication State
  const [user, setUser] = useState<UserSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

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

  // Fetch counts from backend
  useEffect(() => {
    fetch(`${apiUrl}/api/ontology/stats`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch stats');
      })
      .then((data) => {
        if (data.personnes_count) setPersonnesCount(data.personnes_count);
        if (data.contrats_count) setContratsCount(data.contrats_count);
      })
      .catch((err) => {
        console.warn("Could not fetch ontology stats:", err);
      });
  }, [apiUrl]);

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
            />
          )}

          {currentTab === 'contrats' && (
            <ContratsView
              userRole={user?.role}
              userOntologyId={user?.ontology_id}
              currentUser={user}
            />
          )}

          {currentTab === 'sparql' && (
            <SemanticWebView userRole={user?.role || 'Assure'} />
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
