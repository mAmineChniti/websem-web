'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export function AssistantView({ openClaimModal }: { openClaimModal: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: "Bonjour Alexandre ! Je suis Hestia, votre assistante d'assurance habitation intelligente. Je peux vous aider à comprendre vos garanties, vous guider lors d'une déclaration de sinistre ou vous conseiller sur la prévention climatique.",
      timestamp: 'À l’instant',
      suggestions: [
        '💧 Fuite d’eau : premiers réflexes',
        '⚡ Franchise applicable sur mes contrats',
        '🌪️ Démarche Catastrophe Naturelle',
        '📋 Télécharger une attestation',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const predefinedAnswers: Record<string, string> = {
    '💧 Fuite d’eau : premiers réflexes':
      "En cas de fuite d'eau urgente : \n1. Coupez immédiatement l'arrivée d'eau générale de votre logement.\n2. Si la fuite vient du voisin du dessus, prévenez-le sans tarder.\n3. Prenez des photos des dégâts avant tout nettoyage.\n4. Remplissez le constat amiable de dégât des eaux avec le tiers.\n5. Déclarez le sinistre sur votre portail dans les 5 jours ouvrés. Notre assistance serrurerie/plomberie 24/7 est joignable au 0 800 404 000.",
    '⚡ Franchise applicable sur mes contrats':
      "Sur votre **Appartement Parisien (Formule Tous Risques)**, votre franchise générale est de **120 €**.\nSur votre **Maison de Bordeaux (Formule Sérénité)**, elle est de **150 €**.\nSur votre **Studio de Nice (Formule Essentielle)**, elle est de **180 €**.\nÀ noter : pour les Catastrophes Naturelles, la franchise légale fixée par l'État est de 380 € pour les habitations.",
    '🌪️ Démarche Catastrophe Naturelle':
      "Pour qu'un sinistre soit qualifié de Catastrophe Naturelle (ex: inondation majeure, sécheresse/argile), un arrêté interministériel doit être publié au Journal Officiel pour votre commune.\nVous disposez alors de **30 jours** à compter de la publication pour nous transmettre votre déclaration. Votre contrat Hestia inclut automatiquement la garantie CatNat.",
    '📋 Télécharger une attestation':
      "Vous pouvez télécharger votre attestation d'assurance habitation directement depuis l'onglet **Contrats & Garanties**. Elle est immédiatement reconnue par votre bailleur, syndic ou notaire.",
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = predefinedAnswers[query];

      if (!replyText) {
        if (query.toLowerCase().includes('sinistre') || query.toLowerCase().includes('declarer')) {
          replyText = "Pour déclarer votre sinistre, vous pouvez cliquer sur le bouton 'Déclarer un sinistre' dans la barre latérale ou en haut de la page. Notre formulaire en 3 étapes vous guidera pas à pas.";
        } else if (query.toLowerCase().includes('prix') || query.toLowerCase().includes('tarif') || query.toLowerCase().includes('cotisation')) {
          replyText = "Votre cotisation globale actuelle est de 91,50 € / mois pour l'ensemble de vos 3 logements couverts, avec prélèvement automatique chaque 5 du mois.";
        } else if (query.toLowerCase().includes('ontologie') || query.toLowerCase().includes('semantique') || query.toLowerCase().includes('websem')) {
          replyText = "Le système Hestia Assur s'appuie sur une ontologie sémantique (OWL/RDF) modélisant les concepts : `PolicyHolder`, `InsuredProperty`, `RiskZone`, `ClaimIncident` et `InsuranceContract`. Les relations d'inférence permettent de vérifier automatiquement votre éligibilité aux garanties selon la géolocalisation et l'historique météo !";
        } else {
          replyText = `Merci pour votre question à propos de : "${query}". En tant qu'assuré Hestia Formule Tous Risques, vous bénéficiez de notre assistance prioritaire 24h/24 au 0 800 404 000 ainsi que du suivi en ligne en temps réel.`;
        }
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-purple-800 via-indigo-900 to-zinc-900 p-6 text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200 border border-purple-400/30">
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            <span>Assistant Sémantique & Expert Habitation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Assistant Intelligent Hestia
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/90 max-w-xl">
            Posez toutes vos questions sur vos garanties, la prévention des aléas climatiques ou les démarches en cas de dégâts.
          </p>
        </div>

        <button
          onClick={openClaimModal}
          className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors shadow-md"
        >
          Déclarer un sinistre guidé
        </button>
      </div>

      {/* Chat Window */}
      <div className="flex flex-col h-[520px] rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                <span
                  className={`block text-[10px] ${
                    m.sender === 'user' ? 'text-purple-200 text-right' : 'text-zinc-400'
                  }`}
                >
                  {m.timestamp}
                </span>

                {m.suggestions && (
                  <div className="pt-2 flex flex-wrap gap-1.5 border-t border-zinc-200 dark:border-zinc-700">
                    {m.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(sug)}
                        className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-purple-700 shadow-sm hover:bg-purple-50 dark:bg-zinc-900 dark:text-purple-300 dark:hover:bg-zinc-800 border border-purple-200 dark:border-purple-900"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-white shadow dark:bg-zinc-700">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-center text-xs text-zinc-400">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-2xl">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question sur votre assurance habitation, une franchise, une démarche..."
              className="flex-1 rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
