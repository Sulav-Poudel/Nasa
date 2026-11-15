import React, { useMemo, useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import {
  COMPUTED_AUDIT,
  DATASET_VERIFICATION_FLAGS,
  MISSIONS,
  PILLARS,
  PILLAR_COLORS,
  REPORTED_STATS,
} from '../data/archive';
import type { MissionRecord } from '../types/archive';
import { spaceAudio } from '../utils/audio';

interface LegacyAndWallProps {
  onSelectMission: (mission: MissionRecord) => void;
}

export const LegacyAndWall: React.FC<LegacyAndWallProps> = ({ onSelectMission }) => {
  const [focusedMemoryId, setFocusedMemoryId] = useState<string>('voyager-1');

  const focusedMission = useMemo(
    () => MISSIONS.find((m) => m.id === focusedMemoryId) ?? MISSIONS[0],
    [focusedMemoryId],
  );

  const sortedByMass = useMemo(
    () => [...MISSIONS].sort((a, b) => b.hardwareMassKg - a.hardwareMassKg).slice(0, 8),
    [],
  );
  const maxMass = sortedByMass[0]?.hardwareMassKg || 2500;

  // Deterministic quiet starfield coordinates for the 27 Memory Wall lights
  const memoryStars = useMemo(() => {
    return MISSIONS.map((m, idx) => {
      const col = idx % 9;
      const row = Math.floor(idx / 9);
      const jitterX = ((idx * 37) % 10) - 5;
      const jitterY = ((idx * 53) % 14) - 7;
      return {
        mission: m,
        xPct: 8 + col * 10.5 + jitterX * 0.45,
        yPct: 18 + row * 28 + jitterY * 0.8,
      };
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-16">
      {/* H. THE SCIENTIFIC LEGACY */}
      <section className="space-y-8">
        <header className="max-w-3xl pb-6 border-b border-white/10">
          <p className="font-mono text-xs text-slate-400">
            The Scientific Legacy · Quantitative Evidence & Data Audit
          </p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            What 18,103.8 Kilograms Left Behind Bought Humanity
          </h1>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Every figure below is computed directly from the 27 mission records, with internal dataset discrepancies explicitly audited for verification.
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
              <h2 className="text-lg font-semibold text-white">
                Heaviest Documented Spacecraft Mass (kg)
              </h2>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                Computed Sum: {COMPUTED_AUDIT.totalMassKg.toLocaleString()} kg
              </span>
            </div>
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
        <div className="p-6 sm:p-8 rounded-md bg-[#090D16] border border-amber-500/30 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Archive Verification & Data Integrity Audit</span>
              </div>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Identified Dataset Discrepancies & 2026-Dated Claims
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {DATASET_VERIFICATION_FLAGS.length} flagged notes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-white/15 text-slate-400">
                  <th className="py-2 pr-4">Pillar</th>
                  <th className="py-2 pr-4">Actual Missions Array</th>
                  <th className="py-2 pr-4">stats.byPillar</th>
                  <th className="py-2">pillars[].missionCount</th>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {DATASET_VERIFICATION_FLAGS.map((flag) => (
              <div
                key={flag.id}
                className="p-3.5 rounded bg-[#05070B] border border-white/10 space-y-1"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-amber-300">
                  <span>{flag.severity.toUpperCase()}</span>
                  {flag.targetId && (
                    <button
                      type="button"
                      onClick={() => {
                        const m = MISSIONS.find((x) => x.id === flag.targetId);
                        if (m) onSelectMission(m);
                      }}
                      className="underline hover:text-white cursor-pointer"
                    >
                      Inspect {flag.targetId}
                    </button>
                  )}
                </div>
                <div className="text-xs font-semibold text-white">{flag.title}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{flag.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. THE MEMORY WALL */}
      <section className="pt-8 border-t border-white/10 space-y-8">
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Memory Wall · 27 Points of Light</span>
          </div>
          <h2 className="mt-2 text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            Lights Left Across the Dark
          </h2>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Each point of light represents a spacecraft in this archive. Select any light to remember its destination, operational span, and enduring contribution.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 relative min-h-[380px] rounded-md bg-[#030509] border border-white/10 overflow-hidden p-4">
            {memoryStars.map(({ mission, xPct, yPct }) => {
              const active = mission.id === focusedMemoryId;
              const color = PILLAR_COLORS[mission.disposalReason];
              return (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => {
                    setFocusedMemoryId(mission.id);
                    spaceAudio.playTelemetryPing(640);
                  }}
                  aria-label={`Select ${mission.name}`}
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 p-2.5 group cursor-pointer focus:outline-none"
                >
                  <span
                    className={`block rounded-full transition-transform ${
                      active ? 'w-3.5 h-3.5 scale-125' : 'w-2 h-2 group-hover:scale-150'
                    }`}
                    style={{
                      backgroundColor: color,
                      boxShadow: active ? `0 0 18px 4px ${color}` : `0 0 8px 1px ${color}66`,
                    }}
                  />
                  <span className="sr-only">{mission.name}</span>
                </button>
              );
            })}

            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Click any light to read its memorial</span>
              <span>27 Spacecraft</span>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 rounded-md bg-[#090D16] border border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                <span style={{ color: PILLAR_COLORS[focusedMission.disposalReason] }}>
                  {focusedMission.disposalReason}
                </span>
                <span aria-hidden="true">·</span>
                <span>{focusedMission.status}</span>
                <span aria-hidden="true">·</span>
                <span>{focusedMission.region}</span>
              </div>
              <h3 className="text-2xl font-semibold text-white">{focusedMission.name}</h3>
              <dl className="space-y-3 text-sm pt-2 border-t border-white/10">
                <div>
                  <dt className="font-mono text-[11px] text-slate-400">Destination</dt>
                  <dd className="text-slate-200">{focusedMission.location}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] text-slate-400">Operational Span</dt>
                  <dd className="text-slate-200 tabular-nums">
                    {focusedMission.launchDate} → {focusedMission.eventDate}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] text-slate-400">Scientific Contribution</dt>
                  <dd className="text-slate-300 leading-relaxed">
                    {focusedMission.scienceReturn}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] text-slate-400">Legacy</dt>
                  <dd className="text-slate-200 leading-relaxed">
                    {focusedMission.humanStory}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              type="button"
              onClick={() => onSelectMission(focusedMission)}
              className="w-full py-2.5 px-4 rounded-md border border-white/20 text-xs font-semibold text-white hover:bg-white hover:text-[#05070B] transition-colors cursor-pointer"
            >
              Open Full Archival Record
            </button>
          </div>
        </div>

        <footer className="py-14 text-center space-y-4 border-t border-white/10">
          <p className="font-display text-xl sm:text-3xl text-slate-200 max-w-2xl mx-auto">
            Somewhere on the Moon, Mars, Saturn, and beyond, our machines are still telling stories.
          </p>
          <p className="font-display text-2xl sm:text-4xl font-semibold text-white tracking-tight">
            Abandoned. Not forgotten.
          </p>
        </footer>
      </section>
    </div>
  );
};
