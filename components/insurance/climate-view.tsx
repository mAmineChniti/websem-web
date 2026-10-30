'use client';

import React, { useState } from 'react';
import { 
  CloudSun, 
  AlertTriangle, 
  Droplets, 
  Wind, 
  Flame, 
  ShieldCheck, 
  MapPin, 
  Info,
  CheckCircle2,
  BellRing
} from 'lucide-react';
import { ClimateRisk } from '@/lib/insurance-data';

interface ClimateViewProps {
  climateRisks: ClimateRisk[];
}

export function ClimateView({ climateRisks }: ClimateViewProps) {
  const [selectedZoneId, setSelectedZoneId] = useState(climateRisks[0]?.id || '');
  const activeRisk = climateRisks.find((r) => r.id === selectedZoneId) || climateRisks[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-teal-800 via-cyan-900 to-zinc-900 p-6 text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-200 border border-teal-400/30">
            <CloudSun className="h-3.5 w-3.5" />
            <span>Observatoire Météorologique & Risques Naturels</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Zones & Résilience Climatique
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl">
            Suivi des aléas naturels (inondations, argiles RGA, tempêtes, sécheresses) sur vos zones géographiques assurées pour prévenir les sinistres.
          </p>
        </div>

        {/* Live Vigilance Badge */}
        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/20 text-center sm:text-right shrink-0">
          <div className="text-[11px] text-teal-200 uppercase font-semibold">Météo France / CatNat</div>
          <div className="text-lg font-bold text-amber-300 flex items-center justify-center sm:justify-end gap-1.5 mt-0.5">
            <BellRing className="h-4 w-4 animate-bounce" />
            <span>Vigilance Jaune Active</span>
          </div>
          <span className="text-[11px] text-teal-100/70">Valide jusqu'à demain 12:00</span>
        </div>
      </div>

      {/* Zone Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {climateRisks.map((cr) => {
          const isSelected = cr.id === activeRisk?.id;
          return (
            <button
              key={cr.id}
              onClick={() => setSelectedZoneId(cr.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20 shadow dark:border-teal-500 dark:bg-teal-950/20'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-zinc-500">{cr.postalCode}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  cr.currentAlert?.level === 'Jaune'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  Alerte {cr.currentAlert?.level}
                </span>
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{cr.zoneName}</h3>
              <div className="mt-2 text-xs text-zinc-500">
                Score d'exposition globale : <strong className="text-teal-700 dark:text-teal-400">{cr.overallScore}/100</strong>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Zone Detail Card */}
      {activeRisk && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-600" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                  {activeRisk.zoneName}
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Diagnostic des risques majeurs basé sur les données Géorisques & Bureau de Recherches Géologiques et Minières (BRGM)
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Info className="h-3.5 w-3.5" />
              <span>Garantie Catastrophes Naturelles incluse</span>
            </div>
          </div>

          {/* Current Alert Details */}
          {activeRisk.currentAlert && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {activeRisk.currentAlert.type} (Niveau {activeRisk.currentAlert.level})
                </span>
                <p className="text-amber-800 dark:text-amber-300">
                  {activeRisk.currentAlert.description}
                </p>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 block pt-0.5">
                  Fin estimée : {activeRisk.currentAlert.validUntil}
                </span>
              </div>
            </div>
          )}

          {/* Risk Factors Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Flood */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Inondation</span>
                <Droplets className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeRisk.floodRisk}%
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${activeRisk.floodRisk}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-400 block">Crue décennale & ruissellement</span>
            </div>

            {/* Clay shrinkage */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Sécheresse / Argiles (RGA)</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeRisk.droughtClayRisk}%
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: `${activeRisk.droughtClayRisk}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-400 block">Risque fissuration fondations</span>
            </div>

            {/* Storm wind */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Tempête & Rafales</span>
                <Wind className="h-4 w-4 text-teal-500" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeRisk.stormWindRisk}%
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-2 rounded-full bg-teal-500"
                  style={{ width: `${activeRisk.stormWindRisk}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-400 block">Exposition vents océaniques</span>
            </div>

            {/* Wildfire */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Incendie / Végétation</span>
                <Flame className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeRisk.wildfireRisk}%
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-2 rounded-full bg-red-500"
                  style={{ width: `${activeRisk.wildfireRisk}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-400 block">Proximité massifs forestiers</span>
            </div>
          </div>

          {/* Recommendations and Prevention checklist */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Actions de Prévention Recommandées pour ce Secteur</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeRisk.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 text-xs flex items-start gap-2.5 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
