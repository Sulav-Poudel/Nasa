import React, { useEffect, useState } from 'react';
import { Send, X } from 'lucide-react';
import { getMissionById } from '../data/archive';
import type { MissionRecord } from '../types/archive';

interface MissionControlDrawerProps {
  open: boolean;
  initialPrompt?: string;
  onClose: () => void;
  onSelectMission: (mission: MissionRecord) => void;
}

interface ReferencedMission {
  id: string;
  name: string;
  evidenceLevel: string;
  citationId: string;
}

interface ChatEntry {
  id: string;
  question: string;
  level: string;
  mode: string;
  answer: string;
  warning?: string;
  referencedMissions: ReferencedMission[];
}

const SUGGESTED_QUESTIONS = [
  'Why did NASA deliberately crash Cassini?',
  'Why was LCROSS destroyed?',
  'What happened to Opportunity?',
  'Which abandoned spacecraft is still producing scientific value?',
  'What would happen if we had not followed planetary protection rules?',
];

export const MissionControlDrawer: React.FC<MissionControlDrawerProps> = ({
  open,
  initialPrompt,
  onClose,
  onSelectMission,
}) => {
  const [question, setQuestion] = useState('');
  const [level, setLevel] = useState<'Accessible' | 'Technical' | 'Cinematic'>('Accessible');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatEntry[]>([]);

  useEffect(() => {
    if (initialPrompt && open) {
      setQuestion(initialPrompt);
    }
  }, [initialPrompt, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submitQuestion = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/mission-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, level }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to query Mission Control');
      }

      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          question: trimmed,
          level,
          mode: data.mode || 'archive-offline',
          answer: data.answer,
          warning: data.warning,
          referencedMissions: data.referencedMissions || [],
        },
        ...prev,
      ]);
      setQuestion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Mission Control.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mc-title"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-xl h-full overflow-y-auto bg-[#080B12] border-l border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="font-mono text-xs text-[#7DD3FC]">
                Mission Control · Grounded Archive Assistant
              </div>
              <h2 id="mc-title" className="mt-1 text-2xl font-semibold text-white">
                Talk to the Archive
              </h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Uses structured JSON retrieval over the 27 mission records, separating confirmed findings from open scientific hypotheses. Works with or without a Gemini API key.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Mission Control"
              className="p-2 min-w-[40px] min-h-[40px] rounded-md border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Explanation Level Selector */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-slate-400">Explanation Depth</span>
            <div className="flex items-center gap-1 p-1 rounded bg-[#0E1422] border border-white/10">
              {(['Accessible', 'Technical', 'Cinematic'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    level === lvl
                      ? 'bg-white text-[#05070B] font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitQuestion(question);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about Cassini, LCROSS, Opportunity, protection…"
              className="flex-1 px-3.5 py-2.5 min-h-[42px] rounded-md bg-[#05070B] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-md bg-white text-[#05070B] text-xs font-semibold disabled:opacity-40 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Querying…' : 'Ask'}</span>
            </button>
          </form>

          {/* Suggested Prompts */}
          <div className="space-y-2">
            <div className="font-mono text-[11px] text-slate-400">Suggested Questions</div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setQuestion(q);
                    void submitQuestion(q);
                  }}
                  className="text-left px-3 py-1.5 rounded bg-[#0D121D] border border-white/10 hover:border-white/30 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
              {error}
            </div>
          )}

          {/* Responses */}
          <div className="space-y-4">
            {history.map((entry) => (
              <article
                key={entry.id}
                className="p-4 rounded-md bg-[#0B101B] border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{entry.level}</span>
                  <span>
                    {entry.mode === 'gemini-live' ? 'Gemini Archive Synthesis' : 'Offline Archive Lookup'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">{entry.question}</h3>
                {entry.warning && (
                  <p className="text-[11px] font-mono text-amber-300">{entry.warning}</p>
                )}
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {entry.answer}
                </div>

                {entry.referencedMissions.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-1.5">
                    <div className="font-mono text-[11px] text-slate-400">
                      Referenced Mission Records
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.referencedMissions.map((ref) => {
                        const missionObj = getMissionById(ref.id);
                        return (
                          <button
                            key={ref.id}
                            type="button"
                            onClick={() => {
                              if (missionObj) {
                                onClose();
                                onSelectMission(missionObj);
                              }
                            }}
                            className="text-left px-2.5 py-1.5 rounded bg-[#05070B] border border-white/10 hover:border-white/30 text-xs text-slate-200 cursor-pointer"
                          >
                            {ref.name} · <span className="font-mono text-[10px] text-slate-400">{ref.citationId || ref.evidenceLevel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
