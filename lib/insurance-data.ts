export interface Property {
  id: string;
  name: string;
  type: 'Appartement' | 'Maison individuelle' | 'Studio' | 'Villa';
  address: string;
  city: string;
  postalCode: string;
  surface: number; // m²
  rooms: number;
  yearBuilt: number;
  isMainResidence: boolean;
  insuredValue: number; // in €
  status: 'Actif' | 'En attente' | 'Suspendu';
  riskScore: number; // 0-100
  climateRiskLevel: 'Faible' | 'Modéré' | 'Élevé';
  features: string[];
  occupants: {
    name: string;
    role: 'Souscripteur principal' | 'Conjoint' | 'Enfant' | 'Colocataire';
  }[];
}

export interface Claim {
  id: string;
  claimNumber: string;
  propertyId: string;
  propertyName: string;
  type: 'Dégât des eaux' | 'Incendie' | 'Vol & Vandalisme' | 'Bris de glace' | 'Catastrophe Naturelle' | 'Tempête';
  dateReported: string;
  dateIncident: string;
  status: 'Déclaré' | 'Expertise en cours' | 'Validation devis' | 'Indemnisé' | 'Clos';
  estimatedCost: number;
  indemnifiedAmount?: number;
  deductible: number; // franchise
  description: string;
  severity: 'Faible' | 'Moyenne' | 'Critique';
  expertAssigned?: string;
}

export interface Contract {
  id: string;
  policyNumber: string;
  propertyId: string;
  propertyName: string;
  planName: 'Formule Essentielle' | 'Formule Sérénité' | 'Formule Tous Risques Intégrale';
  startDate: string;
  renewalDate: string;
  monthlyPremium: number;
  annualPremium: number;
  deductibleGeneral: number;
  coverageLimits: {
    propertyDamage: number;
    personalProperty: number;
    civilLiability: number;
    legalProtection: boolean;
    relocationCost: number;
  };
  options: string[];
}

export interface ClimateRisk {
  id: string;
  zoneName: string;
  postalCode: string;
  floodRisk: number; // 0-100
  droughtClayRisk: number; // retrait-gonflement des argiles
  stormWindRisk: number;
  wildfireRisk: number;
  overallScore: number;
  currentAlert?: {
    level: 'Vert' | 'Jaune' | 'Orange' | 'Rouge';
    type: string;
    description: string;
    validUntil: string;
  };
  recommendations: string[];
}

export const initialProperties: Property[] = [
  {
    id: 'prop-1',
    name: 'Appartement Haussmannien',
    type: 'Appartement',
    address: '42 Avenue des Gobelins',
    city: 'Paris',
    postalCode: '75013',
    surface: 88,
    rooms: 4,
    yearBuilt: 1910,
    isMainResidence: true,
    insuredValue: 450000,
    status: 'Actif',
    riskScore: 24,
    climateRiskLevel: 'Faible',
    features: ['Détecteur de fumée NF', 'Porte blindée A2P', 'Digicode & Interphone', '2e étage'],
    occupants: [
      { name: 'Alexandre Dupont', role: 'Souscripteur principal' },
      { name: 'Camille Martin', role: 'Conjoint' },
    ],
  },
  {
    id: 'prop-2',
    name: 'Maison de Ville avec Jardin',
    type: 'Maison individuelle',
    address: '15 Rue des Lilas',
    city: 'Bordeaux',
    postalCode: '33000',
    surface: 145,
    rooms: 6,
    yearBuilt: 2008,
    isMainResidence: false,
    insuredValue: 620000,
    status: 'Actif',
    riskScore: 58,
    climateRiskLevel: 'Élevé',
    features: ['Alarme connectée télésurveillance', 'Volets roulants anti-effraction', 'Arrosage automatique', 'Jardin clos'],
    occupants: [
      { name: 'Alexandre Dupont', role: 'Souscripteur principal' },
      { name: 'Lucas Dupont', role: 'Enfant' },
    ],
  },
  {
    id: 'prop-3',
    name: 'Studio Vue Mer',
    type: 'Studio',
    address: '8 Promenade des Anglais',
    city: 'Nice',
    postalCode: '06000',
    surface: 32,
    rooms: 1,
    yearBuilt: 2016,
    isMainResidence: false,
    insuredValue: 180000,
    status: 'Actif',
    riskScore: 45,
    climateRiskLevel: 'Modéré',
    features: ['Climatisation réversible', 'Détecteur fumée connecté', 'Ascenseur'],
    occupants: [
      { name: 'Alexandre Dupont', role: 'Souscripteur principal' },
    ],
  },
];

export const initialClaims: Claim[] = [
  {
    id: 'clm-1',
    claimNumber: 'SIN-2026-0842',
    propertyId: 'prop-2',
    propertyName: 'Maison de Ville avec Jardin (Bordeaux)',
    type: 'Dégât des eaux',
    dateReported: '18 Octobre 2026',
    dateIncident: '17 Octobre 2026',
    status: 'Expertise en cours',
    estimatedCost: 3450,
    deductible: 150,
    description: 'Infiltration d’eau constatée au plafond de la cuisine suite à une fuite sur canalisation encastrée à l’étage.',
    severity: 'Moyenne',
    expertAssigned: 'Cabinet Expertises Aquitaine (M. Bernard V.)',
  },
  {
    id: 'clm-2',
    claimNumber: 'SIN-2026-0519',
    propertyId: 'prop-1',
    propertyName: 'Appartement Haussmannien (Paris)',
    type: 'Bris de glace',
    dateReported: '04 Août 2026',
    dateIncident: '03 Août 2026',
    status: 'Indemnisé',
    estimatedCost: 820,
    indemnifiedAmount: 670,
    deductible: 150,
    description: 'Fissure traversante sur baie vitrée salon suite à une rafale de vent lors d’un orage estival.',
    severity: 'Faible',
    expertAssigned: 'Remplacement agréé GlassAssur',
  },
  {
    id: 'clm-3',
    claimNumber: 'SIN-2025-1102',
    propertyId: 'prop-2',
    propertyName: 'Maison de Ville avec Jardin (Bordeaux)',
    type: 'Tempête',
    dateReported: '12 Décembre 2025',
    dateIncident: '11 Décembre 2025',
    status: 'Clos',
    estimatedCost: 1950,
    indemnifiedAmount: 1800,
    deductible: 150,
    description: 'Déplacement de 15 tuiles sur versant ouest de la toiture et dégradation partielle de la gouttière zinc.',
    severity: 'Moyenne',
    expertAssigned: 'Clôturé avec succès',
  },
];

export const initialContracts: Contract[] = [
  {
    id: 'cnt-1',
    policyNumber: 'POL-HA-758921',
    propertyId: 'prop-1',
    propertyName: 'Appartement Haussmannien (Paris)',
    planName: 'Formule Tous Risques Intégrale',
    startDate: '01 Janvier 2024',
    renewalDate: '01 Janvier 2027',
    monthlyPremium: 28.50,
    annualPremium: 342.00,
    deductibleGeneral: 120,
    coverageLimits: {
      propertyDamage: 500000,
      personalProperty: 65000,
      civilLiability: 10000000,
      legalProtection: true,
      relocationCost: 15000,
    },
    options: ['Rééquipement à neuf 10 ans', 'Vol de bijoux & objets précieux', 'Assistance serrurerie d’urgence 24h/7j'],
  },
  {
    id: 'cnt-2',
    policyNumber: 'POL-HA-982144',
    propertyId: 'prop-2',
    propertyName: 'Maison de Ville avec Jardin (Bordeaux)',
    planName: 'Formule Sérénité',
    startDate: '15 Mai 2023',
    renewalDate: '15 Mai 2027',
    monthlyPremium: 46.80,
    annualPremium: 561.60,
    deductibleGeneral: 150,
    coverageLimits: {
      propertyDamage: 750000,
      personalProperty: 85000,
      civilLiability: 10000000,
      legalProtection: true,
      relocationCost: 20000,
    },
    options: ['Jardin & Aménagements extérieurs', 'Dégâts climatiques renforcés', 'Dommages électriques & électroménager'],
  },
  {
    id: 'cnt-3',
    policyNumber: 'POL-HA-441209',
    propertyId: 'prop-3',
    propertyName: 'Studio Vue Mer (Nice)',
    planName: 'Formule Essentielle',
    startDate: '10 Septembre 2025',
    renewalDate: '10 Septembre 2027',
    monthlyPremium: 16.20,
    annualPremium: 194.40,
    deductibleGeneral: 180,
    coverageLimits: {
      propertyDamage: 200000,
      personalProperty: 20000,
      civilLiability: 5000000,
      legalProtection: false,
      relocationCost: 8000,
    },
    options: ['Assistance fuite d’eau d’urgence'],
  },
];

export const initialClimateRisks: ClimateRisk[] = [
  {
    id: 'cr-1',
    zoneName: 'Gironde - Bassin Aquitain (Bordeaux)',
    postalCode: '33000',
    floodRisk: 68,
    droughtClayRisk: 74,
    stormWindRisk: 52,
    wildfireRisk: 38,
    overallScore: 65,
    currentAlert: {
      level: 'Jaune',
      type: 'Vents violents & orages locaux',
      description: 'Rafales pouvant atteindre 75 km/h prévues dans la nuit. Vérifiez la fixation des éléments extérieurs.',
      validUntil: 'Demain 12:00',
    },
    recommendations: [
      'Installer des clapets anti-retour sur les évacuations d’eau du sous-sol.',
      'Surveiller l’apparition de micro-fissures liée au retrait-gonflement des argiles.',
      'Élaguer les branches d’arbres à proximité immédiate de la toiture.',
    ],
  },
  {
    id: 'cr-2',
    zoneName: 'Île-de-France - Bassin Parisien (Paris 13e)',
    postalCode: '75013',
    floodRisk: 32,
    droughtClayRisk: 28,
    stormWindRisk: 35,
    wildfireRisk: 5,
    overallScore: 24,
    currentAlert: {
      level: 'Vert',
      type: 'Conditions météorologiques calmes',
      description: 'Aucune alerte majeure en cours.',
      validUntil: '72 prochaines heures',
    },
    recommendations: [
      'Contrôler les joints d’étanchéité des fenêtres exposées au nord.',
      'Tester semestriellement le détecteur de fumée obligatoire.',
    ],
  },
  {
    id: 'cr-3',
    zoneName: 'Alpes-Maritimes - Littoral Méditerranéen (Nice)',
    postalCode: '06000',
    floodRisk: 54,
    droughtClayRisk: 22,
    stormWindRisk: 48,
    wildfireRisk: 62,
    overallScore: 47,
    currentAlert: {
      level: 'Jaune',
      type: 'Vagues-submersion & orages côtiers',
      description: 'Houle modérée attendue sur le littoral.',
      validUntil: 'Ce soir 23:00',
    },
    recommendations: [
      'Fermer hermétiquement les baies vitrées en cas d’épisode orageux méditerranéen.',
      'Débrancher les appareils sensibles en cas d’activité orageuse intense.',
    ],
  },
];
