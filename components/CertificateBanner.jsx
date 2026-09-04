'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AnnouncementBar() {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div
            id="announcement-bar"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1200,
                background: 'linear-gradient(90deg, #0d1f3c 0%, #1a3a5e 50%, #0d1f3c 100%)',
                borderBottom: '2px solid #f5a623',
                boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
            }}
        >
            <div
                className="container"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 16px',
                    minHeight: '42px',
                }}
            >
                {/* ── Icon + label ── */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        flexShrink: 0,
                        overflow: 'hidden',
                    }}
                >
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🏅</span>
                    {/* Desktop label */}
                    <span
                        className="d-none d-md-block"
                        style={{
                            color: '#f5a623',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Boisar Varsha Marathon 2026 — Download your e-Certificate
                    </span>
                    {/* Mobile scrolling text */}
                    <div
                        className="d-block d-md-none"
                        style={{ overflow: 'hidden', maxWidth: '170px' }}
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                color: '#f5a623',
                                fontWeight: 700,
                                fontSize: '0.74rem',
                                whiteSpace: 'nowrap',
                                animation: 'announceTicker 12s linear infinite',
                            }}
                        >
                            🏃 Boisar Varsha Marathon 2026 — Get your e-Certificate below!&nbsp;&nbsp;&nbsp;
                        </span>
                    </div>
                </div>

                {/* ── Right side: form + portal link ── */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexShrink: 0,
                    }}
                >
                    {/* Desktop inline form */}
                    {/* <form
                        onSubmit={handleGo}
                        className="d-none d-md-flex"
                        style={{ alignItems: 'center', gap: '6px' }}
                    >
                        <label
                            htmlFor="ann-bib"
                            style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
                        >
                            BIB&nbsp;#
                        </label>
                        <input
                            id="ann-bib"
                            type="number"
                            min="1"
                            max="9999"
                            placeholder="e.g. 101"
                            value={bib}
                            onChange={(e) => setBib(e.target.value)}
                            style={{
                                width: '90px',
                                padding: '4px 8px',
                                borderRadius: '5px',
                                border: '1.5px solid rgba(245,166,35,0.55)',
                                background: 'rgba(255,255,255,0.07)',
                                color: '#fff',
                                fontSize: '0.8rem',
                                outline: 'none',
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: '#f5a623',
                                color: '#0d1f3c',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '5px',
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.3px',
                            }}
                        >
                            ⬇ Get Certificate
                        </button>
                    </form> */}

                    {/* Mobile: direct certificate button */}
                    <Link
                        href="/marathon-portal"
                        className="d-flex d-md-none"
                        style={{
                            background: '#f5a623',
                            color: '#0d1f3c',
                            textDecoration: 'none',
                            padding: '4px 10px',
                            borderRadius: '5px',
                            fontWeight: 800,
                            fontSize: '0.71rem',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.2px',
                        }}
                    >
                        ⬇ Download Certificate
                    </Link>

                    {/* Desktop: direct certificate button */}
                    <Link
                        href="/marathon-portal"
                        className="d-none d-md-flex align-items-center"
                        style={{
                            background: '#f5a623',
                            color: '#0d1f3c',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            padding: '5px 12px',
                            borderRadius: '5px',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.2px',
                            transition: 'background-color 0.2s ease, transform 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffd166';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5a623';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        ⬇ Download Certificate
                    </Link>

                    {/* Dismiss button */}
                    <button
                        onClick={() => setDismissed(true)}
                        aria-label="Dismiss announcement"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.45)',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            lineHeight: 1,
                            padding: '0 2px',
                            flexShrink: 0,
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Ticker animation keyframes */}
            <style>{`
                @keyframes announceTicker {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
