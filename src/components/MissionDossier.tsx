import React, { useEffect } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';
import type { MissionRecord } from '../types/archive';
import { PILLAR_COLORS, getVerificationFlagsForMission } from '../data/archive';
import { NasaImage } from './NasaImage';

interface MissionDossierProps {
  mission: MissionRecord | null;
  onClose: () => void;
  onAskMissionControl?: (missionName: string) => void;
}

export const MissionDossier: React.FC<MissionDossierProps> = ({
  mission,
  onClose,
  onAskMissionControl,
}) => {
  useEffect(() => {
    if (!mission) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mission, onClose]);

  if (!mission) return null;

  const accentColor = PILLAR_COLORS[mission.disposalReason];
  const flags = getVerificationFlagsForMission(mission.id);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-title"
      onClick={onClose}
    >
      <aside
        className="relative w-full max-w-2xl h-full overflow-y-auto bg-[#080B12] border-l border-white/10 p-6 sm:p-8 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-slate-400">
              <span style={{ color: accentColor }}>{mission.disposalReason}</span>
              <span aria-hidden="true">·</span>
              <span>{mission.region}</span>
              <span aria-hidden="true">·</span>
              <span>{mission.status}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{mission.hardwareMassKg} kg</span>
            </div>
            <h2
              id="dossier-title"
              className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white"
            >
              {mission.name}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{mission.designation}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close mission dossier"
            className="p-2.5 min-w-[40px] min-h-[40px] rounded-md border border-white/10 text-slate-300 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6">
          <NasaImage
            src={mission.imageUrl}
            alt={mission.name}
            credit={mission.imageCredit}
            className="rounded-md"
          />
        </div>

        <p className="mt-5 text-sm font-medium" style={{ color: accentColor }}>
          {mission.highlightTag}
        </p>

        <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-white/10 text-sm">
          <div>
            <dt className="font-mono text-[11px] text-slate-400">Location</dt>
            <dd className="mt-1 text-slate-200">{mission.location}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] text-slate-400">Coordinates / Trajectory</dt>
            <dd className="mt-1 font-mono text-xs text-slate-200">{mission.coordinates}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] text-slate-400">Launch Date</dt>
            <dd className="mt-1 text-slate-200 tabular-nums">{mission.launchDate}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] text-slate-400">Disposal / Milestone</dt>
            <dd className="mt-1 text-slate-200 tabular-nums">{mission.eventDate}</dd>
          </div>
        </dl>

        {flags.length > 0 && (
          <div className="mt-5 p-4 rounded-md bg-amber-950/30 border border-amber-500/30">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Archive Verification Notice</span>
            </div>
            <ul className="mt-2 space-y-2 text-xs text-amber-100/90 leading-relaxed">
              {flags.map((flag) => (
                <li key={flag.id}>
                  <strong className="font-semibold">{flag.title}:</strong> {flag.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-slate-300">
          <section>
            <h3 className="text-xs font-mono text-slate-400 mb-1.5">Hardware Overview</h3>
            <p>{mission.description}</p>
          </section>

          <section>
            <h3 className="text-xs font-mono text-slate-400 mb-1.5">
              Scientific Discovery · {mission.evidenceLevel}
            </h3>
            <p className="text-slate-200">{mission.scienceReturn}</p>
            <p className="mt-2 text-xs font-mono text-slate-400">{mission.evidenceNote}</p>
          </section>

          <section>
            <h3 className="text-xs font-mono text-slate-400 mb-1.5">Human Story</h3>
            <p className="text-slate-200">{mission.humanStory}</p>
          </section>

          <section className="pt-4 border-t border-white/10">
            <h3 className="text-xs font-mono text-slate-400 mb-3">NASA & Scientific Sources</h3>
            <ul className="space-y-2">
              {mission.nasaDataSources.map((source) => (
                <li key={source.citationId}>
                  <a
                    href={source.datasetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 p-3 rounded-md bg-[#0E1422] border border-white/10 hover:border-white/25 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
                        {source.title}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {source.citationId}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {onAskMissionControl && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAskMissionControl(`Why was ${mission.name} left behind or sacrificed, and what did it discover?`);
                }}
                className="w-full py-2.5 px-4 rounded-md bg-white text-[#05070B] text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Ask Mission Control about {mission.name}
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
