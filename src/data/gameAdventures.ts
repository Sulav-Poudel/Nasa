import type { PillarId } from '../types/archive';
import type { CharacterId } from '../components/GameCharacters';
import type { CraftManeuver, EnvironmentTheme } from '../components/DetailedCraftStage';

export interface StoryChoiceOption {
  id: string;
  label: string;
  sublabel: string;
  points: number;
  isOptimal: boolean;
  maneuver: CraftManeuver;
  feedbackSpeaker: CharacterId;
  feedbackText: string;
  unlockedDiscovery: string;
}

export interface AdventureBeat {
  id: string;
  actLabel: string;
  speaker: CharacterId;
  text: string;
  telemetryBadge?: string;
  maneuver?: CraftManeuver;
  inspectHint?: string;
  choices?: StoryChoiceOption[];
}

export interface GameAdventure {
  id: string;
  missionId: string;
  modelId: string;
  shortTitle: string;
  fullTitle: string;
  locationLabel: string;
  pillar: PillarId;
  environment: EnvironmentTheme;
  difficulty: 'Command' | 'Field Ops' | 'Deep Space';
  guideIntro: string;
  rewardBadge: string;
  epistemicNote?: string;
  beats: AdventureBeat[];
}

export const GAME_ADVENTURES: GameAdventure[] = [
  {
    id: 'adv-cassini',
    missionId: 'cassini-saturn',
    modelId: 'cassini-saturn',
    shortTitle: 'Cassini: Saturn Dive',
    fullTitle: 'CASSINI — THE GRAND FINALE',
    locationLabel: 'Saturn & Enceladus',
    pillar: 'Protection',
    environment: 'saturn',
    difficulty: 'Command',
    guideIntro:
      'Cassini found hydrothermal oceans under Enceladus. Now its fuel is nearly gone—guide its final sacrifice.',
    rewardBadge: 'Guardian of Alien Oceans',
    beats: [
      {
        id: 'c1',
        actLabel: 'ACT 1 · BRIEFING',
        speaker: 'guide',
        text: 'Welcome to Saturn Orbit, Commander. After 13 years, our 2,150 kg flagship orbiter Cassini is nearly out of hydrazine propellant.',
        telemetryBadge: '2,150 KG · RTG POWERED',
        maneuver: 'idle',
        inspectHint: 'Drag the 3D view to inspect Cassini’s 4-meter high-gain dish and gold thermal foil.',
      },
      {
        id: 'c2',
        actLabel: 'ACT 2 · THE GEYSER CLUE',
        speaker: 'protection',
        text: 'Our INMS spectrometer tasted water-ice geysers erupting from Enceladus—finding molecular hydrogen and organic molecules fed by a global ocean.',
        telemetryBadge: 'ENCELADUS · HYDROTHERMAL',
        maneuver: 'scan',
      },
      {
        id: 'c3',
        actLabel: 'ACT 3 · CRITICAL DECISION',
        speaker: 'protection',
        text: 'Without fuel, gravity tugs will make Cassini’s orbit chaotic. If dormant Earth microbes hitchhiked on board, how do we retire the spacecraft?',
        maneuver: 'idle',
        choices: [
          {
            id: 'c3-park',
            label: 'Leave Cassini in an unpowered distant orbit',
            sublabel: 'Conserves final telemetry passes',
            points: 50,
            isOptimal: false,
            maneuver: 'idle',
            feedbackSpeaker: 'protection',
            feedbackText:
              'Too risky! Titan’s gravity perturbations could fling a dead orbiter into Enceladus within decades, violating NASA planetary protection rules.',
            unlockedDiscovery: 'Learned: Uncontrolled orbits risk biological contamination of Enceladus & Titan.',
          },
          {
            id: 'c3-plunge',
            label: 'Execute 22 ring-gap dives, then plunge into Saturn',
            sublabel: 'Vaporizes craft cleanly at 77,000 mph',
            points: 150,
            isOptimal: true,
            maneuver: 'burn',
            feedbackSpeaker: 'flight',
            feedbackText:
              'Trajectory locked! Cassini threads the 2,000-km gap between Saturn and its rings 22 times before vaporizing cleanly on September 15, 2017.',
            unlockedDiscovery: 'Unlocked: Grand Finale Ring-Gap Trajectory & Planetary Protection Protocol.',
          },
        ],
      },
      {
        id: 'c4',
        actLabel: 'ACT 4 · FINAL TRANSMISSION',
        speaker: 'flight',
        text: 'Plunging at 77,000 mph at 9.4° N, 53° W! Cassini fires its thrusters at 100% duty cycle just to keep its antenna pointed at Earth while sampling ring rain.',
        telemetryBadge: '77,000 MPH · LAST SIGNAL',
        maneuver: 'burn',
      },
      {
        id: 'c5',
        actLabel: 'ACT 5 · LEGACY',
        speaker: 'guide',
        text: 'Signal lost—mission accomplished. Cassini became part of Saturn so future astrobiology probes can explore pristine oceans on Enceladus and Titan.',
        telemetryBadge: 'CONFIRMED · NASA PDS',
        maneuver: 'idle',
      },
    ],
  },
  {
    id: 'adv-lcross',
    missionId: 'lcross',
    modelId: 'lcross',
    shortTitle: 'LCROSS: Crater Impact',
    fullTitle: 'LCROSS — CABEUS EXCAVATION',
    locationLabel: 'Lunar South Pole',
    pillar: 'Experiments',
    environment: 'moon-dark',
    difficulty: 'Command',
    guideIntro:
      'Sunlight has never touched Cabeus Crater’s floor. Crash a 2.2-ton Centaur rocket to blast hidden ice into the light!',
    rewardBadge: 'South Pole Prospector',
    beats: [
      {
        id: 'l1',
        actLabel: 'ACT 1 · DARK CRATER',
        speaker: 'guide',
        text: 'Earlier orbiters spotted hydrogen near the Moon’s south pole, but we don’t know if it’s true water ice hidden inside Cabeus Crater’s permanent shadow.',
        telemetryBadge: '84.9° S, 45.5° W · CRYOGENIC',
        maneuver: 'idle',
        inspectHint: 'Rotate the 3D stage to inspect the tall Centaur upper stage and the solar-winged Shepherd craft.',
      },
      {
        id: 'l2',
        actLabel: 'ACT 2 · DUAL STAGE',
        speaker: 'flight',
        text: 'Instead of discarding the spent 2.2-ton Centaur upper stage, we kept it attached as a 9,000 km/h kinetic excavator—with our Shepherd satellite trailing four minutes behind.',
        telemetryBadge: '2,366 KG · 9,000 KM/H',
        maneuver: 'burn',
      },
      {
        id: 'l3',
        actLabel: 'ACT 3 · PLUME TACTICS',
        speaker: 'flight',
        text: 'Centaur just struck Cabeus Crater, blasting regolith 10 miles upward into high-altitude sunlight! We have four minutes before Shepherd hits. Select instrument priority:',
        maneuver: 'scan',
        choices: [
          {
            id: 'l3-nir',
            label: 'Lock Near-Infrared Spectrometers on 1.4 & 1.9 μm bands',
            sublabel: 'Hunt direct H2O water-ice absorption lines',
            points: 150,
            isOptimal: true,
            maneuver: 'scan',
            feedbackSpeaker: 'protection',
            feedbackText:
              'Spectra locked! Both 1.4 and 1.9 micrometer water-ice bands spike clearly—confirming ~5.6% water ice by mass plus methane and ammonia!',
            unlockedDiscovery: 'Unlocked: Confirmed 5.6% Water Ice in Cabeus Crater (Science 2010).',
          },
          {
            id: 'l3-vis',
            label: 'Prioritize wide-angle visible dust photography only',
            sublabel: 'Measures ejecta brightness without spectral ID',
            points: 60,
            isOptimal: false,
            maneuver: 'impact',
            feedbackSpeaker: 'guide',
            feedbackText:
              'Great optical geometry, though visible light alone can’t separate water ice from dry silicate dust. Fortunately the backup NIR channel caught the ice lines!',
            unlockedDiscovery: 'Learned: Near-infrared spectroscopy is essential to prove water ice.',
          },
        ],
      },
      {
        id: 'l4',
        actLabel: 'ACT 4 · IMPACT',
        speaker: 'guide',
        text: 'Four minutes after the Centaur, the LCROSS Shepherd beamed its final packet and impacted the Moon—leaving verified water-ice maps for Artemis.',
        telemetryBadge: 'CONFIRMED · ARTEMIS BASELINE',
        maneuver: 'impact',
      },
    ],
  },
  {
    id: 'adv-opportunity',
    missionId: 'opportunity-mer-b',
    modelId: 'opportunity-mer-b',
    shortTitle: 'Oppy: Mars Marathon',
    fullTitle: 'OPPORTUNITY — MERIDIANI PLANUM',
    locationLabel: 'Meridiani Planum, Mars',
    pillar: 'Time',
    environment: 'mars',
    difficulty: 'Field Ops',
    guideIntro:
      'Designed for 90 Martian sols and 1 kilometer, Opportunity drove a full marathon across Mars. Can you guide her through the 2018 dust storm?',
    rewardBadge: 'Meridiani Marathoner',
    beats: [
      {
        id: 'o1',
        actLabel: 'ACT 1 · EAGLE CRATER',
        speaker: 'rover',
        text: 'Touchdown in Meridiani Planum! Opportunity is a 185 kg solar-powered field geologist engineered for just 90 sols and 1,000 meters of driving.',
        telemetryBadge: '185 KG · 90-SOL WARRANTY',
        maneuver: 'drive',
        inspectHint: 'Inspect Oppy’s triangular solar petals, Pancam mast, and 6 rocker-bogie wheels.',
      },
      {
        id: 'o2',
        actLabel: 'ACT 2 · ANCIENT WATER',
        speaker: 'rover',
        text: 'Our Mössbauer spectrometer just scanned weird millimeter spheres in the bedrock—"blueberries" made of hematite, plus jarosite salts forged in acidic standing water!',
        telemetryBadge: 'SOL 5,111 · 45.16 KM',
        maneuver: 'scan',
      },
      {
        id: 'o3',
        actLabel: 'ACT 3 · GLOBAL DUST STORM',
        speaker: 'rover',
        text: 'June 2018: A planet-encircling dust storm turns midday pitch black! Power has collapsed from 300 Wh/sol down to 22 Wh/sol. What’s our survival command?',
        maneuver: 'idle',
        choices: [
          {
            id: 'o3-drive',
            label: 'Keep driving toward sunlit ridge slopes',
            sublabel: 'Risks instant brownout mid-traverse',
            points: 50,
            isOptimal: false,
            maneuver: 'drive',
            feedbackSpeaker: 'rover',
            feedbackText:
              'At 22 Wh/sol, drive motors drain the battery completely and trip low-power fault mode before reaching the ridge.',
            unlockedDiscovery: 'Learned: Dust opacity starves solar rovers of critical heater power.',
          },
          {
            id: 'o3-sleep',
            label: 'Halt operations & enter low-power survival sleep',
            sublabel: 'Conserves every watt for clock & survival heaters',
            points: 150,
            isOptimal: true,
            maneuver: 'idle',
            feedbackSpeaker: 'rover',
            feedbackText:
              'Smart call. Opportunity enters fault hibernation in Perseverance Valley. Over eight months, NASA sends hundreds of recovery songs waiting for wind to clear the panels.',
            unlockedDiscovery: 'Unlocked: First Off-World Marathon Record (45.16 km over 14.8 Years).',
          },
        ],
      },
      {
        id: 'o4',
        actLabel: 'ACT 4 · FAREWELL',
        speaker: 'guide',
        text: 'After 5,111 sols and 45.16 km, Opportunity never woke from the storm—"My battery is low and it’s getting dark." Her data proved ancient Mars once held liquid water.',
        telemetryBadge: 'CONFIRMED · MER-B ARCHIVE',
        maneuver: 'idle',
      },
    ],
  },
  {
    id: 'adv-voyager1',
    missionId: 'voyager-1',
    modelId: 'voyager-1',
    shortTitle: 'Voyager 1: 1 Light-Day',
    fullTitle: 'VOYAGER 1 — INTERSTELLAR WHISPER',
    locationLabel: 'Interstellar Space (173 AU)',
    pillar: 'Time',
    environment: 'interstellar',
    difficulty: 'Deep Space',
    guideIntro:
      'Nearly 50 years after launch, Voyager 1 nears one full light-day from Earth. Manage its dwindling plutonium power!',
    rewardBadge: 'Interstellar Steward',
    epistemicNote:
      'Dataset lists Nov 18, 2026 as the 24 light-hour crossing milestone—verify exact timing against NASA JPL Horizons.',
    beats: [
      {
        id: 'v1',
        actLabel: 'ACT 1 · PALE BLUE DOT TO HELIOPAUSE',
        speaker: 'flight',
        text: 'Launched September 5, 1977, Voyager 1 is flying 17 km/s outward through interstellar space—over 173 astronomical units from Earth.',
        telemetryBadge: '815 KG · 17 KM/S',
        maneuver: 'idle',
        inspectHint: 'Spin the 3D Voyager model to find the Gold-plated Voyager Record mounted on its bus and the 3-RTG boom.',
      },
      {
        id: 'v2',
        actLabel: 'ACT 2 · CROSSING THE BOUNDARY',
        speaker: 'flight',
        text: 'In August 2012, Voyager 1’s plasma wave detector recorded an abrupt 40x jump in electron density—confirming it crossed the heliopause into interstellar medium.',
        telemetryBadge: '0.002 → 0.08 CM⁻³ PLASMA',
        maneuver: 'scan',
      },
      {
        id: 'v3',
        actLabel: 'ACT 3 · DYING PLUTONIUM',
        speaker: 'flight',
        text: 'Every year, Voyager 1’s three RTG generators lose ~4 watts of electrical output, and one-way radio time now nears 24 hours. How do we stretch telemetry past 2030?',
        maneuver: 'idle',
        choices: [
          {
            id: 'v3-trim',
            label: 'Power down secondary instrument heaters carefully',
            sublabel: 'Keeps core plasma & magnetic fields alive',
            points: 150,
            isOptimal: true,
            maneuver: 'scan',
            feedbackSpeaker: 'flight',
            feedbackText:
              'Precise engineering! Even at cryogenic temperatures, several instruments survived heater shutoffs—buying Voyager precious years beyond 1 light-day.',
            unlockedDiscovery: 'Unlocked: RTG Power-Shedding Protocol (48-Hour Round-Trip Light Time).',
          },
          {
            id: 'v3-all',
            label: 'Keep all heaters active until total bus brownout',
            sublabel: 'Maximizes short-term warmth, terminates mission early',
            points: 55,
            isOptimal: false,
            maneuver: 'idle',
            feedbackSpeaker: 'guide',
            feedbackText:
              'Keeping all heaters active trips voltage limits years sooner. NASA engineers shed non-essential subsystems one by one to keep the whisper alive.',
            unlockedDiscovery: 'Learned: Gradual subsystem retirement extends interstellar science.',
          },
        ],
      },
      {
        id: 'v4',
        actLabel: 'ACT 4 · 24 LIGHT-HOURS',
        speaker: 'guide',
        text: 'At 25.9 billion km (~173 AU), a message takes 48 hours for a round-trip reply. When its last watt fades, Voyager 1 and its Golden Record will circle the Milky Way for billions of years.',
        telemetryBadge: '2026 MILESTONE · VERIFY JPL',
        maneuver: 'idle',
      },
    ],
  },
  {
    id: 'adv-apollo-rovers',
    missionId: 'apollo-moon-buggies',
    modelId: 'apollo-moon-buggies',
    shortTitle: 'Apollo: Lunar Rovers',
    fullTitle: 'APOLLO LRV — THE ROCKET EQUATION',
    locationLabel: 'Hadley · Descartes · Taurus',
    pillar: 'Weight',
    environment: 'moon-lit',
    difficulty: 'Field Ops',
    guideIntro:
      'Every kilogram saved on the Moon meant another kilogram of ancient lunar crust coming home. Suit up for the Apollo 17 traverse!',
    rewardBadge: 'Lunar Sample Tactician',
    beats: [
      {
        id: 'a1',
        actLabel: 'ACT 1 · FOLDED ON THE DESCENT STAGE',
        speaker: 'rover',
        text: 'Each electric Lunar Roving Vehicle weighs 210 kg on Earth—but only 34 kg in lunar gravity. Unfolding from Apollo’s descent bay turned walking crews into geologists on wheels.',
        telemetryBadge: '210 KG EARTH · 34 KG MOON',
        maneuver: 'drive',
        inspectHint: 'Examine the wire-mesh tires, twin astronaut seats, and gold avionics bay on the 3D LRV.',
      },
      {
        id: 'a2',
        actLabel: 'ACT 2 · FENDER EMERGENCY',
        speaker: 'rover',
        text: 'Apollo 17 Alert! Gene Cernan’s hammer snagged the right-rear fender and snapped it off—rooster-tailing abrasive lunar dust onto crew visors and cooling radiators!',
        maneuver: 'drive',
        choices: [
          {
            id: 'a2-fix',
            label: 'Jury-rig replacement fender with 4 maps, tape & clamps',
            sublabel: 'Field repair using onboard cockpit supplies',
            points: 150,
            isOptimal: true,
            maneuver: 'drive',
            feedbackSpeaker: 'rover',
            feedbackText:
              'Classic Apollo ingenuity! Highlighted in copper on our 3D model, those laminated maps taped together survived 9+ km of lunar dust.',
            unlockedDiscovery: 'Unlocked: Apollo 17 Duct-Tape Fender Repair & Full Sample Traverse.',
          },
          {
            id: 'a2-walk',
            label: 'Abandon LRV immediately and hike on foot',
            sublabel: 'Eliminates dust spray but cuts traverse distance',
            points: 60,
            isOptimal: false,
            maneuver: 'idle',
            feedbackSpeaker: 'guide',
            feedbackText:
              'Walking limits exploration to a few hundred meters—missing critical volcanic glass and highland samples kilometers from the lander.',
            unlockedDiscovery: 'Learned: LRV mobility unlocked 36+ km traverses per mission.',
          },
        ],
      },
      {
        id: 'a3',
        actLabel: 'ACT 3 · THE HARDEST TRADE',
        speaker: 'guide',
        text: 'Ascent fuel margins are razor-thin. To bring back 382 kg of Moon rocks across Apollo, all three rovers were parked permanently with cameras aimed back to film liftoff. Hardware stayed; the Moon came home.',
        telemetryBadge: '382 KG MOON ROCKS RETURNED',
        maneuver: 'idle',
      },
    ],
  },
  {
    id: 'adv-lunar-prospector',
    missionId: 'lunar-prospector',
    modelId: 'lunar-prospector',
    shortTitle: 'Prospector: Shoemaker',
    fullTitle: 'LUNAR PROSPECTOR — SHOEMAKER’S FLIGHT',
    locationLabel: 'Lunar South Pole',
    pillar: 'Experiments',
    environment: 'moon-dark',
    difficulty: 'Deep Space',
    guideIntro:
      'A tiny 158-kg orbiter mapped lunar hydrogen—and carried astrogeology founder Eugene Shoemaker to the only human burial on the Moon.',
    rewardBadge: 'Astrogeology Chronicler',
    beats: [
      {
        id: 'lp1',
        actLabel: 'ACT 1 · DISCOVERY SCOUT',
        speaker: 'guide',
        text: 'Weighing just 158 kg, spin-stabilized Lunar Prospector launched in January 1998 with three 2.5-meter radial science booms to map lunar minerals and gravity.',
        telemetryBadge: '158 KG · 3 SCIENCE BOOMS',
        maneuver: 'scan',
        inspectHint: 'Look at the solar drum deck in 3D to spot Eugene Shoemaker’s brass foil memorial capsule.',
      },
      {
        id: 'lp2',
        actLabel: 'ACT 2 · A TEACHER’S DREAM',
        speaker: 'protection',
        text: 'Geologist Eugene Shoemaker trained Apollo astronauts to read Moon craters, but illness grounded him. After his tragic death in 1997, an ounce of his ashes rode aboard inside a brass foil capsule.',
        telemetryBadge: '87.7° S, 42.0° E · BRASS CAPSULE',
        maneuver: 'idle',
      },
      {
        id: 'lp3',
        actLabel: 'ACT 3 · END OF FUEL DECISION',
        speaker: 'flight',
        text: 'Prospector’s neutron spectrometer found strong hydrogen drops at both poles. As fuel runs dry in July 1999, should we let it crash randomly or aim for a south-pole shadowed crater?',
        maneuver: 'burn',
        choices: [
          {
            id: 'lp3-aim',
            label: 'Deorbit intentionally into Shoemaker Crater under Hubble watch',
            sublabel: 'Tests vapor plume hypothesis & honors Shoemaker',
            points: 150,
            isOptimal: true,
            maneuver: 'impact',
            feedbackSpeaker: 'protection',
            feedbackText:
              'Confirmed impact on July 31, 1999! Earth telescopes saw no water vapor plume from the tiny 158-kg impact—proving we’d need a heavier impactor like LCROSS a decade later.',
            unlockedDiscovery: 'Unlocked: First Polar Hydrogen Maps & Shoemaker Memorial Site.',
          },
          {
            id: 'lp3-drift',
            label: 'Allow natural orbital decay into equatorial highlands',
            sublabel: 'Avoids targeted maneuver burns',
            points: 50,
            isOptimal: false,
            maneuver: 'idle',
            feedbackSpeaker: 'guide',
            feedbackText:
              'An uncontrolled impact wastes a priceless impact experiment and misses the shadowed south-pole hydrogen anomaly.',
            unlockedDiscovery: 'Learned: Targeted end-of-life impactors turn retirement into data.',
          },
        ],
      },
      {
        id: 'lp4',
        actLabel: 'ACT 4 · ONLY HUMAN ON THE MOON',
        speaker: 'guide',
        text: 'Eugene Shoemaker remains the only human whose cremated remains rest on the Moon—and Lunar Prospector’s maps guided LCROSS straight to water ice ten years later.',
        telemetryBadge: 'CONFIRMED · NASA PDS',
        maneuver: 'idle',
      },
    ],
  },
  {
    id: 'adv-dart',
    missionId: 'dart-planetary-defense',
    modelId: 'dart-planetary-defense',
    shortTitle: 'DART: Asteroid Strike',
    fullTitle: 'DART — PLANETARY DEFENSE TEST',
    locationLabel: 'Didymos–Dimorphos System',
    pillar: 'Experiments',
    environment: 'asteroid',
    difficulty: 'Command',
    guideIntro:
      'Steer a 610-kg spacecraft autonomously at 14,000 mph into asteroid moonlet Dimorphos to shift its orbit!',
    rewardBadge: 'Planetary Defender',
    epistemicNote:
      'Dataset notes ESA’s Hera arrival in November 2026 to measure the crater; verify live rendezvous status.',
    beats: [
      {
        id: 'd1',
        actLabel: 'ACT 1 · TERMINAL GUIDANCE',
        speaker: 'flight',
        text: 'Welcome to the Didymos binary asteroid system! DART is a 610 kg kinetic impactor racing toward the 160-meter moonlet Dimorphos at 14,000 mph.',
        telemetryBadge: '610 KG · 14,000 MPH',
        maneuver: 'burn',
        inspectHint: 'Inspect DART’s blue NEXT-C ion thruster plume, rolled-out solar wings, and front DRACO telescope.',
      },
      {
        id: 'd2',
        actLabel: 'ACT 2 · AUTONOMOUS LOCK',
        speaker: 'flight',
        text: 'Light-time lag makes Earth joystick control impossible in the final hour! How should we verify both aim and impact ejecta?',
        maneuver: 'scan',
        choices: [
          {
            id: 'd2-licia',
            label: 'Deploy LICIACube observer + SMART Nav DRACO lock',
            sublabel: 'Tracks Dimorphos autonomously & films blast plume',
            points: 150,
            isOptimal: true,
            maneuver: 'impact',
            feedbackSpeaker: 'flight',
            feedbackText:
              'Bullseye on September 26, 2022! DRACO streamed boulders until the final red frame, while LICIACube imaged the massive boulder spray that multiplied deflection thrust.',
            unlockedDiscovery: 'Unlocked: 32-Minute Orbital Period Shift (11h 55m → 11h 23m).',
          },
          {
            id: 'd2-manual',
            label: 'Rely solely on pre-impact Earth radio ground commands',
            sublabel: 'Skips onboard optical asteroid tracking',
            points: 45,
            isOptimal: false,
            maneuver: 'burn',
            feedbackSpeaker: 'guide',
            feedbackText:
              'Without onboard SMART Nav optical tracking, small center-of-mass uncertainties risk grazing or missing the 160-meter moonlet completely!',
            unlockedDiscovery: 'Learned: Autonomous optical navigation is mandatory for kinetic deflection.',
          },
        ],
      },
      {
        id: 'd3',
        actLabel: 'ACT 3 · ORBIT SHIFTED',
        speaker: 'guide',
        text: 'Earth radar confirmed Dimorphos’s orbit shortened by 32 minutes—proving humanity can alter a celestial body’s trajectory when Earth’s future depends on it.',
        telemetryBadge: 'CONFIRMED · -32 MIN SHIFT',
        maneuver: 'idle',
      },
    ],
  },
  {
    id: 'adv-insight',
    missionId: 'insight-lander',
    modelId: 'insight-lander',
    shortTitle: 'InSight: Marsquakes',
    fullTitle: 'INSIGHT — LISTENING TO MARS',
    locationLabel: 'Elysium Planitia, Mars',
    pillar: 'Time',
    environment: 'mars',
    difficulty: 'Field Ops',
    guideIntro:
      'Deploy a copper-domed seismometer onto Martian soil and listen to 1,319 marsquakes before dust silences the solar fans.',
    rewardBadge: 'Martian Seismologist',
    beats: [
      {
        id: 'i1',
        actLabel: 'ACT 1 · ELYSIUM PLANITIA',
        speaker: 'rover',
        text: 'Unlike rovers, InSight landed in November 2018 to stay put—unfolding twin decagonal UltraFlex solar fans and placing an ultra-sensitive seismometer directly onto Mars.',
        telemetryBadge: '358 KG · SEIS DOME',
        maneuver: 'idle',
        inspectHint: 'Rotate the 3D InSight model to see the copper SEIS dome resting on the ground ahead of its robotic arm.',
      },
      {
        id: 'i2',
        actLabel: 'ACT 2 · DUST SEASON',
        speaker: 'rover',
        text: 'By 2022, thick Martian dust is caking our solar arrays. Power is fading fast. How can engineers wring extra weeks of seismic listening from dusty panels?',
        maneuver: 'scan',
        choices: [
          {
            id: 'i2-trickle',
            label: 'Scoop soil near panels so wind knocks off dust grains',
            sublabel: 'Creative Martian self-cleaning trick',
            points: 150,
            isOptimal: true,
            maneuver: 'scan',
            feedbackSpeaker: 'rover',
            feedbackText:
              'Ingenious! Trickling coarse sand over the deck during gusts carried fine dust away—buying precious extra power to keep SEIS recording up to 1,319 marsquakes!',
            unlockedDiscovery: 'Unlocked: Liquid Iron-Nickel Core Mapped (~1,830 km Radius).',
          },
          {
            id: 'i2-off',
            label: 'Shut SEIS off early to keep weather sensors warm',
            sublabel: 'Preserves basic telemetry, halts interior science',
            points: 55,
            isOptimal: false,
            maneuver: 'idle',
            feedbackSpeaker: 'guide',
            feedbackText:
              'InSight’s entire purpose was interior seismology—NASA turned off secondary sensors first so SEIS could keep listening to the final watt.',
            unlockedDiscovery: 'Learned: Prioritizing SEIS yielded 1,319 seismic detections.',
          },
        ],
      },
      {
        id: 'i3',
        actLabel: 'ACT 3 · QUIET REST',
        speaker: 'guide',
        text: 'In December 2022, InSight sent its final image and fell silent after mapping Mars’s crust, mantle, and liquid 1,830-km core from 1,319 marsquakes.',
        telemetryBadge: 'CONFIRMED · 1,319 MARSQUAKES',
        maneuver: 'idle',
      },
    ],
  },
];
