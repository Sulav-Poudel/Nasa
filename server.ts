import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MissionRow {
  id: string;
  name: string;
  designation: string;
  region: string;
  disposalReason: string;
  status: string;
  location: string;
  eventDate: string;
  launchDate: string;
  coordinates: string;
  hardwareMassKg: number;
  highlightTag: string;
  evidenceLevel: string;
  evidenceNote: string;
  description: string;
  scienceReturn: string;
  humanStory: string;
  nasaDataSources: { title: string; datasetUrl: string; citationId: string }[];
  imageCredit: string;
}

interface ArchiveJson {
  pillars: { id: string; title: string; summary: string; detail: string }[];
  missions: MissionRow[];
  stats: Record<string, unknown>;
}

const datasetPath = path.join(__dirname, 'src', 'data', 'missions.json');
const archiveData: ArchiveJson = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

function retrieveContextMissions(query: string, limit = 5): MissionRow[] {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (tokens.length === 0) return archiveData.missions.slice(0, limit);

  const scored = archiveData.missions.map((m) => {
    const blob = [
      m.id,
      m.name,
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
    for (const tok of tokens) {
      if (m.name.toLowerCase().includes(tok)) score += 6;
      if (m.id.toLowerCase().includes(tok)) score += 6;
      if (m.disposalReason.toLowerCase() === tok) score += 4;
      if (m.region.toLowerCase().includes(tok)) score += 3;
      if (blob.includes(tok)) score += 2;
    }
    return { m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const hits = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.m);
  return hits.length > 0 ? hits : archiveData.missions.slice(0, limit);
}

function buildOfflineResponse(
  question: string,
  level: string,
  matched: MissionRow[],
): string {
  const top = matched[0];
  const others = matched
    .slice(1, 3)
    .map((m) => `${m.name} (${m.disposalReason})`)
    .join(', ');

  if (level === 'Cinematic') {
    return [
      `Archive Dispatch — ${top.name}`,
      '',
      `${top.humanStory}`,
      '',
      `Confirmed Science Return (${top.evidenceLevel}): ${top.scienceReturn}`,
      others ? `Related records in archive: ${others}.` : '',
      `Primary citation: ${top.nasaDataSources[0]?.citationId ?? 'NASA PDS'} — ${top.nasaDataSources[0]?.title ?? ''}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (level === 'Technical') {
    return [
      `Mission Record: ${top.name} [${top.designation}]`,
      `Region: ${top.region} | Disposal Pillar: ${top.disposalReason} | Status: ${top.status} | Mass: ${top.hardwareMassKg} kg`,
      `Location: ${top.location} (${top.coordinates})`,
      `Evidence Level: ${top.evidenceLevel} — ${top.evidenceNote}`,
      `Science Return: ${top.scienceReturn}`,
      `Sources: ${top.nasaDataSources.map((s) => `${s.citationId}: ${s.title}`).join('; ')}`,
      others ? `Additional matched records for "${question}": ${others}.` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  return [
    `Based on the Mission Archive for "${top.name}" (${top.disposalReason} · ${top.region}):`,
    top.description,
    `Why it mattered: ${top.scienceReturn}`,
    `Human story: ${top.humanStory}`,
    top.evidenceLevel === 'SCIENTISTS_THINK'
      ? `Verification note (${top.evidenceLevel}): ${top.evidenceNote}`
      : `Confirmed evidence: ${top.evidenceNote}`,
    others ? `Other relevant missions in the archive: ${others}.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      missionsCount: archiveData.missions.length,
    });
  });

  app.post('/api/mission-control', async (req, res) => {
    try {
      const question = String(req.body?.question ?? '').trim();
      const level = String(req.body?.level ?? 'Accessible');

      if (!question) {
        return res.status(400).json({ error: 'Please enter a mission question.' });
      }

      const matched = retrieveContextMissions(question, 5);
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          mode: 'archive-offline',
          answer: buildOfflineResponse(question, level, matched),
          referencedMissions: matched.map((m) => ({
            id: m.id,
            name: m.name,
            evidenceLevel: m.evidenceLevel,
            citationId: m.nasaDataSources[0]?.citationId ?? '',
          })),
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contextPayload = matched.map((m) => ({
        id: m.id,
        name: m.name,
        region: m.region,
        disposalReason: m.disposalReason,
        status: m.status,
        location: m.location,
        launchDate: m.launchDate,
        eventDate: m.eventDate,
        coordinates: m.coordinates,
        hardwareMassKg: m.hardwareMassKg,
        evidenceLevel: m.evidenceLevel,
        evidenceNote: m.evidenceNote,
        description: m.description,
        scienceReturn: m.scienceReturn,
        humanStory: m.humanStory,
        citations: m.nasaDataSources,
      }));

      const levelGuidance: Record<string, string> = {
        Accessible:
          'Explain clearly for curious public visitors in 2-3 concise paragraphs with warm documentary clarity.',
        Technical:
          'Provide an engineering and scientific breakdown referencing instruments, orbital/impact physics, mass, and citation IDs.',
        Cinematic:
          'Write a short, emotionally grounded documentary vignette (130-180 words) strictly anchored in the verified facts below.',
      };

      const systemInstruction = [
        'You are Mission Control for the archive "Abandoned, Not Forgotten".',
        'Answer strictly using the provided JSON mission records and pillar summaries. Do NOT invent coordinates, instruments, NASA endorsements, or unrecorded mission facts.',
        'Always distinguish CONFIRMED findings from SCIENTISTS_THINK hypotheses (such as Surveyor 3 microbes) and note if an event is a 2026-dated entry requiring external JPL/PDS verification.',
        'Cite the exact mission names and NASA citation IDs from the provided records.',
        levelGuidance[level] ?? levelGuidance.Accessible,
      ].join(' ');

      const prompt = [
        `Visitor Question: ${question}`,
        `Requested Explanation Level: ${level}`,
        `Matched Archive Records (${contextPayload.length} of ${archiveData.missions.length}):`,
        JSON.stringify(contextPayload, null, 2),
        'Pillars:',
        JSON.stringify(archiveData.pillars),
      ].join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const answer =
        response.text?.trim() || buildOfflineResponse(question, level, matched);

      return res.json({
        mode: 'gemini-live',
        answer,
        referencedMissions: matched.map((m) => ({
          id: m.id,
          name: m.name,
          evidenceLevel: m.evidenceLevel,
          citationId: m.nasaDataSources[0]?.citationId ?? '',
        })),
      });
    } catch (error) {
      console.error('Mission Control API error:', error);
      const question = String(req.body?.question ?? '');
      const level = String(req.body?.level ?? 'Accessible');
      const matched = retrieveContextMissions(question, 5);
      return res.json({
        mode: 'archive-fallback',
        warning:
          'Live AI synthesis unavailable right now; displaying verified archive records directly.',
        answer: buildOfflineResponse(question, level, matched),
        referencedMissions: matched.map((m) => ({
          id: m.id,
          name: m.name,
          evidenceLevel: m.evidenceLevel,
          citationId: m.nasaDataSources[0]?.citationId ?? '',
        })),
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

startServer();
