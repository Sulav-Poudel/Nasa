import React, { useEffect, useState } from 'react';
import { getMissionById } from './data/archive';
import type { AppView, MissionRecord } from './types/archive';
import { LastTransmissionIntro } from './components/LastTransmissionIntro';
import { SolarSystemExplorer } from './components/SolarSystemExplorer';
import { PillarsExplorer } from './components/PillarsExplorer';
import { StoryMode } from './components/StoryMode';
import { SpacecraftLab } from './components/SpacecraftLab';
import { EthicalSimulator } from './components/EthicalSimulator';
import { LegacyAndWall } from './components/LegacyAndWall';
import { MissionDossier } from './components/MissionDossier';
import { MissionControlDrawer } from './components/MissionControlDrawer';
import { spaceAudio } from './utils/audio';

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'universe', label: 'Universe' },
  { id: 'pillars', label: 'Pillars' },
  { id: 'stories', label: 'Stories' },
  { id: 'lab', label: '3D Lab' },
  { id: 'simulator', label: 'Decisions' },
  { id: 'legacy', label: 'Legacy & Wall' },
];

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<AppView>('universe');
  const [activeMission, setActiveMission] = useState<MissionRecord | null>(null);
  const [missionControlOpen, setMissionControlOpen] = useState(false);
  const [missionControlPrompt, setMissionControlPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const viewParam = params.get('view') as AppView | null;
      const missionParam = params.get('mission');
      if (viewParam && NAV_ITEMS.some((n) => n.id === viewParam)) {
        setView(viewParam);
        setShowIntro(false);
      }
      if (missionParam) {
        const found = getMissionById(missionParam);
        if (found) {
          setActiveMission(found);
          setShowIntro(false);
        }
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const navigate = (nextView: AppView) => {
    setView(nextView);
    spaceAudio.playTelemetryPing(480);
    window.history.replaceState(null, '', `#view=${nextView}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMission = (mission: MissionRecord) => {
    setActiveMission(mission);
    spaceAudio.playTelemetryPing(620);
  };

  const handleAskMissionControl = (prompt?: string) => {
    setMissionControlPrompt(prompt);
    setMissionControlOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-slate-100 flex flex-col">
      {showIntro && <LastTransmissionIntro onEnter={() => setShowIntro(false)} />}

      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-16 bg-[#05070B]/95 border-b border-white/10 px-5 sm:px-8 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => navigate('universe')}
          className="font-display text-lg font-semibold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer hover:text-slate-200 transition-colors"
        >
          Abandoned, Not Forgotten
        </button>

        <nav
          aria-label="Primary sections"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          {NAV_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-white border-white'
                    : 'border-transparent hover:text-white hover:border-white/30'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleAskMissionControl(undefined)}
            className="px-4 py-2 min-h-[38px] rounded-md bg-white text-[#05070B] text-xs font-semibold hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Mission Control
          </button>
        </div>
      </header>

      {/* Compact Mobile Navigation Strip */}
      <nav
        aria-label="Mobile sections"
        className="lg:hidden bg-[#070A10] border-b border-white/10 px-4 py-1.5 overflow-x-auto"
      >
        <div className="flex items-center gap-2 min-w-max">
          {NAV_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'bg-white text-[#05070B] font-semibold' : 'text-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1">
        {view === 'universe' && <SolarSystemExplorer onSelectMission={openMission} />}
        {view === 'pillars' && <PillarsExplorer onSelectMission={openMission} />}
        {view === 'stories' && <StoryMode onSelectMission={openMission} />}
        {view === 'lab' && <SpacecraftLab />}
        {view === 'simulator' && <EthicalSimulator onSelectMission={openMission} />}
        {view === 'legacy' && <LegacyAndWall onSelectMission={openMission} />}
      </main>

      {view !== 'universe' && view !== 'lab' && (
        <footer className="border-t border-white/10 px-5 sm:px-8 py-6 text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-4">
          <span>Abandoned, Not Forgotten · NASA Space Apps Challenge 2026</span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setShowIntro(true)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Replay Opening Sequence
            </button>
            <button
              type="button"
              onClick={() => {
                spaceAudio.toggleMute();
              }}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Toggle Signal Audio
            </button>
          </div>
        </footer>
      )}

      <MissionDossier
        mission={activeMission}
        onClose={() => setActiveMission(null)}
        onAskMissionControl={(q) => handleAskMissionControl(q)}
      />

      <MissionControlDrawer
        open={missionControlOpen}
        initialPrompt={missionControlPrompt}
        onClose={() => setMissionControlOpen(false)}
        onSelectMission={openMission}
      />
    </div>
  );
}
