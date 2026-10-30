'use client';

import React, { useState } from 'react';
import { 
  Home, 
  PlusCircle, 
  User, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  Key,
  Users
} from 'lucide-react';
import { Property } from '@/lib/insurance-data';

interface PropertiesViewProps {
  properties: Property[];
  openAddPropertyModal: () => void;
  onSelectTab: (tab: string) => void;
}

export function PropertiesView({
  properties,
  openAddPropertyModal,
  onSelectTab,
}: PropertiesViewProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const activeProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-serif">
              Habitations & Assurés
            </h1>
            <p className="text-xs text-zinc-500">
              Inventaire de vos logements couverts, diagnostics et liste des personnes protégées
            </p>
          </div>
        </div>

        <button
          onClick={openAddPropertyModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Assurer une nouvelle habitation</span>
        </button>
      </div>

      {/* Property Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {properties.map((prop) => {
          const isSelected = prop.id === activeProperty?.id;
          return (
            <div
              key={prop.id}
              onClick={() => setSelectedPropertyId(prop.id)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20 shadow-md dark:border-emerald-500 dark:bg-emerald-950/20'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {prop.type}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  prop.isMainResidence
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {prop.isMainResidence ? 'Résidence principale' : 'Résidence secondaire'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{prop.name}</h3>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{prop.address}, {prop.city} ({prop.postalCode})</span>
              </p>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{prop.surface} m² • {prop.rooms} pièces</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {(prop.insuredValue).toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed View of Active Property */}
      {activeProperty && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                  {activeProperty.name}
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Garantie Tous Risques Active
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {activeProperty.address}, {activeProperty.postalCode} {activeProperty.city}
              </p>
            </div>

            <button
              onClick={() => onSelectTab('contracts')}
              className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Consulter le contrat de cette habitation &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Characteristics */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Caractéristiques du bien
              </span>
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Surface habitable :</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeProperty.surface} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nombre de pièces principales :</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeProperty.rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Année de construction :</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeProperty.yearBuilt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Capital mobilier garanti :</span>
                  <span className="font-semibold text-emerald-600">{(activeProperty.insuredValue * 0.15).toLocaleString('fr-FR')} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Valeur immobilière assurée :</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{(activeProperty.insuredValue).toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>

            {/* Security and Equipment */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Équipements & Sécurité
              </span>
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2">
                {activeProperty.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500">
                  <span className="font-semibold text-emerald-600">Avantage franchise :</span> -10% grâce à la conformité des serrures A2P.
                </div>
              </div>
            </div>

            {/* Occupants & Policyholders */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Assurés & Personnes Couvertes
              </span>
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2.5">
                {activeProperty.occupants.map((occ, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] dark:bg-emerald-950 dark:text-emerald-300">
                        {occ.name[0]}
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">{occ.name}</span>
                        <span className="text-[10px] text-zinc-500">{occ.role}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full dark:bg-emerald-950/60 dark:text-emerald-300">
                      Protégé
                    </span>
                  </div>
                ))}

                <button
                  onClick={() => alert("Ajout d'un nouvel occupant envoyé pour mise à jour de l'attestation")}
                  className="w-full mt-2 rounded-xl border border-dashed border-zinc-300 py-1.5 text-center text-xs font-medium text-zinc-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400 transition-colors"
                >
                  + Ajouter un co-assuré / enfant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
