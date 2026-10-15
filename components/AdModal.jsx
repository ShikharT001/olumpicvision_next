'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * AdModal — First-visit advertisement popup for Palghar District Volleyball League 2026.
 *
 * Props:
 *  onRegister  — optional callback fired when the user clicks the banner or "Register" button
 *  onClose     — optional callback fired when the user closes the modal
 */
export default function AdModal({ onRegister, onClose }) {
    const router = useRouter();
    const [visible, setVisible] = useState(false);

    /* Show the modal on first visit per browser session (or force with ?ad=1 or ?preview_ad=true) */
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('ad') === '1' || urlParams.get('preview_ad') === 'true') {
            setVisible(true);
            return;
        }

        const seen = sessionStorage.getItem('adModalSeen_pdvl2026');
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
        return () => {
            document.body.style.overflow = '';
        };
    }, [visible]);

    const handleClose = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        sessionStorage.setItem('adModalSeen_pdvl2026', '1');
        setVisible(false);
        onClose && onClose();
    };

    const handleRegister = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        sessionStorage.setItem('adModalSeen_pdvl2026', '1');
        setVisible(false);
        if (onRegister) {
            onRegister();
        } else {
            router.push('/pdvl-registration');
        }
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
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 9990,
                    animation: 'adFadeIn 0.35s ease',
                }}
            />

            {/* ── Modal container ── */}
            <div
                id="ad-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Palghar District Volleyball League 2026 Advertisement"
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
                        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                        maxWidth: '560px',
                        width: '100%',
                        animation: 'adSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    {/* ── Close button at right top corner of image ── */}
                    <button
                        id="ad-modal-close"
                        onClick={handleClose}
                        aria-label="Close advertisement"
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 25,
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            lineHeight: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)',
                            transition: 'background 0.2s, transform 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.85)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.65)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        ✕
                    </button>

                    {/* ── Banner image (Click / Tap to open /pdvl-registration) ── */}
                    <Link
                        href="/pdvl-registration"
                        onClick={handleRegister}
                        style={{
                            display: 'block',
                            position: 'relative',
                            cursor: 'pointer',
                            textDecoration: 'none',
                        }}
                        title="Click to Register for PDVL 2026"
                    >
                        <img
                            src="/images/banner1.jpeg"
                            alt="Palghar District Volleyball League 2026"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                objectFit: 'contain',
                            }}
                        />
                    </Link>

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
                                    fontSize: '0.85rem',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                🏐 Palghar District Volleyball League 2026
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    color: 'rgba(255,255,255,0.6)',
                                    fontSize: '0.72rem',
                                    marginTop: '2px',
                                }}
                            >
                                November - December 2026 • Registration Open
                            </p>
                        </div>

                        {/* Register CTA button */}
                        <Link
                            id="ad-modal-register-btn"
                            href="/pdvl-registration"
                            onClick={handleRegister}
                            style={{
                                flexShrink: 0,
                                background: 'linear-gradient(135deg, #ffcc00, #ffb300)',
                                color: '#0a0a12',
                                textDecoration: 'none',
                                border: 'none',
                                borderRadius: '50px',
                                padding: '10px 22px',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                letterSpacing: '0.6px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                boxShadow: '0 6px 20px rgba(255,204,0,0.4)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
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
                            Register Now
                        </Link>
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
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
        </>
    );
}
