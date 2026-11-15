export type ResourceKey = 'fuel' | 'science' | 'safety' | 'heritage';

export interface EthicalOption {
  id: string;
  label: string;
  shortAction: string;
  badgeTag: string;
  isHistoricalChoice: boolean;
  bonusPoints: number;
  deltas: Record<ResourceKey, number>;
}

export interface EthicalDilemma {
  id: string;
  missionId: string;
  roleTitle: string;
  scenarioTitle: string;
  stakesLine: string;
  baseMeters: Record<ResourceKey, number>;
  options: EthicalOption[];
  historicalOutcome: string;
  citationLabel: string;
  citationUrl: string;
}

export const ETHICAL_DILEMMAS: EthicalDilemma[] = [
  {
    id: 'dilemma-cassini',
    missionId: 'cassini-saturn',
    roleTitle: 'Saturn · 2017',
    scenarioTitle: 'Cassini: Protect Alien Oceans or Save Fuel?',
    stakesLine: 'Enceladus geysers show life-ready chemistry while propellant runs dry.',
    baseMeters: { fuel: 15, science: 78, safety: 55, heritage: 80 },
    options: [
      {
        id: 'opt-cassini-dive',
        label: 'Saturn Plunge',
        shortAction: '22 ring-gap dives, then burn up cleanly at 77,000 mph',
        badgeTag: 'Bio-Shield',
        isHistoricalChoice: true,
        bonusPoints: 150,
        deltas: { fuel: -15, science: +22, safety: +45, heritage: +10 },
      },
      {
        id: 'opt-cassini-park',
        label: 'High Orbit Drift',
        shortAction: 'Leave orbiter unpowered in distant Saturn orbit',
        badgeTag: 'High Risk',
        isHistoricalChoice: false,
        bonusPoints: 60,
        deltas: { fuel: 0, science: -10, safety: -35, heritage: -5 },
      },
      {
        id: 'opt-cassini-land',
        label: 'Titan Touchdown',
        shortAction: 'Attempt unsterilized crash-landing on Titan',
        badgeTag: 'Contamination',
        isHistoricalChoice: false,
        bonusPoints: 40,
        deltas: { fuel: -10, science: +5, safety: -45, heritage: -15 },
      },
    ],
    historicalOutcome:
      'Sept 15, 2017: Cassini plunged into Saturn (9.4° N, 53° W), keeping Enceladus & Titan oceans microbe-free.',
    citationLabel: 'NASA PDS · Cassini Finale',
    citationUrl:
      'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/Cassini/cassini.html',
  },
  {
    id: 'dilemma-grail',
    missionId: 'grail',
    roleTitle: 'Moon · 2012',
    scenarioTitle: 'GRAIL: Target Crash Site or Let Orbits Decay?',
    stakesLine: 'Twin Ebb & Flow orbiters are out of fuel above historic Apollo sites.',
    baseMeters: { fuel: 12, science: 85, safety: 70, heritage: 50 },
    options: [
      {
        id: 'opt-grail-ridge',
        label: 'Target North Ridge',
        shortAction: 'Aim final burns away from Apollo heritage zones',
        badgeTag: 'Heritage Safe',
        isHistoricalChoice: true,
        bonusPoints: 150,
        deltas: { fuel: -12, science: +10, safety: +20, heritage: +48 },
      },
      {
        id: 'opt-grail-decay',
        label: 'Natural Decay',
        shortAction: 'Conserve final radio link and impact randomly',
        badgeTag: 'Site Risk',
        isHistoricalChoice: false,
        bonusPoints: 60,
        deltas: { fuel: 0, science: +2, safety: -15, heritage: -35 },
      },
    ],
    historicalOutcome:
      'Dec 17, 2012: Ebb & Flow impacted safely at 75.62° N, 26.63° W — named in honor of Dr. Sally Ride.',
    citationLabel: 'NASA · GRAIL Impact Site',
    citationUrl: 'https://www.nasa.gov/mission_pages/grail/news/grail20121217.html',
  },
  {
    id: 'dilemma-lcross',
    missionId: 'lcross',
    roleTitle: 'Cabeus · 2009',
    scenarioTitle: 'LCROSS: Crash a 2.2-Ton Rocket for Plume Spectra?',
    stakesLine: 'Cryogenic crater floor has zero sunlight—remote cameras cannot see inside.',
    baseMeters: { fuel: 40, science: 45, safety: 80, heritage: 75 },
    options: [
      {
        id: 'opt-lcross-impact',
        label: 'Dual Kinetic Strike',
        shortAction: 'Throw Centaur stage at 9,000 km/h and scan ejecta plume',
        badgeTag: 'Water Proof',
        isHistoricalChoice: true,
        bonusPoints: 150,
        deltas: { fuel: -40, science: +55, safety: 0, heritage: -5 },
      },
      {
        id: 'opt-lcross-orbit',
        label: 'Passive Flyby',
        shortAction: 'Keep Shepherd orbiter intact for passive shadow scans',
        badgeTag: 'No Ice Data',
        isHistoricalChoice: false,
        bonusPoints: 60,
        deltas: { fuel: +10, science: -20, safety: +10, heritage: +10 },
      },
    ],
    historicalOutcome:
      'Oct 9, 2009: Centaur blasted ice 10 miles into sunlight; LCROSS confirmed ~5.6% water ice before impacting.',
    citationLabel: 'Science · LCROSS Water Plume',
    citationUrl: 'https://www.science.org/doi/10.1126/science.1186986',
  },
  {
    id: 'dilemma-magellan',
    missionId: 'magellan-venus',
    roleTitle: 'Venus · 1994',
    scenarioTitle: 'Magellan: Windmill Aerodynamic Plunge or Silent End?',
    stakesLine: 'Radar mapping is 98% complete and solar panels are failing in orbit.',
    baseMeters: { fuel: 22, science: 72, safety: 90, heritage: 85 },
    options: [
      {
        id: 'opt-magellan-windmill',
        label: 'Windmill Dip',
        shortAction: 'Twist solar panels like paddles to measure air density',
        badgeTag: 'Bonus Data',
        isHistoricalChoice: true,
        bonusPoints: 150,
        deltas: { fuel: -18, science: +28, safety: 0, heritage: +5 },
      },
      {
        id: 'opt-magellan-silent',
        label: 'Quiet Shutoff',
        shortAction: 'Decommission radio before atmospheric drag builds',
        badgeTag: 'Lost Data',
        isHistoricalChoice: false,
        bonusPoints: 60,
        deltas: { fuel: 0, science: -15, safety: +5, heritage: 0 },
      },
    ],
    historicalOutcome:
      'Oct 12–13, 1994: Windmill Experiment quantified Venus upper-atmosphere drag right before vaporization.',
    citationLabel: 'NASA PDS · Magellan Venus',
    citationUrl: 'https://pds-geosciences.wustl.edu/missions/magellan/',
  },
];
