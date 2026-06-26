'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

export interface MosaicPhoto {
  id: string;
  src: string;
  caption?: string;
}

interface Props {
  photos: MosaicPhoto[];
}

const GRID_CSS = `
  .pm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 220px;
    gap: 12px;
  }
  .pm-tall { grid-row: span 2; }
  .pm-card {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    background: #e5e7eb;
  }
  .pm-card img {
    transition: transform 0.4s ease, filter 0.4s ease;
    object-fit: cover;
  }
  .pm-card:hover img {
    transform: scale(1.08);
    filter: brightness(1.1);
  }
  @media (max-width: 639px) {
    .pm-grid { grid-template-columns: 1fr; grid-auto-rows: 200px; }
    .pm-tall { grid-row: span 1; }
  }
`;

export function PhotoMosaic({ photos }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const lbOpen = lightboxIdx !== null;

  const open = useCallback((idx: number) => setLightboxIdx(idx), []);
  const close = useCallback(() => setLightboxIdx(null), []);

  const goNext = useCallback(() => {
    if (photos.length === 0) return;
    setLightboxIdx((prev) => (prev !== null ? (prev + 1) % photos.length : null));
  }, [photos.length]);

  const goPrev = useCallback(() => {
    if (photos.length === 0) return;
    setLightboxIdx((prev) =>
      prev !== null ? (prev - 1 + photos.length) % photos.length : null
    );
  }, [photos.length]);

  useEffect(() => {
    if (!lbOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lbOpen, close, goNext, goPrev]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lbOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lbOpen]);

  const displayPhotos = photos.slice(0, 6);
  const isEmpty = displayPhotos.length === 0;

  return (
    <>
      <style>{GRID_CSS}</style>

      {/* Mosaic grid */}
      <div className="pm-grid">
        {isEmpty
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`pm-card${i === 0 ? ' pm-tall' : ''}`}
                style={{
                  cursor: 'default',
                  background: '#f3f4f6',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Camera style={{ width: 32, height: 32, color: '#9ca3af' }} />
                <span style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                  Foto în curând
                </span>
              </div>
            ))
          : displayPhotos.map((photo, i) => (
              <div
                key={photo.id}
                className={`pm-card${i === 0 ? ' pm-tall' : ''}`}
                onClick={() => open(i)}
                title="Click pentru mărire"
              >
                <Image
                  src={photo.src}
                  alt={photo.caption || `River's Land — fotografie ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={photo.src.startsWith('/')}
                  sizes="(max-width: 639px) 100vw, 50vw"
                />

                {/* Gold overlay badge on photo 4 (index 3) */}
                {i === 3 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      background: '#C9A84C',
                      color: '#0F0F0F',
                      borderRadius: 12,
                      padding: '10px 16px',
                      fontWeight: 700,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      lineHeight: 1.2,
                      zIndex: 2,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                      pointerEvents: 'none',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>River&apos;s</span>
                    <span style={{ fontSize: 12 }}>Land 🎠</span>
                  </div>
                )}
              </div>
            ))}
      </div>

      {/* Lightbox */}
      {lbOpen && lightboxIdx !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={close}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (dx < -50) goNext();
            else if (dx > 50) goPrev();
          }}
        >
          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            aria-label="Închide"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              color: '#fff',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 8,
              width: 40,
              height: 40,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Înapoi"
              style={{
                position: 'absolute',
                left: 16,
                zIndex: 1,
                color: '#fff',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 8,
                width: 44,
                height: 44,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}
            >
              <ChevronLeft style={{ width: 24, height: 24 }} />
            </button>
          )}

          {/* Image — plain img tag, better for full-size lightbox */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightboxIdx].src}
            alt={photos[lightboxIdx].caption || `Fotografie ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              display: 'block',
              borderRadius: 8,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          />

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Următoarea"
              style={{
                position: 'absolute',
                right: 16,
                zIndex: 1,
                color: '#fff',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 8,
                width: 44,
                height: 44,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}
            >
              <ChevronRight style={{ width: 24, height: 24 }} />
            </button>
          )}

          {/* Counter */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#fff',
              fontSize: 13,
              background: 'rgba(0,0,0,0.55)',
              padding: '4px 14px',
              borderRadius: 20,
              backdropFilter: 'blur(4px)',
            }}
          >
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
