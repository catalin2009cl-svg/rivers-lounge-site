'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PhotoDeckPhoto {
  id: string;
  src: string;
  caption?: string;
}

interface PhotoDeckProps {
  photos: PhotoDeckPhoto[];
}

// Per-slot 3D stack transforms (slot 0 = front)
const SLOT_TRANSFORMS = [
  { transform: 'scale(1) rotate(0deg) translateY(0px)',       opacity: 1,    zIndex: 40 },
  { transform: 'scale(0.95) rotate(-3deg) translateY(10px)',  opacity: 0.88, zIndex: 30 },
  { transform: 'scale(0.90) rotate(2deg) translateY(20px)',   opacity: 0.76, zIndex: 20 },
  { transform: 'scale(0.85) rotate(-1.5deg) translateY(30px)', opacity: 0.6, zIndex: 10 },
];

const EXIT_TRANSFORMS = {
  left:  'translateX(-135%) rotate(-18deg) scale(1.05)',
  right: 'translateX(135%) rotate(18deg) scale(1.05)',
};

export function PhotoDeck({ photos }: PhotoDeckProps) {
  // order[i] = index into photos[] for deck slot i
  const [order, setOrder] = useState<number[]>(() => photos.map((_, i) => i));
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef<number | null>(null);
  const animating = exitDir !== null;
  const N = photos.length;

  const goNext = useCallback(() => {
    if (animating || N <= 1) return;
    setExitDir('left');
    setTimeout(() => {
      setOrder((prev) => [...prev.slice(1), prev[0]]);
      setExitDir(null);
    }, 380);
  }, [animating, N]);

  const goPrev = useCallback(() => {
    if (animating || N <= 1) return;
    setExitDir('right');
    setTimeout(() => {
      setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
      setExitDir(null);
    }, 380);
  }, [animating, N]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -50) goNext();
    else if (dx > 50) goPrev();
  }

  // Empty state
  if (N === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 rounded-2xl border-2 border-dashed border-border text-muted-foreground gap-3">
        <Camera className="h-10 w-10 opacity-30" />
        <p className="text-sm text-center max-w-xs">
          Adaugă fotografii din panoul de administrare
        </p>
      </div>
    );
  }

  const visibleSlots = Math.min(4, N);
  const activePhotoIdx = order[0]; // index in original photos[]
  const showDots = N <= 12;

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Ken Burns keyframe + exit keyframes — injected once */}
      <style>{`
        @keyframes pd-fly-left {
          0%   { transform: scale(1) rotate(0deg) translateX(0); opacity: 1; }
          25%  { transform: scale(1.08) rotate(0deg) translateX(0); opacity: 1; }
          100% { transform: scale(1.05) rotate(-18deg) translateX(-135%); opacity: 0; }
        }
        @keyframes pd-fly-right {
          0%   { transform: scale(1) rotate(0deg) translateX(0); opacity: 1; }
          25%  { transform: scale(1.08) rotate(0deg) translateX(0); opacity: 1; }
          100% { transform: scale(1.05) rotate(18deg) translateX(135%); opacity: 0; }
        }
      `}</style>

      {/* Stack */}
      <div
        className="relative w-full max-w-[520px] mx-auto h-[280px] md:h-[420px]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Counter badge */}
        <div
          className="absolute top-0 right-0 z-50 text-xs font-mono px-2.5 py-1 rounded-tr-md rounded-bl-md"
          style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
        >
          {activePhotoIdx + 1} / {N}
        </div>

        {/* Cards — render back-to-front so higher z-index cards paint last */}
        {Array.from({ length: visibleSlots }, (_, slot) => {
          const photoIdx = order[slot];
          const photo = photos[photoIdx];
          const isFront = slot === 0;
          const isExiting = isFront && animating;

          // During animation, background cards advance one slot forward visually
          const effectiveSlot = animating && !isFront ? slot - 1 : slot;
          const slotStyle = SLOT_TRANSFORMS[Math.max(0, effectiveSlot)] ?? SLOT_TRANSFORMS[3];

          const cardStyle: React.CSSProperties = isExiting
            ? {
                position: 'absolute',
                inset: 0,
                zIndex: slotStyle.zIndex,
                animation: `pd-fly-${exitDir} 380ms ease-in forwards`,
                cursor: 'default',
              }
            : {
                position: 'absolute',
                inset: 0,
                zIndex: slotStyle.zIndex,
                transform: slotStyle.transform,
                opacity: slotStyle.opacity,
                transition: 'transform 380ms ease-out, opacity 380ms ease-out',
                cursor: isFront ? 'pointer' : 'default',
              };

          return (
            <div
              key={photoIdx}
              style={cardStyle}
              onClick={isFront && !animating ? goNext : undefined}
              title={isFront ? 'Click pentru următoarea fotografie' : undefined}
            >
              {/* Photograph border effect */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#fff',
                  padding: '10px 10px 36px 10px',
                  boxSizing: 'border-box',
                  boxShadow: '0 6px 30px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)',
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image
                    src={photo.src}
                    alt={photo.caption || `Cabana Rivers - fotografie ${photoIdx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={photo.src.startsWith('/')}
                    priority={slot === 0}
                    draggable={false}
                  />
                </div>
                {photo.caption && (
                  <p
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 10,
                      right: 10,
                      textAlign: 'center',
                      fontSize: 11,
                      color: '#888',
                      fontStyle: 'italic',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {photo.caption}
                  </p>
                )}
              </div>
            </div>
          );
        }).reverse() /* render back cards first so front card's z-index wins */}
      </div>

      {/* Navigation row */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={goPrev}
          disabled={animating || N <= 1}
          aria-label="Fotografia anterioară"
        >
          <ChevronLeft className="h-4 w-4" />
          Înapoi
        </Button>

        {/* Dot indicators (max 12) */}
        {showDots && (
          <div className="flex gap-1.5 items-center">
            {photos.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activePhotoIdx ? 10 : 6,
                  height: i === activePhotoIdx ? 10 : 6,
                  backgroundColor: i === activePhotoIdx ? 'var(--primary)' : 'rgba(128,128,128,0.35)',
                }}
              />
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={goNext}
          disabled={animating || N <= 1}
          aria-label="Fotografia următoare"
        >
          Următoarea
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
