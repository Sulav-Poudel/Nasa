import React from 'react';

export type CharacterId = 'guide' | 'protection' | 'flight' | 'rover';

interface CharacterMeta {
  id: CharacterId;
  badge: string;
  role: string;
  accent: string;
}

export const CHARACTERS: Record<CharacterId, CharacterMeta> = {
  guide: {
    id: 'guide',
    badge: 'ARCHIVIST VANCE',
    role: 'Mission Historian & Guide',
    accent: '#E5B880',
  },
  protection: {
    id: 'protection',
    badge: 'DR. MAYA PATEL',
    role: 'Planetary Protection Officer',
    accent: '#86EFAC',
  },
  flight: {
    id: 'flight',
    badge: 'DIR. KENJI CHEN',
    role: 'Deep Space Flight Dynamics',
    accent: '#7DD3FC',
  },
  rover: {
    id: 'rover',
    badge: 'ENG. ELENA RIVERA',
    role: 'Surface Mobility Lead',
    accent: '#D8B4FE',
  },
};

interface GameCharacterPortraitProps {
  character: CharacterId;
  className?: string;
}

export const GameCharacterPortrait: React.FC<GameCharacterPortraitProps> = ({
  character,
  className = 'w-24 h-28 sm:w-28 sm:h-32',
}) => {
  const meta = CHARACTERS[character];

  // Palette per role
  const jacket =
    character === 'guide'
      ? '#1E293B'
      : character === 'protection'
        ? '#14332B'
        : character === 'flight'
          ? '#172554'
          : '#2E1065';

  const skin =
    character === 'guide'
      ? '#E5B392'
      : character === 'protection'
        ? '#C58C64'
        : character === 'flight'
          ? '#EBC3A3'
          : '#D49A75';

  const hair =
    character === 'guide'
      ? '#CBD5E1'
      : character === 'protection'
        ? '#1E1B18'
        : character === 'flight'
          ? '#0F172A'
          : '#3B2314';

  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      role="img"
      aria-label={`${meta.badge} - ${meta.role}`}
    >
      {/* Subtle backing frame */}
      <rect
        x="8"
        y="12"
        width="104"
        height="122"
        rx="10"
        fill="#0B101B"
        stroke={meta.accent}
        strokeWidth="2"
      />

      {/* Shoulder & flight jacket */}
      <path
        d="M20 134 C20 100 38 92 60 92 C82 92 100 100 100 134 Z"
        fill={jacket}
      />
      {/* Jacket collar & zipper */}
      <path d="M46 92 L60 112 L74 92" fill="#0F172A" stroke={meta.accent} strokeWidth="2" />
      <line x1="60" y1="112" x2="60" y2="134" stroke={meta.accent} strokeWidth="1.5" />

      {/* NASA-style chest mission patch */}
      <circle cx="80" cy="115" r="7" fill="#090D16" stroke={meta.accent} strokeWidth="1.5" />
      <path d="M76 117 L80 110 L84 117" fill="none" stroke={meta.accent} strokeWidth="1.5" />

      {/* Neck */}
      <rect x="52" y="78" width="16" height="18" rx="6" fill={skin} />

      {/* Back Hair for Maya / Elena */}
      {character === 'protection' && (
        <path d="M32 52 C30 82 34 94 42 94 L78 94 C86 94 90 82 88 52 Z" fill={hair} />
      )}
      {character === 'rover' && (
        <circle cx="85" cy="48" r="11" fill={hair} />
      )}

      {/* Ears */}
      <circle cx="36" cy="58" r="5" fill={skin} />
      <circle cx="84" cy="58" r="5" fill={skin} />

      {/* Head */}
      <rect x="37" y="30" width="46" height="52" rx="22" fill={skin} />

      {/* Hair styles */}
      {character === 'guide' && (
        <>
          <path d="M36 52 C36 28 84 28 84 52 C80 40 40 40 36 52 Z" fill={hair} />
          {/* Veteran beard & mustache */}
          <path d="M40 64 C40 82 80 82 80 64 C76 72 44 72 40 64 Z" fill={hair} />
        </>
      )}
      {character === 'protection' && (
        <path d="M36 50 C38 26 82 26 84 50 C75 36 45 36 36 50 Z" fill={hair} />
      )}
      {character === 'flight' && (
        <path d="M36 50 C36 25 84 25 84 48 C70 38 50 38 36 50 Z" fill={hair} />
      )}
      {character === 'rover' && (
        <path d="M37 48 C37 26 83 26 83 48 C72 34 48 34 37 48 Z" fill={hair} />
      )}

      {/* Eyes */}
      <circle cx="49" cy="56" r="3" fill="#0F172A" />
      <circle cx="71" cy="56" r="3" fill="#0F172A" />
      <circle cx="50" cy="55" r="1" fill="#FFFFFF" />
      <circle cx="72" cy="55" r="1" fill="#FFFFFF" />

      {/* Eyebrows */}
      <path d="M43 49 Q49 47 54 49" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M66 49 Q71 47 77 49" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Glasses for Flight Director / Protection */}
      {(character === 'flight' || character === 'protection') && (
        <g stroke="#CBD5E1" strokeWidth="1.4" fill="none">
          <rect x="42" y="51" width="14" height="10" rx="2" />
          <rect x="64" y="51" width="14" height="10" rx="2" />
          <line x1="56" y1="56" x2="64" y2="56" />
        </g>
      )}

      {/* Friendly confident expression */}
      <path
        d="M52 70 Q60 75 68 70"
        stroke="#7C2D12"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Mission Control Headset & Mic */}
      <path
        d="M34 56 C32 30 88 30 86 56"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="3"
      />
      <rect x="30" y="50" width="7" height="15" rx="3" fill="#334155" stroke={meta.accent} strokeWidth="1.2" />
      <path d="M34 62 Q42 74 55 74" fill="none" stroke="#94A3B8" strokeWidth="2" />
      <circle cx="55" cy="74" r="2.2" fill={meta.accent} />
    </svg>
  );
};
