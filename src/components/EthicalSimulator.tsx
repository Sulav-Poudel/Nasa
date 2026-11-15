import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Flame,
  FlaskConical,
  Landmark,
  Orbit,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Wind,
} from 'lucide-react';
import { ETHICAL_DILEMMAS, type ResourceKey } from '../data/dilemmas';
import { getMissionById } from '../data/archive';
import type { MissionRecord } from '../types/archive';
import { spaceAudio } from '../utils/audio';

interface EthicalSimulatorProps {
  resolvedTrialIds: string[];
  onResolveTrial: (dilemmaId: string, points: number) => void;
  onSelectMission: (mission: MissionRecord) => void;
}

const SCENARIO_ICONS = [Orbit, Landmark, Target, Wind];

const METER_CONFIG: {
  key: ResourceKey;
  label: string;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'fuel', label: 'Fuel', color: '#E5B880', Icon: Flame },
  { key: 'science', label: 'Science', color: '#7DD3FC', Icon: FlaskConical },
  { key: 'safety', label: 'Bio-Safe', color: '#86EFAC', Icon: ShieldCheck },
  { key: 'heritage', label: 'Heritage', color: '#D8B4FE', Icon: Landmark },
];

export const EthicalSimulator: React.FC<EthicalSimulatorProps> = ({
  resolvedTrialIds,
  onResolveTrial,
  onSelectMission,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [hoveredOptId, setHoveredOptId] = useState<string | null>(null);

  const dilemma = ETHICAL_DILEMMAS[selectedIdx];
  const chosenOptionId = choices[dilemma.id];
  const activeOption =
    dilemma.options.find((o) => o.id === (hoveredOptId ?? chosenOptionId)) ?? null;
  const confirmedOption = dilemma.options.find((o) => o.id === chosenOptionId) ?? null;
  const linkedMission = getMissionById(dilemma.missionId);

  const chooseOption = (optId: string, bonusPoints: number, isHistorical: boolean) => {
    setChoices((prev) => ({ ...prev, [dilemma.id]: optId }));
    onResolveTrial(dilemma.id, bonusPoints);
    if (isHistorical) {
      spaceAudio.playTelemetryPing(698.46);
    } else {
      spaceAudio.playTelemetryPing(466.16);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Compact Icon Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#091512] border border-[#34D399]/50 flex items-center justify-center text-[#6EE7B7]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Director Trials
            </h1>
            <div className="font-mono text-xs text-slate-400">
              Visual Command Cards · Resource Meters · Bonus Science Points
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-slate-400">TRIALS CLEARED:</span>
          <span className="text-[#6EE7B7] font-bold tabular-nums">
            {resolvedTrialIds.length} / {ETHICAL_DILEMMAS.length}
          </span>
        </div>
      </div>

      {/* Visual Scenario Switcher Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ETHICAL_DILEMMAS.map((d, idx) => {
          const Icon = SCENARIO_ICONS[idx % SCENARIO_ICONS.length];
          const active = idx === selectedIdx;
          const solved = resolvedTrialIds.includes(d.id) || Boolean(choices[d.id]);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setSelectedIdx(idx);
                setHoveredOptId(null);
                spaceAudio.playTelemetryPing(520);
              }}
              className={`text-left p-3.5 rounded-md border-2 transition-all cursor-pointer ${
                active
                  ? 'bg-[#121A2C] border-[#FCD34D]'
                  : solved
                    ? 'bg-[#091512] border-[#34D399]/50 hover:border-[#34D399]'
                    : 'bg-[#090D16] border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4 text-[#7DD3FC]" />
                {solved && <CheckCircle2 className="w-4 h-4 text-[#6EE7B7]" />}
              </div>
              <div className="mt-2 font-mono text-[11px] text-slate-400">{d.roleTitle}</div>
              <div className="mt-0.5 text-sm font-semibold text-white truncate">
                {d.scenarioTitle.split(':')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Console: Resource Meters + Visual Icon Command Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 4 Live Resource Meters + Minimal Briefing */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-md bg-[#090D16] border border-white/15 space-y-5">
          <div>
            <div className="font-mono text-xs text-[#FCD34D]">{dilemma.roleTitle}</div>
            <h2 className="mt-1 text-xl font-semibold text-white">{dilemma.scenarioTitle}</h2>
            <p className="mt-1.5 text-xs text-slate-300">{dilemma.stakesLine}</p>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="font-mono text-[11px] text-slate-400">MISSION RESOURCE METERS</div>
            {METER_CONFIG.map(({ key, label, color, Icon }) => {
              const baseVal = dilemma.baseMeters[key];
              const delta = activeOption ? activeOption.deltas[key] : 0;
              const finalVal = Math.max(0, Math.min(100, baseVal + delta));
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="inline-flex items-center gap-1.5 text-slate-200">
                      <span style={{ color }}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span>{label}</span>
                    </span>
                    <div className="flex items-center gap-2 tabular-nums">
                      {delta !== 0 && (
                        <span
                          className={`text-[11px] font-bold ${
                            delta > 0 ? 'text-[#6EE7B7]' : 'text-amber-300'
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                      <span className="text-white font-semibold">{finalVal}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-xs bg-[#05070B] border border-white/10 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${finalVal}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Visual Icon Command Cards & Instant Reward Outcome */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {dilemma.options.map((opt) => {
              const isSelected = chosenOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onMouseEnter={() => setHoveredOptId(opt.id)}
                  onMouseLeave={() => setHoveredOptId(null)}
                  onClick={() => chooseOption(opt.id, opt.bonusPoints, opt.isHistoricalChoice)}
                  className={`text-left p-4 rounded-md border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-[#12221C] border-[#34D399]'
                      : 'bg-[#090D16] border-white/15 hover:border-[#FCD34D]'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="text-[#7DD3FC] font-bold">{opt.badgeTag}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-[#FCD34D] inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>+{opt.bonusPoints} PTS</span>
                      </span>
                    </div>
                    <div className="text-base font-semibold text-white">{opt.label}</div>
                    <div className="text-xs text-slate-300">{opt.shortAction}</div>
                  </div>

                  {/* Quick Delta Preview Icons */}
                  <div className="hidden sm:grid grid-cols-2 gap-1.5 shrink-0 font-mono text-[10px] tabular-nums">
                    {METER_CONFIG.map(({ key, Icon, color }) => {
                      const d = opt.deltas[key];
                      return (
                        <div
                          key={key}
                          className="px-2 py-1 rounded bg-[#05070B] border border-white/10 flex items-center gap-1"
                        >
                          <span style={{ color }}>
                            <Icon className="w-3 h-3" />
                          </span>
                          <span className={d >= 0 ? 'text-[#6EE7B7]' : 'text-amber-300'}>
                            {d > 0 ? `+${d}` : d}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Outcome Strip */}
          {confirmedOption && (
            <div className="p-5 rounded-md bg-[#091512] border-2 border-[#34D399] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 font-mono text-xs font-bold text-[#6EE7B7]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {confirmedOption.isHistoricalChoice
                      ? `HISTORICAL NASA CALL · +${confirmedOption.bonusPoints} PTS`
                      : `ALTERNATIVE PATH · +${confirmedOption.bonusPoints} PTS`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setChoices((prev) => {
                      const next = { ...prev };
                      delete next[dilemma.id];
                      return next;
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>

              <p className="text-sm text-slate-100">{dilemma.historicalOutcome}</p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <a
                  href={dilemma.citationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-sky-300 hover:text-white"
                >
                  <span>{dilemma.citationLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {linkedMission && (
                  <button
                    type="button"
                    onClick={() => onSelectMission(linkedMission)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-white text-[#05070B] font-mono text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Dossier</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
