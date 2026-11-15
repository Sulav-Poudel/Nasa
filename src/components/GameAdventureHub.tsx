import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  FastForward,
  Move3d,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { GAME_ADVENTURES, type GameAdventure, type StoryChoiceOption } from '../data/gameAdventures';
import { getMissionById, PILLAR_COLORS } from '../data/archive';
import type { MissionRecord } from '../types/archive';
import { DetailedCraftStage, type CraftManeuver } from './DetailedCraftStage';
import { CHARACTERS, GameCharacterPortrait, type CharacterId } from './GameCharacters';
import { NasaImage } from './NasaImage';
import { spaceAudio } from '../utils/audio';

export interface PlayerProgress {
  completedIds: string[];
  scienceScore: number;
  unlockedDiscoveries: string[];
}

interface GameAdventureHubProps {
  progress: PlayerProgress;
  onRecordCompletion: (adventureId: string, earnedPoints: number, discoveries: string[]) => void;
  onResetProgress: () => void;
  onSelectMission: (mission: MissionRecord) => void;
  onBackToUniverse: () => void;
}

type StageMode = 'HUB' | 'PLAYING' | 'DEBRIEF';

export const GameAdventureHub: React.FC<GameAdventureHubProps> = ({
  progress,
  onRecordCompletion,
  onResetProgress,
  onSelectMission,
  onBackToUniverse,
}) => {
  const [stageMode, setStageMode] = useState<StageMode>('HUB');
  const [hoveredAdv, setHoveredAdv] = useState<GameAdventure | null>(null);
  const [activeAdv, setActiveAdv] = useState<GameAdventure | null>(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const [pendingFeedback, setPendingFeedback] = useState<{
    speaker: CharacterId;
    text: string;
    maneuver: CraftManeuver;
    choice: StoryChoiceOption;
  } | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionDiscoveries, setSessionDiscoveries] = useState<string[]>([]);
  const [autoRotate, setAutoRotate] = useState(true);

  const currentBeat = activeAdv ? activeAdv.beats[beatIndex] : null;
  const activeMissionRecord = useMemo(
    () => (activeAdv ? getMissionById(activeAdv.missionId) : undefined),
    [activeAdv],
  );

  const startAdventure = (adv: GameAdventure) => {
    setActiveAdv(adv);
    setBeatIndex(0);
    setPendingFeedback(null);
    setSessionPoints(50); // Base launch readiness points
    setSessionDiscoveries([]);
    setStageMode('PLAYING');
    spaceAudio.playTelemetryPing(587.33);
  };

  const finishAdventure = useCallback(
    (adv: GameAdventure, pts: number, discoveries: string[]) => {
      onRecordCompletion(adv.id, pts, discoveries);
      setStageMode('DEBRIEF');
      spaceAudio.playTelemetryPing(783.99);
    },
    [onRecordCompletion],
  );

  const handleAdvanceBeat = useCallback(() => {
    if (!activeAdv || !currentBeat) return;

    // If waiting on a choice, require clicking one of the choices rather than advancing blindly
    if (currentBeat.choices && !pendingFeedback) {
      return;
    }

    spaceAudio.playTelemetryPing(523.25);

    if (pendingFeedback) {
      setPendingFeedback(null);
    }

    if (beatIndex + 1 < activeAdv.beats.length) {
      setBeatIndex((prev) => prev + 1);
    } else {
      finishAdventure(activeAdv, sessionPoints, sessionDiscoveries);
    }
  }, [
    activeAdv,
    beatIndex,
    currentBeat,
    finishAdventure,
    pendingFeedback,
    sessionDiscoveries,
    sessionPoints,
  ]);

  const handlePickChoice = (choice: StoryChoiceOption) => {
    if (!activeAdv) return;
    setSessionPoints((p) => p + choice.points);
    setSessionDiscoveries((prev) =>
      prev.includes(choice.unlockedDiscovery) ? prev : [...prev, choice.unlockedDiscovery],
    );
    setPendingFeedback({
      speaker: choice.feedbackSpeaker,
      text: choice.feedbackText,
      maneuver: choice.maneuver,
      choice,
    });
    if (choice.isOptimal) {
      spaceAudio.playTelemetryPing(698.46);
    } else {
      spaceAudio.playImpactCue();
    }
  };

  // Keyboard navigation (Space/Enter advances dialogue)
  useEffect(() => {
    if (stageMode !== 'PLAYING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'BUTTON') return;
        e.preventDefault();
        handleAdvanceBeat();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleAdvanceBeat, stageMode]);

  // ==================== VIEW 1: MISSION SCENARIO HUB ====================
  if (stageMode === 'HUB') {
    const guideDialogue = hoveredAdv
      ? `${hoveredAdv.fullTitle}: ${hoveredAdv.guideIntro}`
      : `Welcome aboard! Humanity left 27 spacecraft across the Solar System—each with a purpose. Hover or select any scenario card above to command its mission story (${progress.completedIds.length}/${GAME_ADVENTURES.length} completed).`;

    return (
      <section className="min-h-[calc(100vh-64px)] bg-[#060911] text-slate-100 flex flex-col justify-between p-4 sm:p-6">
        {/* Top Game Scenario Banner (inspired by attached hub frame) */}
        <div className="max-w-7xl w-full mx-auto">
          <div className="rounded-md bg-[#091512] border-2 border-[#34D399]/70 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            {/* Left Progress Cells */}
            <div className="hidden sm:flex items-center gap-1.5" aria-label="Completed missions count">
              {GAME_ADVENTURES.map((a) => {
                const done = progress.completedIds.includes(a.id);
                return (
                  <span
                    key={a.id}
                    className={`w-2 h-5 rounded-xs border ${
                      done
                        ? 'bg-[#34D399] border-[#6EE7B7]'
                        : 'bg-[#0F1E1A] border-[#34D399]/35'
                    }`}
                    title={`${a.shortTitle}: ${done ? 'Completed' : 'Pending'}`}
                  />
                );
              })}
            </div>

            <div className="text-center flex-1">
              <h1 className="font-mono text-lg sm:text-2xl font-bold tracking-[0.14em] text-[#6EE7B7]">
                MISSION SCENARIOS
              </h1>
              <p className="font-mono text-[11px] sm:text-xs text-slate-300 mt-0.5">
                Abandoned, Not Forgotten · Interactive Spacecraft Adventure
              </p>
            </div>

            {/* Right Score Readout */}
            <div className="text-right shrink-0">
              <div className="font-mono text-[10px] text-slate-400">SCIENCE PTS</div>
              <div className="font-mono text-base sm:text-lg font-bold text-[#FCD34D] tabular-nums">
                {progress.scienceScore}
              </div>
            </div>
          </div>

          {/* Sub-bar with BACK + Reset */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToUniverse}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-md bg-[#111827] border-2 border-[#926239] text-xs font-mono text-amber-100 hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>STAR MAP</span>
            </button>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span>
                CLEARED:{' '}
                <strong className="text-white tabular-nums">
                  {progress.completedIds.length}/{GAME_ADVENTURES.length}
                </strong>
              </span>
              {progress.completedIds.length > 0 && (
                <button
                  type="button"
                  onClick={onResetProgress}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Save</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center Scenario Grid */}
        <div className="max-w-6xl w-full mx-auto my-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {GAME_ADVENTURES.map((adv) => {
            const mission = getMissionById(adv.missionId);
            const done = progress.completedIds.includes(adv.id);
            const accent = PILLAR_COLORS[adv.pillar];
            return (
              <button
                key={adv.id}
                type="button"
                onClick={() => startAdventure(adv)}
                onMouseEnter={() => setHoveredAdv(adv)}
                onFocus={() => setHoveredAdv(adv)}
                onMouseLeave={() => setHoveredAdv(null)}
                className={`group text-left rounded-md bg-[#121926] border-2 transition-all p-2.5 flex flex-col cursor-pointer hover:-translate-y-0.5 ${
                  done
                    ? 'border-[#34D399]/75 hover:border-[#6EE7B7]'
                    : 'border-[#7C5836] hover:border-[#E5B880]'
                }`}
              >
                <div className="relative rounded-xs overflow-hidden bg-[#05070B]">
                  {mission ? (
                    <NasaImage
                      src={mission.imageUrl}
                      alt={adv.shortTitle}
                      aspectClass="aspect-[4/3]"
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-[#0B101B]" />
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-2 px-1 font-mono text-[10px]">
                    <span style={{ color: accent }}>{adv.pillar.toUpperCase()}</span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-[#6EE7B7]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>CLEARED</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">{adv.difficulty.toUpperCase()}</span>
                    )}
                  </div>
                </div>

                <div className="mt-2 px-1 pb-1">
                  <div className="font-mono text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                    {adv.shortTitle}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                    {adv.locationLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom-Left Guide + Dialogue Box & Bottom Telemetry Pips */}
        <div className="max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="shrink-0 flex items-end gap-3">
              <GameCharacterPortrait character="guide" className="w-24 h-28 sm:w-28 sm:h-32" />
            </div>

            <div className="w-full max-w-xl rounded-md bg-[#0D1322] border-2 border-[#34D399] p-4 shadow-lg">
              <div className="inline-block px-2.5 py-0.5 bg-[#10B981] text-[#04140E] font-mono text-[11px] font-bold tracking-wider">
                GUIDE · {CHARACTERS.guide.badge}
              </div>
              <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-slate-100">
                {guideDialogue}
              </p>
            </div>
          </div>

          {/* Corner Indicator Pips (mirroring screenshot footer dots) */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {GAME_ADVENTURES.map((a) => (
                <span
                  key={`pip-l-${a.id}`}
                  className={`w-2 h-2 rounded-xs ${
                    progress.completedIds.includes(a.id) ? 'bg-[#34D399]' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <div className="font-mono text-[11px] text-slate-500">
              {progress.unlockedDiscoveries.length} VERIFIED DISCOVERIES LOGGED
            </div>
            <div className="flex items-center gap-1.5">
              {GAME_ADVENTURES.map((a) => (
                <span
                  key={`pip-r-${a.id}`}
                  className={`w-2 h-2 rounded-xs ${
                    progress.completedIds.includes(a.id) ? 'bg-[#FCD34D]' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ==================== VIEW 2: PLAYABLE 3D STORY STAGE ====================
  if (stageMode === 'PLAYING' && activeAdv && currentBeat) {
    const activeSpeaker = pendingFeedback ? pendingFeedback.speaker : currentBeat.speaker;
    const speakerMeta = CHARACTERS[activeSpeaker];
    const activeText = pendingFeedback ? pendingFeedback.text : currentBeat.text;
    const activeManeuver: CraftManeuver = pendingFeedback
      ? pendingFeedback.maneuver
      : currentBeat.maneuver ?? 'idle';
    const awaitingChoice = Boolean(currentBeat.choices && !pendingFeedback);

    return (
      <section className="relative w-full h-[calc(100vh-64px)] min-h-[640px] bg-[#04060B] text-slate-100 overflow-hidden select-none">
        {/* Full-Bleed Live Interactive Detailed 3D Spacecraft Stage */}
        <DetailedCraftStage
          modelId={activeAdv.modelId}
          environment={activeAdv.environment}
          maneuver={activeManeuver}
          autoRotate={autoRotate}
          className="absolute inset-0 w-full h-full"
        />

        {/* Top Framed Mission Title Banner */}
        <div className="pointer-events-none relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-3">
          <div className="pointer-events-auto rounded-md bg-[#091512]/95 border-2 border-[#34D399]/80 px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="hidden md:flex items-center gap-1.5">
              {activeAdv.beats.map((b, i) => (
                <span
                  key={b.id}
                  className={`w-2 h-4 rounded-xs ${
                    i <= beatIndex ? 'bg-[#FCD34D]' : 'bg-[#0F241D]'
                  }`}
                />
              ))}
            </div>

            <div className="text-center flex-1">
              <div className="font-mono text-sm sm:text-lg font-bold tracking-[0.12em] text-[#6EE7B7]">
                {activeAdv.fullTitle}
              </div>
              <div className="font-mono text-[11px] text-slate-300">
                {currentBeat.actLabel} · {activeAdv.locationLabel}
              </div>
            </div>

            <div className="font-mono text-xs text-[#FCD34D] tabular-nums shrink-0">
              +{sessionPoints} PTS
            </div>
          </div>

          {/* Top Controls Row: ← BACK | 3D Controls Hint | SKIP ⏭ */}
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStageMode('HUB')}
              className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-md bg-[#111827] border-2 border-[#7C5836] text-xs font-mono text-amber-100 hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>SCENARIOS</span>
            </button>

            <div className="pointer-events-auto hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#080B12]/90 border border-white/15 font-mono text-[11px] text-slate-300">
              <Move3d className="w-3.5 h-3.5 text-sky-300" />
              <span>{currentBeat.inspectHint || 'Drag 3D spacecraft to inspect hardware details'}</span>
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                className="ml-2 px-2 py-0.5 rounded bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              >
                {autoRotate ? 'Pause Spin' : 'Spin'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => finishAdventure(activeAdv, sessionPoints, sessionDiscoveries)}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-md bg-[#1F2430] border-2 border-[#7C5836] text-xs font-mono text-amber-100 hover:bg-[#2A3140] transition-colors cursor-pointer"
            >
              <span>SKIP</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Interactive Character + Dialogue / Decision HUD */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 sm:px-6 pb-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-5">
            {/* Bottom-Left Speaker Portrait */}
            <div className="pointer-events-auto shrink-0">
              <GameCharacterPortrait
                character={activeSpeaker}
                className="w-20 h-24 sm:w-28 sm:h-32"
              />
            </div>

            {/* Bottom-Center Dialogue / Choice Box */}
            <div className="pointer-events-auto flex-1 w-full">
              {awaitingChoice && currentBeat.choices && (
                <div className="mb-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentBeat.choices.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handlePickChoice(option)}
                      className="text-left p-3.5 rounded-md bg-[#0C1322] border-2 border-[#FCD34D]/80 hover:border-white hover:bg-[#16213A] transition-all cursor-pointer"
                    >
                      <div className="font-mono text-xs font-bold text-[#FCD34D]">
                        COMMAND OPTION
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {option.label}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-300">{option.sublabel}</div>
                    </button>
                  ))}
                </div>
              )}

              <div
                role={!awaitingChoice ? 'button' : undefined}
                tabIndex={!awaitingChoice ? 0 : undefined}
                onClick={() => {
                  if (!awaitingChoice) handleAdvanceBeat();
                }}
                onKeyDown={(e) => {
                  if (!awaitingChoice && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleAdvanceBeat();
                  }
                }}
                className={`rounded-md bg-[#0E1424]/95 border-2 p-4 sm:p-5 transition-colors ${
                  awaitingChoice
                    ? 'border-[#FCD34D]'
                    : 'border-[#34D399] hover:border-[#6EE7B7] cursor-pointer'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="inline-block px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-[#04140E]"
                    style={{ backgroundColor: speakerMeta.accent }}
                  >
                    {speakerMeta.badge}
                  </span>

                  {(currentBeat.telemetryBadge || pendingFeedback?.choice.unlockedDiscovery) && (
                    <span className="font-mono text-[11px] text-slate-300">
                      {pendingFeedback
                        ? `+${pendingFeedback.choice.points} PTS`
                        : currentBeat.telemetryBadge}
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-100 select-text">
                  {activeText}
                </p>

                {pendingFeedback && (
                  <p className="mt-2 font-mono text-xs text-[#6EE7B7]">
                    {pendingFeedback.choice.unlockedDiscovery}
                  </p>
                )}

                <div className="mt-3 text-center font-mono text-[11px] tracking-widest">
                  {awaitingChoice ? (
                    <span className="text-[#FCD34D]">SELECT A MISSION COMMAND ABOVE</span>
                  ) : (
                    <span className="text-[#34D399]">▾ CLICK TO CONTINUE ▾</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Corner Step Pips */}
          <div className="max-w-7xl mx-auto mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {activeAdv.beats.map((b, i) => (
                <span
                  key={`stage-l-${b.id}`}
                  className={`w-2 h-2 rounded-xs ${
                    i <= beatIndex ? 'bg-[#34D399]' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {activeAdv.beats.map((b, i) => (
                <span
                  key={`stage-r-${b.id}`}
                  className={`w-2 h-2 rounded-xs ${
                    i <= beatIndex ? 'bg-[#34D399]' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ==================== VIEW 3: EPISODE COMPLETE DEBRIEF ====================
  if (stageMode === 'DEBRIEF' && activeAdv) {
    return (
      <section className="min-h-[calc(100vh-64px)] bg-[#060911] text-slate-100 px-5 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto rounded-md bg-[#0B101C] border-2 border-[#34D399] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <div className="font-mono text-xs text-[#6EE7B7] tracking-wider">
                MISSION LOG COMPLETE
              </div>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-white">
                {activeAdv.fullTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-[#091512] border border-[#34D399]/60">
              <Award className="w-5 h-5 text-[#FCD34D]" />
              <div>
                <div className="font-mono text-[10px] text-slate-400">EARNED BADGE</div>
                <div className="font-mono text-xs font-bold text-[#FCD34D]">
                  {activeAdv.rewardBadge}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="h-64 rounded-md overflow-hidden border border-white/10 bg-[#04060B]">
              <DetailedCraftStage
                modelId={activeAdv.modelId}
                environment={activeAdv.environment}
                maneuver="scan"
                autoRotate={true}
                className="w-full h-full"
              />
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-md bg-[#0F172A] border border-white/10 flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">MISSION SCORE</span>
                <span className="font-mono text-xl font-bold text-[#FCD34D] tabular-nums">
                  +{sessionPoints} PTS
                </span>
              </div>

              <div className="p-4 rounded-md bg-[#0F172A] border border-white/10">
                <div className="flex items-center gap-2 font-mono text-xs text-[#6EE7B7] mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>DISCOVERIES LOGGED</span>
                </div>
                {sessionDiscoveries.length > 0 ? (
                  <ul className="space-y-1.5 text-sm text-slate-200">
                    {sessionDiscoveries.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-300">
                    {activeMissionRecord?.scienceReturn}
                  </p>
                )}
              </div>

              {activeAdv.epistemicNote && (
                <div className="p-3 rounded-md bg-amber-950/30 border border-amber-500/30 text-xs font-mono text-amber-200">
                  Verification Note: {activeAdv.epistemicNote}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setStageMode('HUB')}
                className="px-4 py-2.5 min-h-[42px] rounded-md bg-white text-[#05070B] text-xs font-mono font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                BACK TO SCENARIOS
              </button>
              <button
                type="button"
                onClick={() => startAdventure(activeAdv)}
                className="px-4 py-2.5 min-h-[42px] rounded-md border border-white/20 text-xs font-mono text-slate-200 hover:border-white/40 cursor-pointer"
              >
                REPLAY MISSION
              </button>
            </div>

            {activeMissionRecord && (
              <button
                type="button"
                onClick={() => onSelectMission(activeMissionRecord)}
                className="px-4 py-2.5 min-h-[42px] rounded-md bg-[#13251F] border border-[#34D399]/60 text-xs font-mono text-[#6EE7B7] hover:bg-[#1B332B] cursor-pointer"
              >
                OPEN FULL NASA DOSSIER →
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return null;
};
