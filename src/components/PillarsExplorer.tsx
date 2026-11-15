import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FlaskConical,
  Globe,
  Layers,
  LayoutGrid,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Weight,
} from 'lucide-react';
import {
  MISSIONS,
  PILLARS,
  PILLAR_COLORS,
  getVerificationFlagsForMission,
} from '../data/archive';
import type { MissionRecord, PillarId } from '../types/archive';
import { NasaImage } from './NasaImage';
import { spaceAudio } from '../utils/audio';

interface PillarsExplorerProps {
  loggedMissionIds: string[];
  onLogMissionPoints: (missionId: string, points: number) => void;
  onSelectMission: (mission: MissionRecord) => void;
}

const PILLAR_ICONS: Record<PillarId, React.ComponentType<{ className?: string }>> = {
  Weight: Scale,
  Experiments: FlaskConical,
  Protection: ShieldCheck,
  Time: Clock,
};

export const PillarsExplorer: React.FC<PillarsExplorerProps> = ({
  loggedMissionIds,
  onLogMissionPoints,
  onSelectMission,
}) => {
  const [selectedPillar, setSelectedPillar] = useState<PillarId | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'deck' | 'grid'>('deck');
  const [deckIndex, setDeckIndex] = useState(0);
  const swipeStartX = useRef<number | null>(null);

  const filteredMissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MISSIONS.filter((m) => {
      const matchesPillar = selectedPillar === 'All' || m.disposalReason === selectedPillar;
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.highlightTag.toLowerCase().includes(q);
      return matchesPillar && matchesQuery;
    });
  }, [selectedPillar, searchQuery]);

  useEffect(() => {
    setDeckIndex(0);
  }, [selectedPillar, searchQuery]);

  const safeIndex = filteredMissions.length > 0 ? deckIndex % filteredMissions.length : 0;
  const activeMission = filteredMissions[safeIndex];

  const stepDeck = useCallback(
    (delta: number) => {
      if (filteredMissions.length === 0) return;
      setDeckIndex((prev) => (prev + delta + filteredMissions.length) % filteredMissions.length);
      spaceAudio.playTelemetryPing(delta > 0 ? 540 : 440);
    },
    [filteredMissions.length],
  );

  const handleLog = useCallback(
    (mission: MissionRecord) => {
      const already = loggedMissionIds.includes(mission.id);
      if (!already) {
        onLogMissionPoints(mission.id, 25);
        spaceAudio.playTelemetryPing(698.46);
      } else {
        spaceAudio.playTelemetryPing(523.25);
      }
    },
    [loggedMissionIds, onLogMissionPoints],
  );

  useEffect(() => {
    if (viewMode !== 'deck') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepDeck(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepDeck(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stepDeck, viewMode]);

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Compact Header + Score Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#0F172A] border border-white/15 flex items-center justify-center text-[#7DD3FC]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              27 Missions Deck
            </h1>
            <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
              <span>Swipe or tap cards</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#6EE7B7] tabular-nums">
                Logged {loggedMissionIds.length}/27
              </span>
            </div>
          </div>
        </div>

        {/* Mode Toggle + Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mission or world…"
              aria-label="Filter missions"
              className="w-full pl-9 pr-3 py-2 min-h-[40px] rounded-md bg-[#0B0F18] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-md bg-[#0B0F18] border border-white/15">
            <button
              type="button"
              onClick={() => setViewMode('deck')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded text-xs font-mono cursor-pointer transition-colors ${
                viewMode === 'deck'
                  ? 'bg-white text-[#05070B] font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Deck</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded text-xs font-mono cursor-pointer transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-[#05070B] font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Icon Pillar Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedPillar('All')}
          className={`inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-md border text-xs font-mono transition-colors cursor-pointer ${
            selectedPillar === 'All'
              ? 'bg-white text-[#05070B] border-white font-semibold'
              : 'bg-[#0B0F18] text-slate-300 border-white/10 hover:border-white/30'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All ({MISSIONS.length})</span>
        </button>

        {PILLARS.map((pillar) => {
          const Icon = PILLAR_ICONS[pillar.id];
          const active = selectedPillar === pillar.id;
          const count = MISSIONS.filter((m) => m.disposalReason === pillar.id).length;
          return (
            <button
              key={pillar.id}
              type="button"
              onClick={() => setSelectedPillar(pillar.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-md border text-xs font-mono transition-colors cursor-pointer ${
                active
                  ? 'bg-[#162033] text-white border-white/50 font-semibold'
                  : 'bg-[#0B0F18] text-slate-300 border-white/10 hover:border-white/30'
              }`}
            >
              <span style={{ color: pillar.color }}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span>
                {pillar.id} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {filteredMissions.length === 0 ? (
        <div className="py-16 text-center rounded-md bg-[#090D16] border border-white/10 font-mono text-sm text-slate-400">
          No matching missions. Clear search to view all 27 records.
        </div>
      ) : viewMode === 'deck' && activeMission ? (
        /* ==================== INTERACTIVE SWIPE / TAP DECK ==================== */
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => stepDeck(-1)}
              aria-label="Previous mission card"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-md bg-[#0E1422] border border-white/15 text-xs font-mono text-slate-200 hover:border-white/40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <div className="font-mono text-xs text-slate-300 tabular-nums">
              Card {safeIndex + 1} / {filteredMissions.length}
            </div>

            <button
              type="button"
              onClick={() => stepDeck(1)}
              aria-label="Next mission card"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-md bg-[#0E1422] border border-white/15 text-xs font-mono text-slate-200 hover:border-white/40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Swipeable Visual Mission Card (Zero Paragraphs) */}
          {(() => {
            const Icon = PILLAR_ICONS[activeMission.disposalReason];
            const accent = PILLAR_COLORS[activeMission.disposalReason];
            const isLogged = loggedMissionIds.includes(activeMission.id);
            const flags = getVerificationFlagsForMission(activeMission.id);

            return (
              <div
                onPointerDown={(e) => {
                  swipeStartX.current = e.clientX;
                }}
                onPointerUp={(e) => {
                  if (swipeStartX.current === null) return;
                  const dx = e.clientX - swipeStartX.current;
                  swipeStartX.current = null;
                  if (dx > 48) stepDeck(-1);
                  else if (dx < -48) stepDeck(1);
                }}
                className="rounded-md bg-[#090D16] border-2 border-white/15 overflow-hidden shadow-xl touch-pan-y"
              >
                <NasaImage
                  src={activeMission.imageUrl}
                  alt={activeMission.name}
                  credit={activeMission.imageCredit}
                  aspectClass="aspect-[16/9]"
                />

                <div className="p-5 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 font-mono text-xs" style={{ color: accent }}>
                      <Icon className="w-4 h-4" />
                      <span>{activeMission.disposalReason}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300">{activeMission.region}</span>
                    </div>

                    {flags.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Verify Flag</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#6EE7B7]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{activeMission.evidenceLevel}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white">
                      {activeMission.name}
                    </h2>
                    <div className="mt-1 text-sm font-medium" style={{ color: accent }}>
                      {activeMission.highlightTag}
                    </div>
                  </div>

                  {/* 4 Crisp Icon Telemetry Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-md bg-[#0D1322] border border-white/10">
                      <Weight className="w-4 h-4 text-slate-400" />
                      <div className="mt-1.5 font-mono text-sm font-semibold text-white tabular-nums">
                        {activeMission.hardwareMassKg} kg
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">Mass</div>
                    </div>

                    <div className="p-3 rounded-md bg-[#0D1322] border border-white/10">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <div className="mt-1.5 font-mono text-sm font-semibold text-white truncate">
                        {activeMission.region}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">Zone</div>
                    </div>

                    <div className="p-3 rounded-md bg-[#0D1322] border border-white/10">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <div className="mt-1.5 font-mono text-sm font-semibold text-white truncate">
                        {activeMission.status}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">State</div>
                    </div>

                    <div className="p-3 rounded-md bg-[#0D1322] border border-white/10">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div className="mt-1.5 font-mono text-sm font-semibold text-white truncate tabular-nums">
                        {activeMission.launchDate}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">Launch</div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleLog(activeMission);
                        if (!isLogged) {
                          stepDeck(1);
                        }
                      }}
                      className={`flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-md font-mono text-xs font-bold transition-colors cursor-pointer ${
                        isLogged
                          ? 'bg-[#091512] border border-[#34D399] text-[#6EE7B7]'
                          : 'bg-[#FCD34D] text-[#05070B] hover:bg-amber-300'
                      }`}
                    >
                      {isLogged ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>DISCOVERY LOGGED</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>LOG & NEXT (+25 PTS)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectMission(activeMission)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-md bg-white text-[#05070B] font-mono text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <span>Open Dossier</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tap Progress Strip */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {filteredMissions.map((m, idx) => {
              const current = idx === safeIndex;
              const done = loggedMissionIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDeckIndex(idx)}
                  aria-label={`Jump to ${m.name}`}
                  className={`h-2.5 rounded-xs transition-all cursor-pointer ${
                    current
                      ? 'w-6 bg-white'
                      : done
                        ? 'w-2.5 bg-[#34D399]'
                        : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* ==================== COMPACT ICON GRID (ZERO PARAGRAPHS) ==================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMissions.map((mission) => {
            const Icon = PILLAR_ICONS[mission.disposalReason];
            const color = PILLAR_COLORS[mission.disposalReason];
            const isLogged = loggedMissionIds.includes(mission.id);
            const flags = getVerificationFlagsForMission(mission.id);

            return (
              <div
                key={mission.id}
                className={`rounded-md bg-[#090D16] border transition-colors overflow-hidden flex flex-col ${
                  isLogged ? 'border-[#34D399]/60' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectMission(mission)}
                  className="text-left flex-1 flex flex-col cursor-pointer"
                >
                  <NasaImage
                    src={mission.imageUrl}
                    alt={mission.name}
                    aspectClass="aspect-[16/9]"
                  />

                  <div className="p-4 space-y-2.5 flex-1">
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1.5" style={{ color }}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{mission.disposalReason}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-400 tabular-nums">
                        <Weight className="w-3 h-3" />
                        <span>{mission.hardwareMassKg} kg</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                      {mission.name}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>{mission.region}</span>
                      </span>
                      {flags.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Verify</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                <div className="px-4 py-2.5 border-t border-white/10 bg-[#070B13] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleLog(mission)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[11px] font-bold cursor-pointer ${
                      isLogged
                        ? 'text-[#6EE7B7] bg-[#091512]'
                        : 'text-[#05070B] bg-[#FCD34D] hover:bg-amber-300'
                    }`}
                  >
                    {isLogged ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Logged</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+25 PTS</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectMission(mission)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
                  >
                    <span>Dossier</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
