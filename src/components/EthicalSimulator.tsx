import React, { useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, RotateCcw } from 'lucide-react';
import { ETHICAL_DILEMMAS } from '../data/dilemmas';
import { getMissionById } from '../data/archive';
import type { MissionRecord } from '../types/archive';
import { spaceAudio } from '../utils/audio';

interface EthicalSimulatorProps {
  onSelectMission: (mission: MissionRecord) => void;
}

export const EthicalSimulator: React.FC<EthicalSimulatorProps> = ({ onSelectMission }) => {
  const [selectedDilemmaIdx, setSelectedDilemmaIdx] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});

  const dilemma = ETHICAL_DILEMMAS[selectedDilemmaIdx];
  const chosenOptionId = choices[dilemma.id];
  const linkedMission = getMissionById(dilemma.missionId);

  const chooseOption = (optionId: string) => {
    setChoices((prev) => ({ ...prev, [dilemma.id]: optionId }));
    spaceAudio.playTelemetryPing(587.33);
  };

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      <header className="max-w-3xl pb-6 border-b border-white/10">
        <p className="font-mono text-xs text-slate-400">
          The Last Decision · Interactive Ethical Simulation
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-semibold text-white tracking-tight">
          In the Mission Director’s Chair
        </h1>
        <p className="mt-3 text-base text-slate-300 leading-relaxed">
          Weigh fuel, alien ocean protection, cultural heritage, and scientific return in four historical end-of-mission dilemmas—then compare your judgment against NASA’s real archival record.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ETHICAL_DILEMMAS.map((d, idx) => {
          const active = idx === selectedDilemmaIdx;
          const resolved = Boolean(choices[d.id]);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDilemmaIdx(idx)}
              className={`text-left p-4 rounded-md border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#111827] border-white/40'
                  : 'bg-[#090D16] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Scenario 0{idx + 1}</span>
                {resolved && <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />}
              </div>
              <div className="mt-1.5 text-sm font-semibold text-white line-clamp-2">
                {d.scenarioTitle}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-md bg-[#090D16] border border-white/10 space-y-6">
          <div>
            <div className="font-mono text-xs text-[#86EFAC]">{dilemma.roleTitle}</div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">
              {dilemma.scenarioTitle}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed">
              {dilemma.briefing}
            </p>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              <strong className="text-white">Stakes:</strong> {dilemma.scientificStakes}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="font-mono text-xs text-slate-400">Select Your Directive</div>
            {dilemma.options.map((opt) => {
              const isSelected = chosenOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => chooseOption(opt.id)}
                  className={`w-full text-left p-4 rounded-md border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#131C2E] border-white/45'
                      : 'bg-[#05070B] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="text-sm font-semibold text-white">{opt.label}</div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    {opt.consequenceSummary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 rounded-md bg-[#090D16] border border-white/10 space-y-5">
          {!chosenOptionId ? (
            <div className="py-12 text-center space-y-3">
              <p className="font-mono text-xs text-slate-400">Awaiting Decision</p>
              <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
                Choose one of the directives on the left to reveal what happened in the historical mission and the scientific ethics behind it.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#86EFAC]">Historical Outcome Revealed</span>
                <button
                  type="button"
                  onClick={() =>
                    setChoices((prev) => {
                      const next = { ...prev };
                      delete next[dilemma.id];
                      return next;
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="p-4 rounded bg-[#05070B] border border-white/10 text-xs text-slate-200 leading-relaxed">
                {dilemma.options.find((o) => o.id === chosenOptionId)?.isHistoricalChoice
                  ? 'Your directive matches NASA’s historical mission decision.'
                  : 'You chose an alternative path. Here is how NASA directors resolved the dilemma:'}
              </div>

              <div>
                <h3 className="font-mono text-xs text-slate-400 mb-1.5">What Actually Happened</h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {dilemma.historicalOutcome}
                </p>
              </div>

              <div>
                <h3 className="font-mono text-xs text-slate-400 mb-1.5">
                  Scientific & Ethical Reasoning
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {dilemma.ethicalReasoning}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2">
                <a
                  href={dilemma.citationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-3 rounded bg-[#05070B] border border-white/10 hover:border-white/25 text-xs text-slate-200"
                >
                  <span className="truncate">{dilemma.citationLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                {linkedMission && (
                  <button
                    type="button"
                    onClick={() => onSelectMission(linkedMission)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-white text-[#05070B] text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Inspect {linkedMission.name} Dossier</span>
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
