import rawJson from './missions.json';
import type {
  MissionRecord,
  PillarId,
  RawArchiveDataset,
  VerificationFlag,
} from '../types/archive';

export const ARCHIVE_DATA = rawJson as unknown as RawArchiveDataset;

export const MISSIONS: MissionRecord[] = ARCHIVE_DATA.missions;
export const PILLARS = ARCHIVE_DATA.pillars;
export const THREED_MODELS = ARCHIVE_DATA.threedModels;
export const MISSION_PROFILES = ARCHIVE_DATA.missionProfiles;
export const REPORTED_STATS = ARCHIVE_DATA.stats;

export const PILLAR_COLORS: Record<PillarId, string> = {
  Weight: '#E5B880',
  Experiments: '#7DD3FC',
  Protection: '#86EFAC',
  Time: '#D8B4FE',
};

export interface ComputedArchiveAudit {
  totalMissions: number;
  byRegion: Record<string, number>;
  byPillar: Record<PillarId, number>;
  byStatus: Record<string, number>;
  byEvidenceLevel: Record<string, number>;
  totalMassKg: number;
}

export const COMPUTED_AUDIT: ComputedArchiveAudit = (() => {
  const byRegion: Record<string, number> = {};
  const byPillar: Record<PillarId, number> = {
    Weight: 0,
    Experiments: 0,
    Protection: 0,
    Time: 0,
  };
  const byStatus: Record<string, number> = {};
  const byEvidenceLevel: Record<string, number> = {};
  let totalMassKg = 0;

  for (const m of MISSIONS) {
    byRegion[m.region] = (byRegion[m.region] || 0) + 1;
    byPillar[m.disposalReason] = (byPillar[m.disposalReason] || 0) + 1;
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    byEvidenceLevel[m.evidenceLevel] = (byEvidenceLevel[m.evidenceLevel] || 0) + 1;
    totalMassKg += m.hardwareMassKg || 0;
  }

  return {
    totalMissions: MISSIONS.length,
    byRegion,
    byPillar,
    byStatus,
    byEvidenceLevel,
    totalMassKg: Math.round(totalMassKg * 10) / 10,
  };
})();

export const DATASET_VERIFICATION_FLAGS: VerificationFlag[] = [
  {
    id: 'audit-pillar-mismatch',
    severity: 'discrepancy',
    scope: 'dataset',
    title: 'Pillar Counts Differ Across Three Sections of the Source JSON',
    detail: `Actual mission records total Weight: ${COMPUTED_AUDIT.byPillar.Weight}, Experiments: ${COMPUTED_AUDIT.byPillar.Experiments}, Protection: ${COMPUTED_AUDIT.byPillar.Protection}, Time: ${COMPUTED_AUDIT.byPillar.Time}. However, stats.byPillar reports (2 / 9 / 4 / 12) and pillars[].missionCount reports (5 / 8 / 5 / 9).`,
  },
  {
    id: 'audit-missing-referenced-missions',
    severity: 'discrepancy',
    scope: 'dataset',
    title: 'Pillar Summaries Reference Two Missions Absent from the 27 Records',
    detail:
      'The Experiments pillar summary highlights Apollo 12 smashing its 2.4-ton Lunar Module into the Moon, and the Protection summary cites Dawn parked at Ceres. Neither spacecraft has a dedicated record in the missions array.',
  },
  {
    id: 'audit-mass-mismatch',
    severity: 'discrepancy',
    scope: 'dataset',
    title: 'Reported Total Hardware Mass (17,887 kg) Differs from Sum of Records (18,103.8 kg)',
    detail:
      'Summing hardwareMassKg across all 27 records equals 18,103.8 kg — a 216.8 kg gap from stats.totalMassKg. Individual records also vary between dry mass, single-unit mass (LRV 210 kg for 3 rovers), and multi-stage mass (LCROSS 2,366 kg).',
  },
  {
    id: 'audit-status-mismatch',
    severity: 'discrepancy',
    scope: 'dataset',
    title: 'Operational Status Totals Diverge & Include 7 Active Missions',
    detail:
      'Computed statuses are Active: 7, Completed: 11, Impacted: 6, Lost Contact: 2, Grounded: 1 (vs. stats.byStatus Active: 5, Completed: 10, Impacted: 7, Lost Contact: 3, Retired: 1). Active craft are permanently committed off-Earth rather than retired.',
  },
  {
    id: 'audit-3d-gaps',
    severity: 'discrepancy',
    scope: '3d-models',
    title: '3D Model Assets Not Hosted Locally & Profile Index Mismatch',
    detail:
      'threedModels references /models/*.glb paths not present on disk and includes Hubble Space Telescope (omitted from missions). missionProfiles includes InSight but omits Perseverance. Interactive Mission Scenarios and Dossiers render procedural PBR Three.js spacecraft assemblies directly.',
  },
  {
    id: 'flag-surveyor-3',
    severity: 'disputed',
    scope: 'mission',
    targetId: 'surveyor-3',
    title: 'Unresolved Hypothesis: Microbial Survival vs. Cleanroom Contamination',
    detail:
      'Marked SCIENTISTS_THINK: Streptococcus mitis bacteria cultured from Surveyor 3 camera foam may reflect terrestrial contamination after Apollo 12 retrieval rather than 31-month lunar vacuum survival.',
  },
  {
    id: 'flag-messenger-protection',
    severity: 'nuance',
    scope: 'mission',
    targetId: 'messenger-mercury',
    title: 'Categorization Nuance: Propellant Exhaustion vs. Biological Protection',
    detail:
      'Tagged under Protection in the JSON, though MESSENGER impacted Mercury in April 2015 because propellant ran out under solar gravity — Mercury is not a target for biological ocean contamination.',
  },
  {
    id: 'flag-grail-protection',
    severity: 'nuance',
    scope: 'mission',
    targetId: 'grail',
    title: 'Categorization Nuance: Cultural Heritage Protection vs. Planetary Bio-Protection',
    detail:
      'GRAIL ("Ebb" & "Flow") was intentionally directed into a northern lunar ridge to protect historical Apollo landing sites rather than to prevent biological contamination.',
  },
  {
    id: 'flag-parker-active',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'parker-solar-probe',
    title: 'Active Mission & 2026 Timeline Entry Requires Live Telemetry Verification',
    detail:
      'Listed under Experiments with Status: Active and references a 28th solar pass in June 2026. Parker Solar Probe has not been disposed of.',
  },
  {
    id: 'flag-voyager-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'voyager-1',
    title: '2026 Milestone Entry (Nov 18, 2026 · 1 Light-Day)',
    detail:
      'Crossing 24 light-hours (~25.9 billion km / 173 AU) is dated Nov 18, 2026 — verify exact crossing timestamp against live NASA JPL Horizons ephemeris.',
  },
  {
    id: 'flag-maven-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'maven-orbiter',
    title: '2025–2026 End-of-Mission Claim Requires External Verification',
    detail:
      'Entry states contact was lost behind Mars in Dec 2025 and mission ended June 3, 2026. Flagged for verification against official NASA PDS/JPL mission bulletins.',
  },
  {
    id: 'flag-perseverance-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'perseverance-m2020',
    title: '2026 Odometer Record (45.22 km) Requires Live Verification',
    detail:
      'States Perseverance surpassed Opportunity (45.16 km) on Oct 11, 2026. Verify against current NASA Mars 2020 rover traverse logs.',
  },
  {
    id: 'flag-newhorizons-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'new-horizons',
    title: '2026 Hibernation Wake-Up Claim Requires Verification',
    detail:
      'Cites a 321-day hibernation wake-up on June 23, 2026. Flagged for verification against Johns Hopkins APL / NASA New Horizons status logs.',
  },
  {
    id: 'flag-dart-hera-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'dart-planetary-defense',
    title: '2026 Hera Arrival Reference',
    detail:
      'Science return notes ESA Hera arriving in November 2026 to survey the DART impact crater; verify current Hera rendezvous status.',
  },
];

export function getMissionById(id: string): MissionRecord | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function getVerificationFlagsForMission(missionId: string): VerificationFlag[] {
  return DATASET_VERIFICATION_FLAGS.filter((f) => f.targetId === missionId);
}

export function retrieveRelevantMissions(query: string, limit = 5): MissionRecord[] {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (tokens.length === 0) {
    return MISSIONS.slice(0, limit);
  }

  const scored = MISSIONS.map((m) => {
    const haystack = [
      m.id,
      m.name,
      m.designation,
      m.region,
      m.disposalReason,
      m.status,
      m.location,
      m.highlightTag,
      m.description,
      m.scienceReturn,
      m.humanStory,
    ]
      .join(' ')
      .toLowerCase();

    let score = 0;
    for (const token of tokens) {
      if (m.name.toLowerCase().includes(token)) score += 6;
      if (m.id.toLowerCase().includes(token)) score += 6;
      if (m.disposalReason.toLowerCase() === token) score += 4;
      if (m.region.toLowerCase().includes(token)) score += 3;
      if (haystack.includes(token)) score += 2;
    }
    return { mission: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.mission);
  return matched.length > 0 ? matched : MISSIONS.slice(0, limit);
}
