'use client';

import React, { useState } from 'react';
import { X, Home, Building2, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { Property } from '@/lib/insurance-data';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newProperty: Property) => void;
}

export function AddPropertyModal({ isOpen, onClose, onSubmit }: AddPropertyModalProps) {
  const [name, setName] = useState('Résidence des Pins');
  const [type, setType] = useState<Property['type']>('Appartement');
  const [address, setAddress] = useState('24 Rue de la République');
  const [city, setCity] = useState('Lyon');
  const [postalCode, setPostalCode] = useState('69002');
  const [surface, setSurface] = useState(65);
  const [rooms, setRooms] = useState(3);
  const [yearBuilt, setYearBuilt] = useState(2015);
  const [isMainResidence, setIsMainResidence] = useState(true);
  const [insuredValue, setInsuredValue] = useState(280000);

  if (!isOpen) return null;

  // Live estimated insurance premium
  const estimatedMonthlyPremium = Math.round((surface * 0.28 + rooms * 3 + (insuredValue / 50000) * 1.5) * 10) / 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      name,
      type,
      address,
      city,
      postalCode,
      surface: Number(surface),
      rooms: Number(rooms),
      yearBuilt: Number(yearBuilt),
      isMainResidence,
      insuredValue: Number(insuredValue),
      status: 'Actif',
      riskScore: Math.floor(20 + Math.random() * 30),
      climateRiskLevel: surface > 100 ? 'Modéré' : 'Faible',
      features: ['Détecteur de fumée NF', 'Digicode', 'Fenêtres double vitrage'],
      occupants: [{ name: 'Alexandre Dupont', role: 'Souscripteur principal' }],
    };
    onSubmit(newProperty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif">Assurer un Nouveau Logement</h2>
              <p className="text-xs text-emerald-100">Calcul immédiat du tarif et éligibilité aux garanties</p>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nom du logement
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Appartement Centre-Ville"
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Type de bien
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="Appartement">Appartement</option>
                <option value="Maison individuelle">Maison individuelle</option>
                <option value="Studio">Studio</option>
                <option value="Villa">Villa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Adresse postale
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Numéro et rue"
              className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Ville
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Code postal
              </label>
              <input
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Surface (m²)
              </label>
              <input
                type="number"
                min="10"
                value={surface}
                onChange={(e) => setSurface(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Pièces
              </label>
              <input
                type="number"
                min="1"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Année constr.
              </label>
              <input
                type="number"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={isMainResidence}
                onChange={(e) => setIsMainResidence(e.target.checked)}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700"
              />
              <span>Résidence principale de l'assuré</span>
            </label>
          </div>

          {/* Live Quote Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Estimation de votre cotisation</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Formule Tous Risques + Assistance 24/7 incluse
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {estimatedMonthlyPremium} €
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400"> / mois</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <span>Valider & Couvrir ce logement</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
