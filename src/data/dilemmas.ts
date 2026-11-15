export interface EthicalOption {
  id: string;
  label: string;
  consequenceSummary: string;
  isHistoricalChoice: boolean;
}

export interface EthicalDilemma {
  id: string;
  missionId: string;
  roleTitle: string;
  scenarioTitle: string;
  briefing: string;
  scientificStakes: string;
  options: EthicalOption[];
  historicalOutcome: string;
  ethicalReasoning: string;
  citationLabel: string;
  citationUrl: string;
}

export const ETHICAL_DILEMMAS: EthicalDilemma[] = [
  {
    id: 'dilemma-cassini',
    missionId: 'cassini-saturn',
    roleTitle: 'Cassini End-of-Mission Director · 2017',
    scenarioTitle: 'Protect an Alien Ocean or Leave a Healthy Orbiter?',
    briefing:
      'Cassini’s instruments remain fully functional after 13 years at Saturn, but hydrazine propellant is nearly depleted. Your own spectrometer just confirmed hydrothermal hydrogen and organics erupting from Enceladus’s global ocean, alongside liquid seas on Titan.',
    scientificStakes:
      'If Cassini runs dry in an unguided Saturnian orbit, gravitational nudges over decades could send the spacecraft crashing into Enceladus or Titan—potentially seeding dormant Earth microbes into a habitable ocean.',
    options: [
      {
        id: 'opt-cassini-dive',
        label: 'Sacrifice Cassini into Saturn’s Atmosphere',
        consequenceSummary:
          'Execute 22 risky ring-gap dives, then deliberately vaporize the 2,150 kg flagship in Saturn’s crushing atmosphere while beaming final data.',
        isHistoricalChoice: true,
      },
      {
        id: 'opt-cassini-park',
        label: 'Leave Cassini Drifting in High Saturn Orbit',
        consequenceSummary:
          'Save remaining fuel to listen longer, accepting a small long-term probability of orbital perturbation into Enceladus or Titan.',
        isHistoricalChoice: false,
      },
      {
        id: 'opt-cassini-land',
        label: 'Attempt an Unsterilized Landing on Titan',
        consequenceSummary:
          'Gain close-up surface telemetry, but violate planetary protection rules against contaminating hydrocarbon seas.',
        isHistoricalChoice: false,
      },
    ],
    historicalOutcome:
      'NASA chose controlled atmospheric destruction. On September 15, 2017, Cassini plunged into Saturn at 77,000 mph (9.4° N, 53° W), holding its antenna toward Earth until aerodynamic torque broke contact.',
    ethicalReasoning:
      'Planetary protection ethics prioritize preserving pristine extraterrestrial environments over extending hardware life. Once an ocean world is contaminated by terrestrial spores, future biosignature detection can never be unambiguous.',
    citationLabel: 'NASA PDS Atmospheres: Cassini Grand Finale Archive',
    citationUrl:
      'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/Cassini/cassini.html',
  },
  {
    id: 'dilemma-grail',
    missionId: 'grail',
    roleTitle: 'GRAIL Mission Manager · December 2012',
    scenarioTitle: 'Where Do Twin Gravity Orbiters Crash When Fuel Runs Out?',
    briefing:
      'Twin orbiters Ebb and Flow (400 kg combined) have mapped the Moon’s gravity field to unprecedented precision, revealing a fractured crust. Propellant is exhausted, and low lunar orbits will decay unpredictably within weeks.',
    scientificStakes:
      'The Moon has no biological oceans to contaminate, yet it holds irreplaceable human exploration heritage—including Apollo landing sites—and future scientific baselines.',
    options: [
      {
        id: 'opt-grail-ridge',
        label: 'Direct Both Orbiters into a Selected Northern Mountain Ridge',
        consequenceSummary:
          'Spend final wisps of fuel to steer Ebb and Flow into an unvisited slope near Goldschmidt crater, far from historical Apollo sites.',
        isHistoricalChoice: true,
      },
      {
        id: 'opt-grail-decay',
        label: 'Let Orbits Decay Naturally Wherever Gravity Pulls Them',
        consequenceSummary:
          'Conserve zero-value telemetry for a few extra days while risking random surface impact near sensitive heritage zones.',
        isHistoricalChoice: false,
      },
    ],
    historicalOutcome:
      'On December 17, 2012, NASA intentionally impacted Ebb and Flow into a northern lunar ridge (75.62° N, 26.63° W), dedicating the impact mountain in honor of Dr. Sally Ride.',
    ethicalReasoning:
      'Protection in space applies not only to alien ecosystems, but also to cultural and scientific heritage. Controlled disposal keeps historic landing zones undisturbed for future preservation and study.',
    citationLabel: 'NASA News: GRAIL Impact Site Named for Sally Ride',
    citationUrl: 'https://www.nasa.gov/mission_pages/grail/news/grail20121217.html',
  },
  {
    id: 'dilemma-lcross',
    missionId: 'lcross',
    roleTitle: 'Lunar Exploration Lead · October 2009',
    scenarioTitle: 'Destroy a 2.2-Ton Rocket Stage for Four Minutes of Plume Spectra?',
    briefing:
      'Neutron sensors from Lunar Prospector hinted at hydrogen in permanently shadowed polar craters, yet orbital data cannot prove water ice exists in Cabeus Crater. You have an empty Centaur upper stage and a small shepherd craft.',
    scientificStakes:
      'Using hardware as a hypervelocity projectile guarantees total destruction of both vehicles—and leaves metallic debris in a pristine cryogenic crater—for a single four-minute observation window.',
    options: [
      {
        id: 'opt-lcross-impact',
        label: 'Crash the Centaur at 9,000 km/h and Fly Through the Debris',
        consequenceSummary:
          'Sacrifice both stages to blast buried regolith 10 miles into sunlight, reading water absorption lines directly.',
        isHistoricalChoice: true,
      },
      {
        id: 'opt-lcross-orbit',
        label: 'Keep Shepherd in Orbit for Passive Remote Sensing Only',
        consequenceSummary:
          'Preserve the spacecraft longer, but remain unable to see beneath the pitch-black shadow of Cabeus Crater.',
        isHistoricalChoice: false,
      },
    ],
    historicalOutcome:
      'On October 9, 2009, the spent Centaur struck Cabeus Crater (84.9° S, 45.5° W), and LCROSS flew straight through the sunlit ejecta curtain before impacting four minutes later—confirming ~5.6% water ice by mass.',
    ethicalReasoning:
      'When non-destructive instruments cannot penetrate permanent shadow, deliberate kinetic excavation converts otherwise discarded launch mass into a high-leverage scientific experiment.',
    citationLabel: 'Science (2010): Detection of Water in the LCROSS Ejecta Plume',
    citationUrl: 'https://www.science.org/doi/10.1126/science.1186986',
  },
  {
    id: 'dilemma-magellan',
    missionId: 'magellan-venus',
    roleTitle: 'Magellan Flight Director · October 1994',
    scenarioTitle: 'One Final Atmospheric Experiment Before Vaporization?',
    briefing:
      'Assembled largely from spare Voyager and Galileo hardware, Magellan has already radar-mapped 98% of Venus through its thick sulfuric acid clouds. Its orbit is decaying and solar power is degrading.',
    scientificStakes:
      'You can either power down peacefully and let the orbiter burn up passively, or command an aggressive "windmill" panel orientation deep inside Venus’s upper atmosphere.',
    options: [
      {
        id: 'opt-magellan-windmill',
        label: 'Turn Solar Panels Perpendicular for the "Windmill Experiment"',
        consequenceSummary:
          'Use the spacecraft’s own body torque to measure upper-atmosphere density and drag right before thermal destruction.',
        isHistoricalChoice: true,
      },
      {
        id: 'opt-magellan-silent',
        label: 'Decommission Transmitter Early Without Aerodynamic Maneuver',
        consequenceSummary:
          'Simplify end-of-life operations, forfeiting rare in-situ upper-atmosphere drag measurements at Venus.',
        isHistoricalChoice: false,
      },
    ],
    historicalOutcome:
      'On October 12–13, 1994, engineers commanded the Windmill Experiment, twisting Magellan’s solar arrays like paddles in Venus’s upper atmosphere to quantify aerodynamic torque before signal loss and vaporization.',
    ethicalReasoning:
      'Extracting one final calibrated measurement from an inevitable atmospheric entry maximizes public scientific return on taxpayer hardware without introducing orbital debris.',
    citationLabel: 'NASA PDS Geosciences: Magellan Venus Radar',
    citationUrl: 'https://pds-geosciences.wustl.edu/missions/magellan/',
  },
];
