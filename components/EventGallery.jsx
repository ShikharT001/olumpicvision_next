'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

export default function EventGallery({ images, eventTitle }) {
  const [lightboxIndex, setLightboxIndex] = useState(null); // null = closed

  const isOpen = lightboxIndex !== null;

  const openAt = (index) => setLightboxIndex(index);
  const close = () => setLightboxIndex(null);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, prev, next]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* ── Grid ── */}
      <div className="event-gallery-grid">
        {images.map((image, index) => (
          <figure
            className="event-gallery-card"
            key={image.src}
            onClick={() => openAt(index)}
            style={{ cursor: 'pointer' }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="event-gallery-img"
              style={{ transition: 'transform 0.3s ease' }}
            />
            {/* Hover overlay hint */}
            <div className="gallery-card-hover-hint">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </div>
            <figcaption>{eventTitle} – Photo {index + 1}</figcaption>
          </figure>
        ))}
      </div>

      {/* ── Lightbox ── */}
      {isOpen && (
        <div
          className="lightbox-backdrop"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Counter */}
          <div className="lightbox-counter">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Close */}
          <button
            className="lightbox-close"
            onClick={close}
            aria-label="Close lightbox"
          >
            ✕
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="lightbox-nav lightbox-prev"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <div
            className="lightbox-img-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              fill
              sizes="100vw"
              className="lightbox-img"
              priority
            />
            {/* Caption */}
            <p className="lightbox-caption">{images[lightboxIndex].alt}</p>
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              className="lightbox-nav lightbox-next"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next image"
            >
              ›
            </button>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="lightbox-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`lightbox-dot ${i === lightboxIndex ? 'lightbox-dot-active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        /* ── Gallery card hover ── */
        .event-gallery-card {
          position: relative;
          overflow: hidden;
        }
        .event-gallery-card:hover .event-gallery-img {
          transform: scale(1.04);
        }
        .gallery-card-hover-hint {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s ease;
          z-index: 2;
        }
        .event-gallery-card:hover .gallery-card-hover-hint {
          opacity: 1;
        }

        /* ── Lightbox backdrop ── */
        .lightbox-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.92);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Counter top-left */
        .lightbox-counter {
          position: absolute;
          top: 18px;
          left: 24px;
          color: rgba(255,255,255,0.7);
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          z-index: 10;
        }

        /* Close button */
        .lightbox-close {
          position: absolute;
          top: 14px;
          right: 20px;
          background: rgba(255,255,255,0.12);
          border: none;
          color: white;
          font-size: 1.4rem;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .lightbox-close:hover {
          background: rgba(255,255,255,0.25);
        }

        /* Prev / Next arrows */
        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.12);
          border: none;
          color: white;
          font-size: 2.8rem;
          line-height: 1;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.2s;
        }
        .lightbox-nav:hover {
          background: rgba(255,255,255,0.28);
          transform: translateY(-50%) scale(1.1);
        }
        .lightbox-prev { left: 16px; }
        .lightbox-next { right: 16px; }

        /* Image container */
        .lightbox-img-wrap {
          position: relative;
          width: min(90vw, 960px);
          height: min(80vh, 680px);
          border-radius: 8px;
          overflow: hidden;
        }
        .lightbox-img {
          object-fit: contain;
        }

        /* Caption */
        .lightbox-caption {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.65));
          color: rgba(255,255,255,0.88);
          font-size: 0.8rem;
          padding: 24px 16px 12px;
          margin: 0;
          text-align: center;
        }

        /* Dot indicators */
        .lightbox-dots {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 10;
        }
        .lightbox-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.35);
          cursor: pointer;
          padding: 0;
          transition: background 0.2s, transform 0.2s;
        }
        .lightbox-dot-active {
          background: white;
          transform: scale(1.3);
        }

        /* Mobile tweaks */
        @media (max-width: 600px) {
          .lightbox-nav { width: 40px; height: 40px; font-size: 2rem; }
          .lightbox-prev { left: 6px; }
          .lightbox-next { right: 6px; }
          .lightbox-img-wrap {
            width: 96vw;
            height: 70vh;
          }
        }
      `}</style>
    </>
  );
}