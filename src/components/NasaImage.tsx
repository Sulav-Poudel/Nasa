import React, { useState } from 'react';
import { Telescope } from 'lucide-react';

interface NasaImageProps {
  src: string;
  alt: string;
  credit?: string;
  className?: string;
  aspectClass?: string;
}

export const NasaImage: React.FC<NasaImageProps> = ({
  src,
  alt,
  credit,
  className = '',
  aspectClass = 'aspect-[16/10]',
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className={`relative overflow-hidden bg-[#0A0E17] border border-white/10 ${aspectClass} ${className}`}>
      {!failed ? (
        <>
          {!loaded && (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[#0D1320] flex items-center justify-center"
            >
              <span className="font-mono text-xs text-slate-500">Loading NASA archival frame…</span>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#090D16]">
          <Telescope className="w-7 h-7 text-slate-500 mb-3" />
          <p className="text-sm font-medium text-slate-300 max-w-xs">{alt}</p>
          <p className="font-mono text-xs text-slate-500 mt-1">
            External NASA image unavailable offline
          </p>
        </div>
      )}
      {credit && (
        <figcaption className="absolute bottom-2.5 left-3 right-3 text-[11px] font-mono text-slate-300/90 truncate">
          {credit}
        </figcaption>
      )}
    </figure>
  );
};
