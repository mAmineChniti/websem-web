'use client';

import React, { useState } from 'react';
import { Header } from '@/components/insurance/header';
import { Sidebar } from '@/components/insurance/sidebar';
import { DashboardView } from '@/components/insurance/dashboard-view';
import { ClaimsView } from '@/components/insurance/claims-view';
import { PropertiesView } from '@/components/insurance/properties-view';
import { ClimateView } from '@/components/insurance/climate-view';
import { ContractsView } from '@/components/insurance/contracts-view';
import { AssistantView } from '@/components/insurance/assistant-view';
import { SemanticWebView } from '@/components/insurance/semantic-web-view';
import { AuthModal } from '@/components/insurance/auth-modal';
import { ClaimDeclarationModal } from '@/components/insurance/claim-declaration-modal';
import { AddPropertyModal } from '@/components/insurance/add-property-modal';
import {
  initialProperties,
  initialClaims,
  initialContracts,
  initialClimateRisks,
  Property,
  Claim,
  Contract,
  ClimateRisk,
} from '@/lib/insurance-data';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [user, setUser] = useState<{ name: string; email: string; isConnected: boolean } | null>({
    name: 'Alexandre Dupont',
    email: 'alexandre.dupont@email.fr',
    isConnected: true,
  });

  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [climateRisks, setClimateRisks] = useState<ClimateRisk[]>(initialClimateRisks);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);

  // Handlers
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setUser({
      name: '',
      email: '',
      isConnected: false,
    });
  };

  const handleAuthSuccess = (userData: { name: string; email: string; isConnected: boolean }) => {
    setUser(userData);
  };

  const handleAddClaim = (newClaim: Claim) => {
    setClaims((prev) => [newClaim, ...prev]);
    setCurrentTab('claims');
  };

  const handleAddProperty = (newProperty: Property) => {
    setProperties((prev) => [newProperty, ...prev]);
    // Also create a linked contract
    const newContract: Contract = {
      id: `cnt-${Date.now()}`,
      policyNumber: `POL-HA-${Math.floor(100000 + Math.random() * 900000)}`,
      propertyId: newProperty.id,
      propertyName: `${newProperty.name} (${newProperty.city})`,
      planName: 'Formule Tous Risques Intégrale',
      startDate: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      renewalDate: '01 Janvier 2028',
      monthlyPremium: Math.round((newProperty.surface * 0.28 + newProperty.rooms * 3) * 10) / 10,
      annualPremium: Math.round((newProperty.surface * 0.28 + newProperty.rooms * 3) * 120),
      deductibleGeneral: 150,
      coverageLimits: {
        propertyDamage: newProperty.insuredValue,
        personalProperty: Math.round(newProperty.insuredValue * 0.15),
        civilLiability: 10000000,
        legalProtection: true,
        relocationCost: 15000,
      },
      options: ['Assistance fuite d’urgence 24/7', 'Garantie Catastrophes Naturelles'],
    };
    setContracts((prev) => [newContract, ...prev]);
    setCurrentTab('properties');
  };

  return (
    <div className="min-h-screen bg-zinc-100/60 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50 flex flex-col">
      {/* Header bar */}
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
          openClaimModal={() => setIsClaimModalOpen(true)}
          openAddPropertyModal={() => setIsAddPropertyModalOpen(true)}
          claimsCount={claims.filter((c) => c.status !== 'Clos').length}
          propertiesCount={properties.length}
        />

        {/* Content area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              properties={properties}
              claims={claims}
              contracts={contracts}
              climateRisks={climateRisks}
              onSelectTab={setCurrentTab}
              openClaimModal={() => setIsClaimModalOpen(true)}
              openAddPropertyModal={() => setIsAddPropertyModalOpen(true)}
            />
          )}

          {currentTab === 'claims' && (
            <ClaimsView
              claims={claims}
              openClaimModal={() => setIsClaimModalOpen(true)}
            />
          )}

          {currentTab === 'properties' && (
            <PropertiesView
              properties={properties}
              openAddPropertyModal={() => setIsAddPropertyModalOpen(true)}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'climate' && (
            <ClimateView climateRisks={climateRisks} />
          )}

          {currentTab === 'contracts' && (
            <ContractsView contracts={contracts} />
          )}

          {currentTab === 'assistant' && (
            <AssistantView openClaimModal={() => setIsClaimModalOpen(true)} />
          )}

          {currentTab === 'semantic' && (
            <SemanticWebView />
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <ClaimDeclarationModal
        isOpen={isClaimModalOpen}
        properties={properties}
        onClose={() => setIsClaimModalOpen(false)}
        onSubmit={handleAddClaim}
      />

      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onSubmit={handleAddProperty}
      />
    </div>
  );
}
