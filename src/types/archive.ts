export type PillarId = 'Weight' | 'Experiments' | 'Protection' | 'Time';

export type RegionId = 'Moon' | 'Mars' | 'Deep Space';

export type EvidenceLevel = 'CONFIRMED' | 'SCIENTISTS_THINK' | 'STILL_UNKNOWN';

export interface NasaDataSource {
  title: string;
  datasetUrl: string;
  citationId: string;
}

export interface MissionRecord {
  id: string;
  name: string;
  designation: string;
  region: RegionId;
  disposalReason: PillarId;
  status: string;
  category: string;
  location: string;
  eventDate: string;
  launchDate: string;
  coordinates: string;
  hardwareMassKg: number;
  highlightTag: string;
  evidenceLevel: EvidenceLevel;
  evidenceNote: string;
  description: string;
  scienceReturn: string;
  humanStory: string;
  nasaDataSources: NasaDataSource[];
  imageUrl: string;
  imageCredit: string;
}

export interface PillarRecord {
  id: PillarId;
  title: string;
  summary: string;
  detail: string;
  missionCount: number;
  color: string;
}

export interface ModelComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  purpose: string;
  source: string;
}

export interface ThreeDModelRecord {
  id: string;
  name: string;
  category: string;
  year: string;
  destination: string;
  launch: string;
  arrival: string;
  status: string;
  modelFile: string;
  description: string;
  significance: string;
  source: string;
  credit: string;
  components?: ModelComponent[];
}

export interface MissionProfileRecord {
  name: string;
  subtitle: string;
  description: string;
  launch: string;
  arrival: string;
  status: string;
  goals: string[];
}

export interface ArchiveStats {
  byRegion: Record<string, number>;
  byPillar: Record<string, number>;
  byStatus: Record<string, number>;
  byEvidenceLevel: Record<string, number>;
  totalMassKg: number;
  moonRocksReturnedKg: number;
  voyager1DistanceAU: number;
  ingenuityFlights: number;
  marsquakesDetected: number;
  dimorphosOrbitShiftMinutes: number;
}

export interface RawArchiveDataset {
  meta: {
    project: string;
    subtitle: string;
    description: string;
    version: string;
    exportedAt: string;
    totalMissions: number;
    totalCategories: number;
    total3DModels: number;
  };
  pillars: PillarRecord[];
  missions: MissionRecord[];
  threedModels: ThreeDModelRecord[];
  missionProfiles: Record<string, MissionProfileRecord>;
  stats: ArchiveStats;
}

export interface VerificationFlag {
  id: string;
  severity: 'discrepancy' | 'future-dated' | 'disputed' | 'nuance';
  scope: 'dataset' | 'mission' | '3d-lab';
  targetId?: string;
  title: string;
  detail: string;
}

export type AppView =
  | 'universe'
  | 'pillars'
  | 'stories'
  | 'lab'
  | 'simulator'
  | 'legacy';
