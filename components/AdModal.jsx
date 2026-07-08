'use client';

import { useEffect, useState } from 'react';

/**
 * AdModal — First-visit advertisement popup.
 *
 * Props:
 *  onRegister  — callback fired when the user clicks the image or "Register" button
 *  onClose     — callback fired when the user closes the modal
 */
export default function AdModal({ onRegister, onClose }) {
    const [visible, setVisible] = useState(false);

    /* Show the modal only once per browser session */
    useEffect(() => {
        const seen = sessionStorage.getItem('adModalSeen');
        if (!seen) {
            // Small delay so the page has a moment to paint first
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    /* Lock body scroll while modal is open */
    useEffect(() => {
        if (visible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [visible]);

    const handleClose = () => {
        sessionStorage.setItem('adModalSeen', '1');
        setVisible(false);
        onClose && onClose();
    };

    const handleRegister = () => {
        sessionStorage.setItem('adModalSeen', '1');
        setVisible(false);
        onRegister && onRegister();
    };

    if (!visible) return null;

    return (
        <>
            {/* ── Backdrop ── */}
            <div
                id="ad-modal-backdrop"
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.72)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9990,
                    animation: 'adFadeIn 0.35s ease',
                }}
            />

            {/* ── Modal card ── */}
            <div
                id="ad-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Boisar Varsha Marathon 2025 Advertisement"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9991,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        pointerEvents: 'auto',
                        position: 'relative',
                        background: '#fff',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)',
                        maxWidth: '480px',
                        width: '100%',
                        animation: 'adSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    {/* ── Close button ── */}
                    <button
                        id="ad-modal-close"
                        onClick={handleClose}
                        aria-label="Close advertisement"
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 10,
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(0,0,0,0.55)',
                            color: '#fff',
                            fontSize: '18px',
                            lineHeight: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s, transform 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
                            e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.55)';
                            e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                        }}
                    >
                        ✕
                    </button>

                    {/* ── Banner image (clickable) ── */}
                    <div
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={handleRegister}
                        title="Click to Register"
                    >
                        <img
                            src="/images/banner.jpeg"
                            alt="Boisar Varsha Marathon 2025"
                            style={{
                                width: '100%',
                                display: 'block',
                                objectFit: 'cover',
                                maxHeight: '420px',
                            }}
                        />

                        {/* Subtle gradient overlay at the bottom */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '110px',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                                pointerEvents: 'none',
                            }}
                        />

                        {/* "Tap to Register" hint */}
                        <span
                            style={{
                                position: 'absolute',
                                bottom: '14px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                color: 'rgba(255,255,255,0.75)',
                                fontSize: '0.72rem',
                                letterSpacing: '0.8px',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                textTransform: 'uppercase',
                            }}
                        >
                            Tap image to register
                        </span>
                    </div>

                    {/* ── Bottom action bar ── */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 20px',
                            background: '#0a0a12',
                            gap: '12px',
                        }}
                    >
                        {/* Event label */}
                        <div style={{ minWidth: 0 }}>
                            <p
                                style={{
                                    margin: 0,
                                    color: '#ffcc00',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                🏃 Boisar Varsha Marathon 2025
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    color: 'rgba(255,255,255,0.45)',
                                    fontSize: '0.7rem',
                                    marginTop: '2px',
                                }}
                            >
                                Limited spots available
                            </p>
                        </div>

                        {/* Register CTA button */}
                        <button
                            id="ad-modal-register-btn"
                            onClick={handleRegister}
                            style={{
                                flexShrink: 0,
                                background: 'linear-gradient(135deg, #ffcc00, #ffb300)',
                                color: '#0a0a12',
                                border: 'none',
                                borderRadius: '50px',
                                padding: '10px 24px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                letterSpacing: '0.6px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                boxShadow: '0 6px 20px rgba(255,204,0,0.4)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
                                e.currentTarget.style.boxShadow = '0 10px 28px rgba(255,204,0,0.55)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,204,0,0.4)';
                            }}
                        >
                            Register
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Keyframe animations (injected once) ── */}
            <style>{`
        @keyframes adFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes adSlideUp {
          from { opacity: 0; transform: translateY(50px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
        </>
    );
}
