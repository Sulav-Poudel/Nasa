import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Search } from 'lucide-react';
import {
  MISSIONS,
  PILLARS,
  PILLAR_COLORS,
  REPORTED_STATS,
  getVerificationFlagsForMission,
} from '../data/archive';
import type { MissionRecord, PillarId } from '../types/archive';
import { NasaImage } from './NasaImage';

interface PillarsExplorerProps {
  onSelectMission: (mission: MissionRecord) => void;
}

export const PillarsExplorer: React.FC<PillarsExplorerProps> = ({ onSelectMission }) => {
  const [selectedPillar, setSelectedPillar] = useState<PillarId | 'All'>('Weight');
  const [searchQuery, setSearchQuery] = useState('');
  const [lcrossPlumeStep, setLcrossPlumeStep] = useState<0 | 1 | 2>(1);
  const [apolloMassChoice, setApolloMassChoice] = useState<'samples' | 'rover'>('samples');

  const activePillarObj = useMemo(
    () => PILLARS.find((p) => p.id === selectedPillar) ?? PILLARS[0],
    [selectedPillar],
  );

  const filteredMissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MISSIONS.filter((m) => {
      const matchesPillar = selectedPillar === 'All' || m.disposalReason === selectedPillar;
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.scienceReturn.toLowerCase().includes(q);
      return matchesPillar && matchesQuery;
    });
  }, [selectedPillar, searchQuery]);

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-10">
      <header className="max-w-3xl">
        <p className="font-mono text-xs text-slate-400">
          Four Reasons · Twenty-Seven Stories
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-semibold text-white tracking-tight">
          Why Humanity Leaves Machines Behind
        </h1>
        <p className="mt-3 text-base text-slate-300 leading-relaxed">
          Every spacecraft in this archive stayed beyond Earth for a distinct engineering, scientific, ethical, or physical reason. Select a pillar to inspect its mechanism and explore the mission records.
        </p>
      </header>

      {/* Pillar Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-md bg-[#0B0F18] border border-white/10">
          {PILLARS.map((pillar) => {
            const active = selectedPillar === pillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setSelectedPillar(pillar.id)}
                className={`px-4 py-2 min-h-[40px] rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'bg-white text-[#05070B] font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {pillar.title}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedPillar('All')}
            className={`px-4 py-2 min-h-[40px] rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedPillar === 'All'
                ? 'bg-white text-[#05070B] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All 27 Missions
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by mission, world, discovery…"
            aria-label="Filter missions"
            className="w-full pl-9 pr-3 py-2 min-h-[40px] rounded-md bg-[#0B0F18] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
          />
        </div>
      </div>

      {/* Interactive Scientific Explanation Panel per Pillar */}
      {selectedPillar !== 'All' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch p-6 sm:p-8 rounded-md bg-[#090D16] border border-white/10">
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div>
              <span
                className="font-mono text-xs"
                style={{ color: PILLAR_COLORS[activePillarObj.id] }}
              >
                Pillar · {activePillarObj.title}
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">
                {activePillarObj.summary}
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {activePillarObj.detail}
              </p>
            </div>
            <p className="font-mono text-xs text-slate-400 pt-4 border-t border-white/10">
              Showing {filteredMissions.length} documented mission{filteredMissions.length === 1 ? '' : 's'} tagged "{activePillarObj.id}" in the dataset
            </p>
          </div>

          <div className="lg:col-span-7 p-5 rounded-md bg-[#05070B] border border-white/10 flex flex-col justify-between">
            {selectedPillar === 'Weight' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Ascent Mass Trade-Off: Hardware vs. Moon Rocks
                  </h3>
                  <div className="flex items-center gap-1 p-1 rounded bg-[#0E131F] border border-white/10">
                    <button
                      type="button"
                      onClick={() => setApolloMassChoice('samples')}
                      className={`px-3 py-1 text-xs rounded cursor-pointer ${
                        apolloMassChoice === 'samples'
                          ? 'bg-[#E5B880] text-[#05070B] font-semibold'
                          : 'text-slate-300'
                      }`}
                    >
                      Return 382 kg Rocks
                    </button>
                    <button
                      type="button"
                      onClick={() => setApolloMassChoice('rover')}
                      className={`px-3 py-1 text-xs rounded cursor-pointer ${
                        apolloMassChoice === 'rover'
                          ? 'bg-[#E5B880] text-[#05070B] font-semibold'
                          : 'text-slate-300'
                      }`}
                    >
                      Return 210 kg Rover
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {apolloMassChoice === 'samples'
                    ? 'Leaving each 210 kg Lunar Roving Vehicle and 77 kg of zero-watt laser retroreflectors on the Moon freed strict Lunar Module ascent mass—enabling astronauts to bring home 382 kg of lunar rock and core samples while the LRRR mirrors still work 55+ years later.'
                    : 'Attempting to lift a 210 kg rover off the Moon would consume critical ascent stage fuel margins and displace geological samples—the exact constraint that made Apollo J-missions leave rovers parked permanently.'}
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded bg-[#0C111C] border border-white/10">
                    <div className="font-mono text-xl font-semibold text-[#E5B880] tabular-nums">
                      {REPORTED_STATS.moonRocksReturnedKg} kg
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Lunar Samples Returned</div>
                  </div>
                  <div className="p-3 rounded bg-[#0C111C] border border-white/10">
                    <div className="font-mono text-xl font-semibold text-white tabular-nums">
                      210 kg
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Single LRV Earth Mass</div>
                  </div>
                  <div className="p-3 rounded bg-[#0C111C] border border-white/10">
                    <div className="font-mono text-xl font-semibold text-white tabular-nums">
                      0 W
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">LRRR Power Required</div>
                  </div>
                </div>
              </div>
            )}

            {selectedPillar === 'Experiments' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Destructive Sensing: LCROSS Crater Excavation Sequence
                  </h3>
                  <div className="flex items-center gap-1 p-1 rounded bg-[#0E131F] border border-white/10">
                    {(['1. Centaur Strike', '2. Plume Spectra', '3. DART & Impact Proof'] as const).map(
                      (label, idx) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setLcrossPlumeStep(idx as 0 | 1 | 2)}
                          className={`px-2.5 py-1 text-xs rounded cursor-pointer ${
                            lcrossPlumeStep === idx
                              ? 'bg-[#7DD3FC] text-[#05070B] font-semibold'
                              : 'text-slate-300'
                          }`}
                        >
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lcrossPlumeStep === 0 &&
                    'A 2.2-ton spent Centaur upper stage plunged into permanently shadowed Cabeus Crater at 9,000 km/h, blasting cryogenic floor regolith 10 miles upward into high-altitude sunlight.'}
                  {lcrossPlumeStep === 1 &&
                    'Following four minutes behind, the LCROSS shepherd flew straight through the sunlit ejecta curtain—recording 1.4 and 1.9 μm water-ice absorption bands (~5.6% water ice by mass) before impacting itself.'}
                  {lcrossPlumeStep === 2 &&
                    `Across deliberate impactors, destruction is the instrument: Deep Impact vaporized 372 kg of pure copper inside Comet Tempel 1 (4.8 tons TNT equivalent), and DART shifted asteroid moonlet Dimorphos's orbit by ${REPORTED_STATS.dimorphosOrbitShiftMinutes} minutes.`}
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded bg-[#0C111C] border border-white/10">
                    <div className="font-mono text-xl font-semibold text-[#7DD3FC] tabular-nums">
                      ~5.6%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Cabeus Water Ice by Mass</div>
                  </div>
                  <div className="p-3 rounded bg-[#0C111C] border border-white/10">
                    <div className="font-mono text-xl font-semibold text-white tabular-nums">
                      {REPORTED_STATS.dimorphosOrbitShiftMinutes} min
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">DART Orbit Shift</div>
                  </div>
                  <div className="p-3 rounded bg-[#0C111C] border border-white/10">
                    <div className="font-mono text-xl font-semibold text-white tabular-nums">
                      9,000 km/h
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">LCROSS Impact Velocity</div>
                  </div>
                </div>
              </div>
            )}

            {selectedPillar === 'Protection' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Planetary & Heritage Protection Protocols
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When spacecraft carry trace terrestrial microbes or orbit sensitive destinations, controlled disposal prevents irreversible contamination. Cassini plunged into Saturn at 77,000 mph to safeguard Enceladus and Titan oceans; twin GRAIL orbiters impacted a northern lunar ridge to avoid disturbing historic Apollo sites.
                </p>
                <div className="p-3 rounded bg-amber-950/25 border border-amber-500/25 text-xs text-amber-100/90 leading-relaxed">
                  <strong className="font-semibold">Archive Verification Note:</strong> The JSON also tags MESSENGER under Protection, though its 2015 Mercury impact resulted from propellant depletion under solar gravity rather than biological ocean protection.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-[#0C111C] border border-white/10">
                    <div className="font-mono text-xl font-semibold text-[#86EFAC] tabular-nums">
                      2,150 kg
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Cassini Vaporized at Saturn</div>
                  </div>
                  <div className="p-3 rounded bg-[#0C111C] border border-white/10">
                    <div className="font-mono text-xl font-semibold text-white tabular-nums">
                      75.62° N
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">GRAIL Sally Ride Impact Ridge</div>
                  </div>
                </div>
              </div>
            )}

            {selectedPillar === 'Time' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Endurance Far Beyond Design Lifetimes
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Machines built for weeks or months repeatedly outlasted their warranties until Martian dust, cold winters, or plutonium decay closed the link—or are still transmitting across interstellar space.
                </p>
                <div className="space-y-2.5 pt-1">
                  {[
                    { name: 'Voyager 1', planned: '5 yrs (Grand Tour)', actual: '49 yrs · 173 AU', pct: 100 },
                    { name: 'Opportunity', planned: '90 sols', actual: '5,111 sols (45.16 km)', pct: 92 },
                    { name: 'Spirit', planned: '90 sols', actual: '2,208 sols', pct: 68 },
                    { name: 'Ingenuity', planned: '5 flights (30 days)', actual: '72 flights (3 yrs)', pct: 78 },
                    { name: 'Viking 1 Lander', planned: '90 days', actual: '6+ years', pct: 60 },
                  ].map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white font-medium">{item.name}</span>
                        <span className="font-mono text-slate-400 tabular-nums">
                          Planned {item.planned} → {item.actual}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#D8B4FE]"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mission Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMissions.map((mission) => {
          const flags = getVerificationFlagsForMission(mission.id);
          const color = PILLAR_COLORS[mission.disposalReason];
          return (
            <button
              key={mission.id}
              type="button"
              onClick={() => onSelectMission(mission)}
              className="group text-left rounded-md bg-[#090D16] border border-white/10 hover:border-white/30 transition-colors overflow-hidden flex flex-col cursor-pointer"
            >
              <NasaImage
                src={mission.imageUrl}
                alt={mission.name}
                credit={mission.imageCredit}
                aspectClass="aspect-[16/9]"
              />
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400">
                    <span style={{ color }}>{mission.disposalReason}</span>
                    <span aria-hidden="true">·</span>
                    <span>{mission.region}</span>
                    <span aria-hidden="true">·</span>
                    <span>{mission.status}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{mission.hardwareMassKg} kg</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-slate-100 leading-snug">
                    {mission.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 line-clamp-3 leading-relaxed">
                    {mission.highlightTag}. {mission.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                  {flags.length > 0 ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Verify Flag ({flags.length})</span>
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-slate-400">
                      {mission.evidenceLevel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-medium text-slate-200 group-hover:text-white">
                    <span>Open Dossier</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
