'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

export default function ImageGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const current = images?.[activeIndex];
  const hasMultiple = images?.length > 1;

  const next = useCallback(() => {
    if (images) setActiveIndex(i => (i + 1) % images.length);
  }, [images]);

  const prev = useCallback(() => {
    if (images) setActiveIndex(i => (i - 1 + images.length) % images.length);
  }, [images]);

  if (!images?.length) {
    return (
      <div className="aspect-square bg-warm rounded-2xl flex items-center justify-center text-ink-light">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-warm cursor-pointer"
          onClick={() => setLightboxOpen(true)}
          onMouseEnter={e => {
            if (window.innerWidth >= 1024) {
              const el = e.currentTarget;
              const img = el.querySelector('img');
              if (!img) return;
              const rect = el.getBoundingClientRect();
              const handleMouseMove = (ev) => {
                const x = (ev.clientX - rect.left) / rect.width * 100;
                const y = (ev.clientY - rect.top) / rect.height * 100;
                img.style.transformOrigin = `${x}% ${y}%`;
                img.style.transform = 'scale(1.5)';
              };
              el.addEventListener('mousemove', handleMouseMove);
              el.addEventListener('mouseleave', () => {
                el.removeEventListener('mousemove', handleMouseMove);
                img.style.transform = 'scale(1)';
              }, { once: true });
            }
          }}
        >
          <Image
            src={current.imageUrl}
            alt={current.altText || 'Product image'}
            fill
            className="object-cover transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 60vw"
            priority
          />
          {hasMultiple && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>
        {hasMultiple && (
          <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[400px]">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  i === activeIndex ? 'border-forest opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.imageUrl}
                  alt={img.altText || ''}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white p-2 min-h-[48px] min-w-[48px] flex items-center justify-center z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {hasMultiple && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 text-white p-2 min-h-[48px] min-w-[48px] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 text-white p-2 min-h-[48px] min-w-[48px] flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div className="relative w-full max-w-4xl aspect-square mx-4"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={current.imageUrl}
              alt={current.altText || ''}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
          <div className="absolute bottom-4 text-white text-sm">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
