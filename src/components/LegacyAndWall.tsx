import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  COMPUTED_AUDIT,
  DATASET_VERIFICATION_FLAGS,
  MISSIONS,
  PILLARS,
  PILLAR_COLORS,
  REPORTED_STATS,
} from '../data/archive';
import type { MissionRecord } from '../types/archive';
import { MemoryWall3D } from './MemoryWall3D';

interface LegacyAndWallProps {
  litMemoryIds: string[];
  onLightMemory: (missionId: string, points: number) => void;
  onSelectMission: (mission: MissionRecord) => void;
}

export const LegacyAndWall: React.FC<LegacyAndWallProps> = ({
  litMemoryIds,
  onLightMemory,
  onSelectMission,
}) => {
  const sortedByMass = useMemo(
    () => [...MISSIONS].sort((a, b) => b.hardwareMassKg - a.hardwareMassKg).slice(0, 8),
    [],
  );
  const maxMass = sortedByMass[0]?.hardwareMassKg || 2500;

  return (
    <div className="space-y-12">
      {/* INTERACTIVE 3D PHYSICS PARTICLE MEMORY WALL */}
      <MemoryWall3D
        litMemoryIds={litMemoryIds}
        onLightMemory={onLightMemory}
        onSelectMission={onSelectMission}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-12 space-y-16">
      {/* H. THE SCIENTIFIC LEGACY */}
      <section className="space-y-8">
        <header className="max-w-3xl pb-6 border-b border-white/10">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">
            Beyond the memorial · the mission legacy
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl text-white tracking-tight">
            A legacy measured in discovery.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-300">
            Twenty-seven missions left more than hardware behind. Explore what they returned, revealed, and taught us. Figures come from this archive; source notes explain where its records need a closer look.
          </p>
        </header>

        {/* Key Verified Benchmarks */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-md bg-[#090D16] border border-white/10">
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
              {COMPUTED_AUDIT.totalMissions}
            </div>
            <div className="text-xs text-slate-400 mt-1">Documented Missions</div>
          </div>
          <div className="p-5 rounded-md bg-[#090D16] border border-white/10">
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#E5B880] tabular-nums">
              {REPORTED_STATS.moonRocksReturnedKg} kg
            </div>
            <div className="text-xs text-slate-400 mt-1">Apollo Moon Rocks Returned</div>
          </div>
          <div className="p-5 rounded-md bg-[#090D16] border border-white/10">
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#D8B4FE] tabular-nums">
              {REPORTED_STATS.voyager1DistanceAU} AU
            </div>
            <div className="text-xs text-slate-400 mt-1">Voyager 1 (~1 Light-Day)</div>
          </div>
          <div className="p-5 rounded-md bg-[#090D16] border border-white/10">
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#7DD3FC] tabular-nums">
              {REPORTED_STATS.marsquakesDetected.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Marsquakes Detected (InSight)</div>
          </div>
          <div className="p-5 rounded-md bg-[#090D16] border border-white/10">
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#86EFAC] tabular-nums">
              {REPORTED_STATS.ingenuityFlights}
            </div>
            <div className="text-xs text-slate-400 mt-1">Ingenuity Powered Flights</div>
          </div>
        </div>

        {/* Two Analytical Panels: Mass Comparison + Distance Scale */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 p-6 rounded-md bg-[#090D16] border border-white/10 space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">Largest recorded spacecraft masses</h2>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                Archive total: {COMPUTED_AUDIT.totalMassKg.toLocaleString()} kg
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Mass figures use each mission&apos;s reported value; measurement methods can differ between records.
            </p>
            <div className="space-y-3">
              {sortedByMass.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMission(m)}
                  className="w-full text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-200 group-hover:text-white font-medium truncate pr-3">
                      {m.name}
                    </span>
                    <span className="font-mono text-slate-300 tabular-nums shrink-0">
                      {m.hardwareMassKg.toLocaleString()} kg · {m.disposalReason}
                    </span>
                  </div>
                  <div className="h-2 rounded-sm bg-white/10 overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${(m.hardwareMassKg / maxMass) * 100}%`,
                        backgroundColor: PILLAR_COLORS[m.disposalReason],
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-md bg-[#090D16] border border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Breakdown by Region, Pillar & Evidence
              </h2>

              <div>
                <div className="font-mono text-[11px] text-slate-400 mb-2">
                  Computed Missions by Region
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(COMPUTED_AUDIT.byRegion).map(([region, count]) => (
                    <div key={region} className="p-3 rounded bg-[#05070B] border border-white/10">
                      <div className="font-mono text-lg font-semibold text-white tabular-nums">
                        {count}
                      </div>
                      <div className="text-xs text-slate-400">{region}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-[11px] text-slate-400 mb-2">
                  Voyager 1 Heliocentric Distance Scale (AU)
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Earth–Moon</span>
                    <span className="tabular-nums">0.0026 AU</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Mars Orbit</span>
                    <span className="tabular-nums">~1.52 AU</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Saturn (Cassini)</span>
                    <span className="tabular-nums">~9.5 AU</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>New Horizons (Kuiper Belt)</span>
                    <span className="tabular-nums">64 AU</span>
                  </div>
                  <div className="flex justify-between text-[#D8B4FE] font-semibold">
                    <span>Voyager 1 (1 Light-Day)</span>
                    <span className="tabular-nums">173 AU (~25.9B km)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Evidence Levels</span>
              <span className="text-slate-200 tabular-nums">
                CONFIRMED: {COMPUTED_AUDIT.byEvidenceLevel.CONFIRMED ?? 0} · SCIENTISTS_THINK:{' '}
                {COMPUTED_AUDIT.byEvidenceLevel.SCIENTISTS_THINK ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Archive Verification Audit Table */}
        <details className="group rounded-xl border border-white/10 bg-[#090D16]">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5 sm:p-7">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>About the archive data</span>
              </div>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Some source records need context.
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
                Compare mission counts and read notes about claims that may need current verification.
              </p>
            </div>
            <span className="inline-flex items-center gap-3 font-mono text-xs text-slate-300">
              {DATASET_VERIFICATION_FLAGS.length} notes
              <span className="text-[#7DD3FC] group-open:hidden">Read notes ↓</span>
              <span className="hidden text-[#7DD3FC] group-open:inline">Close notes ↑</span>
            </span>
          </summary>

          <div className="space-y-5 border-t border-white/10 p-5 sm:p-7">
            <h3 className="text-sm font-semibold text-white">Mission counts by pillar</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/15 text-slate-400">
                    <th className="py-2 pr-4">Pillar</th>
                    <th className="py-2 pr-4">Mission records</th>
                    <th className="py-2 pr-4">Source stats</th>
                    <th className="py-2">Pillar summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-200">
                  {PILLARS.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-4 font-semibold" style={{ color: p.color }}>
                        {p.title}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {COMPUTED_AUDIT.byPillar[p.id]}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {REPORTED_STATS.byPillar[p.id] ?? 0}
                      </td>
                      <td className="py-2.5 tabular-nums">{p.missionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
              {DATASET_VERIFICATION_FLAGS.map((flag) => {
                const mission = flag.targetId
                  ? MISSIONS.find((item) => item.id === flag.targetId)
                  : undefined;

                return (
                  <article
                    key={flag.id}
                    className="space-y-2 rounded-lg border border-white/10 bg-[#05070B] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-amber-300">
                      <span>
                        {flag.severity === 'future-dated'
                          ? 'CHECK CURRENT SOURCE'
                          : flag.severity === 'nuance'
                            ? 'ADDED CONTEXT'
                            : flag.severity === 'disputed'
                              ? 'UNRESOLVED EVIDENCE'
                              : 'DATASET CHECK'}
                      </span>
                      {mission && (
                        <button
                          type="button"
                          onClick={() => onSelectMission(mission)}
                          className="underline underline-offset-2 hover:text-white"
                        >
                          Open {mission.name}
                        </button>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold leading-snug text-white">{flag.title}</h4>
                    <p className="text-sm leading-relaxed text-slate-300">{flag.detail}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </details>
      </section>

      <footer className="py-12 text-center space-y-4 border-t border-white/10">
        <p className="font-display text-xl sm:text-3xl text-slate-200 max-w-2xl mx-auto">
          From the Moon to the edge of the solar system, these machines still have stories to tell.
        </p>
        <p className="font-display text-2xl sm:text-4xl font-semibold text-white tracking-tight">
          Abandoned. Not forgotten.
        </p>
      </footer>
      </div>
    </div>
  );
};
