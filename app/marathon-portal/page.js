'use client';

import { useState } from 'react';
import styles from './marathon-portal.module.css';

export default function MarathonPortalPage() {
    const [bib, setBib] = useState('');
    const [participant, setParticipant] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLookup(e) {
        e.preventDefault();
        if (!bib.trim()) return;

        setLoading(true);
        setError('');
        setParticipant(null);

        try {
            const res = await fetch(`/api/marathon-lookup?bib=${encodeURIComponent(bib.trim())}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Participant not found. Please check your BIB number.');
            } else {
                setParticipant(data.participant);
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // We will use a native anchor link for downloading to guarantee the browser respects the .pdf extension.

    function getCategoryColor(category) {
        if (!category) return '#1e3a6e';
        const c = category.toLowerCase();
        if (c.includes('open mens') || c.includes('open men')) return '#1a3c6b';
        if (c.includes('open womens') || c.includes('open women')) return '#6b1a4a';
        if (c.includes('u14')) return '#1a6b3c';
        if (c.includes('u17')) return '#1a5c6b';
        if (c.includes('u19')) return '#4a6b1a';
        if (c.includes('senior')) return '#6b4a1a';
        if (c.includes('couple')) return '#6b1a6b';
        return '#1e3a6e';
    }

    return (
        <div className={styles.page}>
            {/* ── Background ── */}
            <div className={styles.bgOverlay} />

            <div className={styles.container}>
                {/* ── Header ── */}
                <header className={styles.header}>
                    <div className={styles.logoArea}>
                        <div className={styles.medalIcon}>🏅</div>
                        <div>
                            <h1 className={styles.title}>BOISAR VARSHA MARATHON 2026</h1>
                            <p className={styles.subtitle}>Participant Certificate Portal</p>
                        </div>
                    </div>
                    <p className={styles.tagline}>
                        Enter your BIB number to retrieve your details and download your personalized
                        participation certificate.
                    </p>
                </header>

                {/* ── Search Form ── */}
                <div className={styles.searchCard}>
                    <h2 className={styles.searchTitle}>Find Your Certificate</h2>
                    <form onSubmit={handleLookup} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="bib-input" className={styles.label}>
                                🔢 Enter Your BIB Number
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="bib-input"
                                    type="number"
                                    min="1"
                                    max="9999"
                                    placeholder="e.g. 101"
                                    value={bib}
                                    onChange={e => setBib(e.target.value)}
                                    className={styles.input}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    className={styles.searchBtn}
                                    disabled={loading || !bib.trim()}
                                    id="bib-search-btn"
                                >
                                    {loading ? (
                                        <span className={styles.spinner} />
                                    ) : (
                                        'Search'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    {error && (
                        <div className={styles.errorBox} role="alert">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                </div>

                {/* ── Result Card ── */}
                {participant && (
                    <div className={styles.resultCard} id="participant-result">
                        <div
                            className={styles.categoryBadge}
                            style={{ backgroundColor: getCategoryColor(participant.category) }}
                        >
                            {participant.race_group}
                        </div>

                        <div className={styles.participantInfo}>
                            <div className={styles.bibTag}>BIB #{participant.bib_number}</div>
                            <h2 className={styles.participantName}>{participant.full_name}</h2>

                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Category</span>
                                    <span className={styles.detailValue}>{participant.category}</span>
                                </div>
                                {participant.organization && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Organisation</span>
                                        <span className={styles.detailValue}>{participant.organization}</span>
                                    </div>
                                )}
                                {participant.date_of_birth && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Date of Birth</span>
                                        <span className={styles.detailValue}>{participant.date_of_birth}</span>
                                    </div>
                                )}
                                {participant.age && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Age</span>
                                        <span className={styles.detailValue}>{participant.age} years</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Certificate Download */}
                        <div className={styles.certificateArea}>
                            <div className={styles.certificatePreview}>
                                <div className={styles.certIcon}>🏆</div>
                                <div>
                                    <p className={styles.certTitle}>Participation Certificate</p>
                                    <p className={styles.certDesc}>
                                        Your personalized certificate for <strong>{participant.full_name}</strong> is
                                        ready to download.
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`/api/marathon-certificate?bib=${participant.bib_number}`}
                                download={`Marathon_Certificate_BIB_${participant.bib_number}.pdf`}
                                className={styles.downloadBtn}
                                id="download-certificate-btn"
                            >
                                ⬇️ Download Certificate
                            </a>
                        </div>
                    </div>
                )}

                {/* ── Footer ── */}
                <footer className={styles.footer}>
                    <p>Organised by <strong>Aadhar Pratishthan</strong> | Palghar District</p>
                    <p>30 August 2026 • Boisar, Maharashtra</p>
                </footer>
            </div>
        </div>
    );
}
