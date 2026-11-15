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
    title: 'Pillar totals do not match',
    detail: `Counting the mission records gives Weight: ${COMPUTED_AUDIT.byPillar.Weight}, Experiments: ${COMPUTED_AUDIT.byPillar.Experiments}, Protection: ${COMPUTED_AUDIT.byPillar.Protection}, and Time: ${COMPUTED_AUDIT.byPillar.Time}. The archive summary and pillar descriptions list different totals.`,
  },
  {
    id: 'audit-missing-referenced-missions',
    severity: 'discrepancy',
    scope: 'dataset',
    title: 'Two missions appear in summaries, not in the gallery',
    detail:
      'The pillar descriptions mention Apollo 12’s lunar module impact and the Dawn spacecraft at Ceres. Neither has its own record in this 27-mission archive.',
  },
  {
    id: 'audit-mass-mismatch',
    severity: 'discrepancy',
    scope: 'dataset',
    title: 'The spacecraft mass total differs from the records',
    detail:
      `The individual records add up to ${COMPUTED_AUDIT.totalMassKg.toLocaleString()} kg; the archive summary reports 17,887 kg. Mass figures may also describe different things, such as a dry spacecraft, one rover, or a full mission stack.`,
  },
  {
    id: 'audit-status-mismatch',
    severity: 'discrepancy',
    scope: 'dataset',
    title: 'Mission status totals do not match the archive summary',
    detail:
      'The mission records and the archive summary count active, completed, impacted, and out-of-contact spacecraft differently. Some active spacecraft also remain on their destinations rather than being retired.',
  },
  {
    id: 'audit-3d-gaps',
    severity: 'discrepancy',
    scope: '3d-models',
    title: 'Some spacecraft model files are not included',
    detail:
      'The model list refers to files that are not in the project, and the model and mission lists do not fully match. Interactive 3D views use built-in spacecraft models instead.',
  },
  {
    id: 'flag-surveyor-3',
    severity: 'disputed',
    scope: 'mission',
    targetId: 'surveyor-3',
    title: 'Surveyor 3: a finding with two possible explanations',
    detail:
      'Bacteria were cultured from Surveyor 3 camera foam after Apollo 12 returned it to Earth. Whether they survived on the Moon or were introduced by contamination remains uncertain.',
  },
  {
    id: 'flag-messenger-protection',
    severity: 'nuance',
    scope: 'mission',
    targetId: 'messenger-mercury',
    title: 'Why MESSENGER ended at Mercury',
    detail:
      'MESSENGER ran out of fuel and impacted Mercury in 2015. Its archive category is Protection, though the mission ended because the spacecraft could no longer maintain orbit.',
  },
  {
    id: 'flag-grail-protection',
    severity: 'nuance',
    scope: 'mission',
    targetId: 'grail',
    title: 'Why GRAIL was directed to the Moon',
    detail:
      'The GRAIL spacecraft were directed to a lunar ridge to avoid historic Apollo landing sites. This protected cultural heritage, rather than preventing biological contamination.',
  },
  {
    id: 'flag-parker-active',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'parker-solar-probe',
    title: 'Check Parker Solar Probe’s latest mission timeline',
    detail:
      'Parker Solar Probe is listed as active. The archive also mentions a solar pass in June 2026; check a current NASA mission update before relying on its pass count or date.',
  },
  {
    id: 'flag-voyager-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'voyager-1',
    title: 'Voyager 1’s one-light-day milestone',
    detail:
      'The archive estimates this milestone for November 18, 2026. Check a current JPL ephemeris for the exact date and distance.',
  },
  {
    id: 'flag-maven-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'maven-orbiter',
    title: 'Check MAVEN’s current mission status',
    detail:
      'This archive entry says MAVEN lost contact in December 2025 and its mission ended in June 2026. Both dates have passed; check a recent NASA or JPL update before citing them.',
  },
  {
    id: 'flag-perseverance-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'perseverance-m2020',
    title: 'Check Perseverance’s latest distance record',
    detail:
      'The archive gives Perseverance’s distance as 45.22 km on October 11, 2026. Compare this figure with the latest NASA rover update before citing it.',
  },
  {
    id: 'flag-newhorizons-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'new-horizons',
    title: 'Check New Horizons’ latest mission update',
    detail:
      'The archive records a wake-up on June 23, 2026, after 321 days in hibernation. Check a current NASA or Johns Hopkins APL update for confirmation.',
  },
  {
    id: 'flag-dart-hera-2026',
    severity: 'future-dated',
    scope: 'mission',
    targetId: 'dart-planetary-defense',
    title: 'Check Hera’s arrival status',
    detail:
      'The archive says ESA’s Hera mission will reach the Didymos asteroid system in November 2026. Check ESA’s latest update for the actual arrival date and mission status.',
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
