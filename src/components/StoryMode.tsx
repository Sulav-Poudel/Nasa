import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, FileText } from 'lucide-react';
import { INTERACTIVE_STORIES } from '../data/stories';
import { PILLAR_COLORS, getMissionById } from '../data/archive';
import type { MissionRecord } from '../types/archive';
import { spaceAudio } from '../utils/audio';
import { NasaImage } from './NasaImage';

interface StoryModeProps {
  onSelectMission: (mission: MissionRecord) => void;
}

export const StoryMode: React.FC<StoryModeProps> = ({ onSelectMission }) => {
  const [storyId, setStoryId] = useState(INTERACTIVE_STORIES[0].id);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const story = useMemo(
    () => INTERACTIVE_STORIES.find((s) => s.id === storyId) ?? INTERACTIVE_STORIES[0],
    [storyId],
  );
  const mission = useMemo(() => getMissionById(story.missionId), [story.missionId]);
  const chapter = story.chapters[chapterIdx] ?? story.chapters[0];
  const accent = PILLAR_COLORS[story.pillar];

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => {
      setChapterIdx((prev) => {
        if (prev >= story.chapters.length - 1) {
          setAutoPlay(false);
          return prev;
        }
        spaceAudio.playTelemetryPing(440 + prev * 40);
        return prev + 1;
      });
    }, 6500);
    return () => window.clearInterval(timer);
  }, [autoPlay, story.chapters.length]);

  const handleSelectStory = (id: string) => {
    setStoryId(id);
    setChapterIdx(0);
    setAutoPlay(false);
    spaceAudio.playTelemetryPing(520);
  };

  const goToChapter = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(story.chapters.length - 1, nextIdx));
    setChapterIdx(clamped);
    if (clamped === 4 && story.pillar === 'Experiments') {
      spaceAudio.playImpactCue();
    } else {
      spaceAudio.playTelemetryPing(420 + clamped * 45);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="max-w-2xl">
          <p className="font-mono text-xs text-slate-400">
            The Final Transmission · Interactive Documentary Mode
          </p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            Six Voyages in Seven Acts
          </h1>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Grounded step-by-step chronicles reconstructed directly from NASA PDS citations, engineering constraints, and human stories.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAutoPlay((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-md bg-[#0D121D] border border-white/15 text-xs font-medium text-white hover:border-white/35 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{autoPlay ? 'Pause Documentary' : 'Auto-Advance Chapters'}</span>
        </button>
      </header>

      {/* Story Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {INTERACTIVE_STORIES.map((s) => {
          const active = s.id === story.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectStory(s.id)}
              className={`text-left p-4 rounded-md border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#111827] border-white/40'
                  : 'bg-[#090D16] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span style={{ color: PILLAR_COLORS[s.pillar] }}>{s.pillar}</span>
                <span aria-hidden="true">·</span>
                <span>{s.durationRead}</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-white">{s.title}</div>
            </button>
          );
        })}
      </div>

      {/* Main Documentary Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-md bg-[#090D16] border border-white/10 p-6 sm:p-8">
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span style={{ color: accent }}>
                Act 0{chapter.index} / 07 · {chapter.act}
              </span>
              <span aria-hidden="true">·</span>
              <span>{chapter.dateLabel}</span>
            </div>

            <h2 className="mt-3 text-2xl sm:text-4xl font-semibold text-white leading-tight">
              {chapter.title}
            </h2>

            <p className="mt-5 text-base sm:text-lg text-slate-200 leading-relaxed">
              {chapter.narrative}
            </p>

            {chapter.epistemicNote && (
              <p className="mt-4 p-3 rounded bg-amber-950/30 border border-amber-500/30 text-xs text-amber-100/90 leading-relaxed">
                {chapter.epistemicNote}
              </p>
            )}
          </div>

          <div className="space-y-5 pt-5 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] text-slate-400">
                  {chapter.telemetryLabel}
                </div>
                <div className="font-mono text-lg font-semibold text-white tabular-nums mt-0.5">
                  {chapter.telemetryValue}
                </div>
              </div>

              {mission && (
                <button
                  type="button"
                  onClick={() => onSelectMission(mission)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-md border border-white/15 text-xs font-medium text-slate-200 hover:text-white hover:border-white/35 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Full Mission Dossier</span>
                </button>
              )}
            </div>

            {/* Chapter Progress Scrubber */}
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-1.5">
                {story.chapters.map((c, idx) => (
                  <button
                    key={c.index}
                    type="button"
                    onClick={() => goToChapter(idx)}
                    aria-label={`Jump to Act ${c.index}: ${c.title}`}
                    className={`h-2 rounded-sm transition-colors cursor-pointer ${
                      idx <= chapterIdx ? 'opacity-100' : 'bg-white/15 hover:bg-white/30'
                    }`}
                    style={idx <= chapterIdx ? { backgroundColor: accent } : undefined}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToChapter(chapterIdx - 1)}
                  disabled={chapterIdx === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-md border border-white/15 text-xs font-medium text-slate-200 disabled:opacity-35 hover:border-white/35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Act</span>
                </button>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {chapterIdx + 1} / {story.chapters.length}
                </span>
                <button
                  type="button"
                  onClick={() => goToChapter(chapterIdx + 1)}
                  disabled={chapterIdx === story.chapters.length - 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-md bg-white text-[#05070B] text-xs font-semibold disabled:opacity-35 hover:bg-slate-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Next Act</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          {mission && (
            <NasaImage
              src={mission.imageUrl}
              alt={mission.name}
              credit={mission.imageCredit}
              aspectClass="aspect-[16/11] lg:h-full lg:min-h-[380px]"
              className="rounded-md"
            />
          )}
          <blockquote className="p-4 rounded-md bg-[#05070B] border border-white/10 text-sm italic text-slate-300 font-display">
            “{story.openingQuote}”
          </blockquote>
        </div>
      </div>
    </section>
  );
};
