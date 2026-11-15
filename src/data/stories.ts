import type { PillarId } from '../types/archive';

export interface StoryChapter {
  index: number;
  act: string;
  title: string;
  dateLabel: string;
  narrative: string;
  telemetryLabel: string;
  telemetryValue: string;
  epistemicNote?: string;
}

export interface InteractiveStory {
  id: string;
  missionId: string;
  title: string;
  subtitle: string;
  pillar: PillarId;
  durationRead: string;
  openingQuote: string;
  chapters: StoryChapter[];
}

export const INTERACTIVE_STORIES: InteractiveStory[] = [
  {
    id: 'story-cassini',
    missionId: 'cassini-saturn',
    title: 'Cassini: The Final Dive into Saturn',
    subtitle: 'Why humanity vaporized a healthy flagship orbiter at 77,000 mph',
    pillar: 'Protection',
    durationRead: '3 min documentary',
    openingQuote:
      'To protect oceans we have never touched, Cassini became part of the planet it came to study.',
    chapters: [
      {
        index: 1,
        act: 'Opening',
        title: 'Thirteen Years Around the Ringed World',
        dateLabel: '1997 – 2017',
        narrative:
          'Launched on October 15, 1997, the 2,150 kg nuclear-powered Cassini orbiter spent thirteen years transforming Saturn from a distant telescopic marvel into a complex system of storms, rings, and ocean moons.',
        telemetryLabel: 'Spacecraft Mass',
        telemetryValue: '2,150 kg',
      },
      {
        index: 2,
        act: 'Context',
        title: 'A Spacecraft Built Too Well',
        dateLabel: '2004 – 2016',
        narrative:
          'Cassini arrived at Saturn in 2004 and delivered the Huygens probe to Titan. By 2017, its instruments were still healthy, yet its hydrazine propellant was nearly exhausted after two decades in space.',
        telemetryLabel: 'Mission Span',
        telemetryValue: '20 Years',
      },
      {
        index: 3,
        act: 'Objective',
        title: 'Tasting Plumes from an Alien Sea',
        dateLabel: 'Enceladus Flybys',
        narrative:
          'Cassini’s Ion and Neutral Mass Spectrometer (INMS) flew directly through water-ice geysers erupting from Enceladus, detecting molecular hydrogen, methane, and organic macromolecules.',
        telemetryLabel: 'Key Instrument',
        telemetryValue: 'INMS Spectrometer',
      },
      {
        index: 4,
        act: 'Challenge',
        title: 'The Contamination Paradox',
        dateLabel: 'Planetary Protection',
        narrative:
          'Those discoveries proved Enceladus holds a global saltwater ocean with hydrothermal chemistry compatible with methanogenic life—and Titan holds liquid hydrocarbon seas. Leaving an unguided derelict orbiter in Saturn orbit risked a future collision carrying dormant Earth microbes.',
        telemetryLabel: 'Protected Worlds',
        telemetryValue: 'Enceladus & Titan',
      },
      {
        index: 5,
        act: 'The Decision',
        title: 'Twenty-Two Dives Between Planet and Rings',
        dateLabel: 'April – Sept 2017',
        narrative:
          'Mission directors rejected distant parking orbits and chose a deliberate Grand Finale: 22 daring passes through the narrow gap inside Saturn’s rings, followed by a controlled plunge into Saturn’s upper atmosphere.',
        telemetryLabel: 'Entry Coordinates',
        telemetryValue: '9.4° N, 53° W',
      },
      {
        index: 6,
        act: 'Discovery',
        title: 'Data Until the Antenna Broke Apart',
        dateLabel: 'September 15, 2017',
        narrative:
          'Plunging at 77,000 mph, Cassini fired its thrusters to keep its high-gain dish pointed toward Earth as atmospheric torque tore it apart, sampling Saturn’s "ring rain" and upper atmosphere in real time.',
        telemetryLabel: 'Plunge Velocity',
        telemetryValue: '77,000 mph',
      },
      {
        index: 7,
        act: 'Legacy',
        title: 'An Ethical Shield for Future Ocean Explorers',
        dateLabel: 'PDS Archive',
        narrative:
          'Because Cassini was sacrificed cleanly, future astrobiology missions to Enceladus or Titan will sample uncontaminated alien oceans. The hardware vaporized; the planetary protection standard endures.',
        telemetryLabel: 'Evidence Status',
        telemetryValue: 'CONFIRMED · PDS',
      },
    ],
  },
  {
    id: 'story-opportunity',
    missionId: 'opportunity-mer-b',
    title: "Opportunity: The Rover That Wouldn't Stop",
    subtitle: 'Ninety planned sols that stretched into an off-world marathon',
    pillar: 'Time',
    durationRead: '3 min documentary',
    openingQuote:
      'Built for ninety Martian days, Opportunity outlived its warranty by more than fourteen years.',
    chapters: [
      {
        index: 1,
        act: 'Opening',
        title: 'A Hole-in-One on Meridiani Planum',
        dateLabel: 'January 2004',
        narrative:
          'Launched July 7, 2003, the 185 kg solar-powered rover Opportunity bounced inside Eagle Crater on Meridiani Planum—landing directly beside exposed bedrock outcrops.',
        telemetryLabel: 'Rover Mass',
        telemetryValue: '185 kg',
      },
      {
        index: 2,
        act: 'Context',
        title: 'The 90-Sol Warranty',
        dateLabel: '2004 Baseline',
        narrative:
          'Engineers expected Martian dust to coat Opportunity’s solar arrays within three months, choking power generation and ending the 1,000-meter geology survey before winter.',
        telemetryLabel: 'Design Lifetime',
        telemetryValue: '90 Sols / 1 km',
      },
      {
        index: 3,
        act: 'Objective',
        title: 'Following the Water in Stone',
        dateLabel: 'Eagle to Endurance',
        narrative:
          'Using its Mössbauer spectrometer and microscopic imager, Opportunity examined millimeter-scale iron-rich spherules—nicknamed "blueberries"—and jarosite sulfate salts locked inside sedimentary rock.',
        telemetryLabel: 'Key Finding',
        telemetryValue: 'Hematite & Jarosite',
      },
      {
        index: 4,
        act: 'Challenge',
        title: 'A Planet-Encircling Wall of Dust',
        dateLabel: 'June 2018',
        narrative:
          'After 5,111 sols and years of wind-cleaning gusts, a catastrophic global dust storm blotted out the Sun over Perseverance Valley. Solar output collapsed from roughly 300 watt-hours per sol to 22 watt-hours.',
        telemetryLabel: 'Power Drop',
        telemetryValue: '300 → 22 Wh/sol',
      },
      {
        index: 5,
        act: 'The Decision',
        title: 'Listening Through Silence',
        dateLabel: '2018 – Feb 2019',
        narrative:
          'Unable to warm its internal clock or charge batteries, Opportunity entered low-power fault mode. Engineers beamed hundreds of recovery commands over eight months before accepting silence.',
        telemetryLabel: 'Final Operational Sol',
        telemetryValue: 'Sol 5,111',
      },
      {
        index: 6,
        act: 'Discovery',
        title: 'Proof of Standing Ancient Acidic Water',
        dateLabel: '14.8 Years of Data',
        narrative:
          'Across 45.16 kilometers—a full off-world marathon—Opportunity proved liquid water once soaked Meridiani Planum for prolonged epochs, rewriting Martian climate history.',
        telemetryLabel: 'Distance Driven',
        telemetryValue: '45.16 km',
      },
      {
        index: 7,
        act: 'Legacy',
        title: 'The Road Builder on Meridiani',
        dateLabel: '2004 – 2018',
        narrative:
          'Its poetic farewell summary—"My battery is low and it’s getting dark"—became an emblem of robotic endurance. Opportunity rests in Perseverance Valley, silent after proving Mars was once wet.',
        telemetryLabel: 'Evidence Status',
        telemetryValue: 'CONFIRMED · MER-B',
      },
    ],
  },
  {
    id: 'story-voyager1',
    missionId: 'voyager-1',
    title: 'Voyager 1: A Message Beyond the Solar System',
    subtitle: 'Approaching one full light-day from Earth after nearly half a century',
    pillar: 'Time',
    durationRead: '3 min documentary',
    openingQuote:
      'Nearly fifty years after leaving Florida, a radio signal from Voyager 1 takes twenty-four hours to cross the dark.',
    chapters: [
      {
        index: 1,
        act: 'Opening',
        title: 'Leaving the Sun’s Bubble Behind',
        dateLabel: 'September 5, 1977',
        narrative:
          'Voyager 1 departed Earth in late summer 1977 on a high-speed trajectory toward Jupiter and Saturn, carrying 815 kg of instruments, nuclear RTGs, and a gold-plated phonograph record.',
        telemetryLabel: 'Cruising Speed',
        telemetryValue: '17 km/s (38,000 mph)',
      },
      {
        index: 2,
        act: 'Context',
        title: 'The Once-in-176-Year Alignment',
        dateLabel: '1979 – 1980',
        narrative:
          'Exploiting a rare outer-planet alignment, Voyager 1 discovered active sulfur volcanism on Io, intricate ring dynamics at Saturn, and Titan’s dense nitrogen atmosphere before angling steeply northward out of the ecliptic.',
        telemetryLabel: 'Primary Targets',
        telemetryValue: 'Jupiter & Saturn',
      },
      {
        index: 3,
        act: 'Objective',
        title: 'Searching for the Edge of the Sun',
        dateLabel: '1990 – 2012',
        narrative:
          'After turning back in 1990 to capture the "Pale Blue Dot" portrait of Earth, Voyager 1 pressed outward toward the heliopause—the boundary where solar wind yields to interstellar plasma.',
        telemetryLabel: 'Archive Distance',
        telemetryValue: '173 AU (25.9B km)',
      },
      {
        index: 4,
        act: 'Challenge',
        title: 'Fading Plutonium and Frozen Thrusters',
        dateLabel: 'Decades of Decay',
        narrative:
          'Every year, Voyager 1’s plutonium-238 generators lose electrical output. Engineers must carefully power down individual instrument heaters without letting hydrazine fuel lines freeze solid.',
        telemetryLabel: 'Round-Trip Light Time',
        telemetryValue: '48 Hours',
      },
      {
        index: 5,
        act: 'The Decision',
        title: 'Trading Instruments for One More Year of Whisper',
        dateLabel: 'Through 2026+',
        narrative:
          'Rather than shutting the mission down cleanly, NASA’s Voyager team systematically retires secondary subsystems to stretch interstellar plasma and magnetic telemetry past 2030.',
        telemetryLabel: 'Status',
        telemetryValue: 'Active · Power-Limited',
      },
      {
        index: 6,
        act: 'Discovery',
        title: 'First Direct Readings of Interstellar Space',
        dateLabel: 'August 2012',
        narrative:
          'In August 2012, Voyager 1’s plasma wave instrument recorded an abrupt density jump from 0.002 to 0.08 electrons per cubic centimeter—humanity’s first confirmed crossing into the interstellar medium.',
        telemetryLabel: 'Plasma Jump',
        telemetryValue: '0.002 → 0.08 cm⁻³',
      },
      {
        index: 7,
        act: 'Legacy',
        title: 'One Light-Day Away',
        dateLabel: 'Nov 18, 2026 Milestone',
        narrative:
          'At 173 AU (~25.9 billion km), Voyager 1 reaches one full light-day from Earth. Even when its last watt fades, the spacecraft and its Golden Record will orbit the Milky Way for billions of years.',
        telemetryLabel: 'Verification Note',
        telemetryValue: '2026 Milestone · Verify JPL',
        epistemicNote:
          'Dataset records Nov 18, 2026 as the 24 light-hour crossing date; confirm live timestamp against JPL Horizons.',
      },
    ],
  },
  {
    id: 'story-lcross',
    missionId: 'lcross',
    title: 'LCROSS: Destroying a Rocket to Discover Lunar Water',
    subtitle: 'How throwing 2.2 tons of spent steel into darkness illuminated Artemis science',
    pillar: 'Experiments',
    durationRead: '3 min documentary',
    openingQuote:
      'When sunlight has not touched a crater floor for billions of years, you bring the sample up to the light.',
    chapters: [
      {
        index: 1,
        act: 'Opening',
        title: 'A Cold Trap at the Bottom of the Moon',
        dateLabel: 'June 18, 2009',
        narrative:
          'Launched alongside the Lunar Reconnaissance Orbiter, LCROSS was a lean secondary payload engineered around a daring premise: recycle the spent Centaur upper stage as a kinetic excavator.',
        telemetryLabel: 'Combined Mass',
        telemetryValue: '2,366 kg',
      },
      {
        index: 2,
        act: 'Context',
        title: 'Hydrogen Without Confirmation',
        dateLabel: '1998 – 2009',
        narrative:
          'Earlier neutron measurements from Lunar Prospector revealed elevated hydrogen at the lunar poles, but scientists could not tell from orbit alone whether that hydrogen was locked inside true water-ice molecules.',
        telemetryLabel: 'Target Crater',
        telemetryValue: 'Cabeus (South Pole)',
      },
      {
        index: 3,
        act: 'Objective',
        title: 'Excavate Billions of Years of Shadow',
        dateLabel: 'October 2009',
        narrative:
          'Cabeus Crater’s floor lies in permanent shadow at cryogenic temperatures. LCROSS aimed to blast buried regolith 10 miles upward into high-altitude sunlight where spectrometers could analyze its chemistry.',
        telemetryLabel: 'Target Coordinates',
        telemetryValue: '84.9° S, 45.5° W',
      },
      {
        index: 4,
        act: 'Challenge',
        title: 'Four Minutes to Measure Everything',
        dateLabel: 'T-Minus 4 Minutes',
        narrative:
          'The shepherd spacecraft would be traveling directly behind the Centaur rocket on the exact same collision course—leaving barely four minutes to capture spectra of the debris curtain before its own destruction.',
        telemetryLabel: 'Impact Velocity',
        telemetryValue: '9,000 km/h',
      },
      {
        index: 5,
        act: 'The Decision',
        title: 'Two Controlled Impacts in Sequence',
        dateLabel: 'October 9, 2009',
        narrative:
          'After separating cleanly, the 2.2-ton empty Centaur struck Cabeus crater first. LCROSS flew straight into the ascending ejecta plume, beaming live near-infrared spectra home until it impacted four minutes later.',
        telemetryLabel: 'Plume Altitude',
        telemetryValue: '~10 miles',
      },
      {
        index: 6,
        act: 'Discovery',
        title: '5.6% Water Ice and Volatile Chemistry',
        dateLabel: 'Confirmed Spectra',
        narrative:
          'Near-infrared absorption bands at 1.4 and 1.9 micrometers confirmed water ice (~5.6% by mass in the sampled plume), alongside carbon monoxide, methane, ammonia, and sulfur compounds.',
        telemetryLabel: 'Water Ice Signal',
        telemetryValue: '1.4 & 1.9 μm Bands',
      },
      {
        index: 7,
        act: 'Legacy',
        title: 'A Foundation for Lunar Exploration',
        dateLabel: 'PDS Atmospheres',
        narrative:
          'By turning spent launch hardware into an instrument, LCROSS settled a decade-long lunar ice debate and anchored modern Artemis south-pole planning.',
        telemetryLabel: 'Evidence Status',
        telemetryValue: 'CONFIRMED · Science 2010',
      },
    ],
  },
  {
    id: 'story-lunar-prospector',
    missionId: 'lunar-prospector',
    title: "Lunar Prospector: A Scientist's Final Journey to the Moon",
    subtitle: 'Mapping polar hydrogen—and carrying Eugene Shoemaker home to the craters',
    pillar: 'Experiments',
    durationRead: '3 min documentary',
    openingQuote:
      'Denied spaceflight by illness in life, the founder of astrogeology reached the lunar south pole in brass foil.',
    chapters: [
      {
        index: 1,
        act: 'Opening',
        title: 'A Spin-Stabilized Scout on a Discovery Budget',
        dateLabel: 'January 7, 1998',
        narrative:
          'Weighing just 158 kg dry, Lunar Prospector launched as NASA’s Discovery 2 mission to map lunar composition, gravity, and magnetic anomalies from low polar orbit.',
        telemetryLabel: 'Hardware Mass',
        telemetryValue: '158 kg',
      },
      {
        index: 2,
        act: 'Context',
        title: 'The Teacher Who Trained the Moonwalkers',
        dateLabel: '1960s – 1997',
        narrative:
          'Planetary geologist Eugene Shoemaker pioneered crater-impact science and trained Apollo astronauts, yet Addison’s disease disqualified him from flying. He died in an Australian car crash in 1997.',
        telemetryLabel: 'Memorial Capsule',
        telemetryValue: '1 oz Ashes · Brass Foil',
      },
      {
        index: 3,
        act: 'Objective',
        title: 'Hunting Hydrogen at Both Poles',
        dateLabel: '1998 – 1999',
        narrative:
          'From a 100 km polar orbit, Lunar Prospector’s epithermal neutron spectrometer detected unmistakable localized drops in neutron flux over permanently shadowed polar craters—a classic fingerprint of hydrogen.',
        telemetryLabel: 'Primary Sensor',
        telemetryValue: 'Neutron Spectrometer',
      },
      {
        index: 4,
        act: 'Challenge',
        title: 'Proving Whether Hydrogen Meant Ice',
        dateLabel: 'July 1999',
        narrative:
          'As orbital fuel neared exhaustion, scientists faced a choice: let the spacecraft decay uncontrollably, or attempt an impact into a shadowed south pole crater to vaporize any trapped water into view of Earth telescopes.',
        telemetryLabel: 'Impact Site',
        telemetryValue: '87.7° S, 42.0° E',
      },
      {
        index: 5,
        act: 'The Decision',
        title: 'Controlled Impact Near Shoemaker Crater',
        dateLabel: 'July 31, 1999',
        narrative:
          'Controllers aimed Lunar Prospector into a shadowed southern crater while Hubble and the McDonald Observatory watched. Inside the spacecraft rode an ounce of Shoemaker’s ashes, wrapped in brass foil inscribed with Romeo and Juliet.',
        telemetryLabel: 'Impact Date',
        telemetryValue: 'July 31, 1999',
      },
      {
        index: 6,
        act: 'Discovery',
        title: 'No Earth-Detected Plume—Yet Polar Resources Mapped',
        dateLabel: 'Scientific Nuance',
        narrative:
          'Telescopes did not detect a water vapor signature from that small 158 kg impact, teaching researchers that heavier kinetic excavation (like LCROSS a decade later) was needed. Meanwhile, Prospector’s global elemental maps revolutionized lunar geology.',
        telemetryLabel: 'Mapped Elements',
        telemetryValue: 'Fe, Ti, U, Th, H',
      },
      {
        index: 7,
        act: 'Legacy',
        title: 'The Only Human Buried on the Moon',
        dateLabel: 'Shoemaker Crater',
        narrative:
          'Eugene Shoemaker remains the only human whose remains rest on the Moon—and Lunar Prospector’s hydrogen maps directly pointed LCROSS to Cabeus Crater ten years later.',
        telemetryLabel: 'Evidence Status',
        telemetryValue: 'CONFIRMED · PDS',
      },
    ],
  },
  {
    id: 'story-apollo-rovers',
    missionId: 'apollo-moon-buggies',
    title: 'Apollo Lunar Rovers: Machines Left Behind for Humanity',
    subtitle: 'Leaving 210 kg electric buggies behind so 382 kg of Moon could come home',
    pillar: 'Weight',
    durationRead: '3 min documentary',
    openingQuote:
      'Every kilogram saved on the surface meant one more kilogram of ancient lunar crust inside the ascent cabin.',
    chapters: [
      {
        index: 1,
        act: 'Opening',
        title: 'Folded Like Lawn Furniture',
        dateLabel: '1971 – 1972',
        narrative:
          'The Apollo Lunar Roving Vehicles (LRV 1–3) deployed from the Lunar Module descent bays of Apollo 15, 16, and 17—four-wheeled electric scouts weighing 210 kg on Earth but only ~34 kg in one-sixth lunar gravity.',
        telemetryLabel: 'Single Rover Mass',
        telemetryValue: '210 kg Earth / ~34 kg Moon',
      },
      {
        index: 2,
        act: 'Context',
        title: 'The Tyranny of the Rocket Equation',
        dateLabel: 'Apollo J-Missions',
        narrative:
          'Early Apollo astronauts explored on foot within a few hundred meters of the lander. To reach distant crater rims, fault scarps, and volcanic vents, NASA needed wheels—without adding return fuel.',
        telemetryLabel: 'Traverse Expansion',
        telemetryValue: 'Hundreds of m → 36+ km',
      },
      {
        index: 3,
        act: 'Objective',
        title: 'Trading Hardware for Planetary Memory',
        dateLabel: 'Hadley · Descartes · Taurus-Littrow',
        narrative:
          'The Lunar Module ascent stage was engineered to bare-minimum margins. Returning the rovers was physically impossible; their mission was to multiply geological reach and stay behind.',
        telemetryLabel: 'Total Moon Samples',
        telemetryValue: '382 kg Returned',
      },
      {
        index: 4,
        act: 'Challenge',
        title: 'Broken Fenders and Abrasive Dust',
        dateLabel: 'Apollo 17 · Dec 1972',
        narrative:
          'During Apollo 17, Gene Cernan accidentally snagged a hammer on the rear fender, snapping it off and throwing abrasive lunar dust over crew and radiators. On Earth, repair meant weeks; on the Moon, astronauts had minutes.',
        telemetryLabel: 'Field Repair',
        telemetryValue: '4 Maps + Tape + Clamps',
      },
      {
        index: 5,
        act: 'The Decision',
        title: 'Parking the Rovers & Pointing the Camera Home',
        dateLabel: 'Final Liftoff',
        narrative:
          'Before ascent, crews parked each LRV away from engine blast zones, leaving their remote-controlled TV cameras aimed back at the Lunar Module so Earth could watch liftoff from the Moon.',
        telemetryLabel: 'Apollo 15 Coordinates',
        telemetryValue: '26.132° N, 3.633° E',
      },
      {
        index: 6,
        act: 'Discovery',
        title: '382 Kilograms That Unlocked Solar System Chronology',
        dateLabel: 'LROC Verified',
        narrative:
          'Together, the J-mission traverses unlocked the bulk of Apollo’s 382 kg sample collection, dating lunar highlands, mare volcanism, and the Late Heavy Bombardment—and LROC still photographs their parked frames and wheel tracks.',
        telemetryLabel: 'Verification',
        telemetryValue: 'LROC NAC Imaged',
      },
      {
        index: 7,
        act: 'Legacy',
        title: 'Waiting in Vacuum Since 1972',
        dateLabel: 'Heritage Sites',
        narrative:
          'Alongside the zero-watt Apollo Retroreflectors—still bouncing laser pulses from Earth 55+ years later—the parked rovers stand as monuments to what engineers traded to bring the Moon home.',
        telemetryLabel: 'Evidence Status',
        telemetryValue: 'CONFIRMED · ALSJ',
      },
    ],
  },
];
