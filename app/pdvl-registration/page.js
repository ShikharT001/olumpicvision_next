import Link from 'next/link';
import PDVLRegistrationForm from '@/components/PDVLRegistrationForm';

export const metadata = {
  title: 'PDVL 2026 Player Registration | Olympic Vision',
  description: 'Official online player registration undertaking for Palghar District Volleyball League (PDVL) 2026/27.',
};

export default function PDVLRegistrationPage() {
  return (
    <main className="pdvl-page-bg min-vh-100 py-4 py-md-5">
      <div className="container px-3 px-sm-4 position-relative" style={{ zIndex: 1 }}>
        <div className="mx-auto" style={{ maxWidth: 940 }}>
          {/* Top Navigation & Status Badge */}
          <div className="mb-3 d-flex align-items-center justify-content-between">
            <Link
              href="/"
              className="btn btn-sm btn-light border rounded-pill px-3 py-1.5 fw-bold text-dark d-inline-flex align-items-center gap-2 shadow-sm transition-all hover-lift"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
              </svg>
              <span>Back to Olympic Vision</span>
            </Link>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-white text-dark border shadow-sm px-3 py-2 rounded-pill small fw-bold d-inline-flex align-items-center gap-1.5">
                <span className="bg-success rounded-circle d-inline-block" style={{ width: 8, height: 8 }}></span>
                Season 2026/27
              </span>
            </div>
          </div>

          {/* Main Card */}
          <div className="card border-0 rounded-4 overflow-hidden pdvl-card">
            {/* Hero Header with Background Illumination */}
            <div className="p-4 p-md-5 text-white pdvl-hero-banner">
              <div className="position-relative" style={{ zIndex: 2 }}>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <span className="badge bg-warning text-dark fw-extrabold text-uppercase px-2.5 py-1 rounded-pill" style={{ fontSize: '0.72rem', letterSpacing: '.08em' }}>
                    PDVL 2026 OFFICIAL FORM
                  </span>
                  <span className="text-white-50 small">•</span>
                  <span className="text-white-50 small font-monospace">Official Player Undertaking</span>
                </div>
                <h1 className="h2 fw-extrabold mb-2 text-white tracking-tight">
                  Palghar District Volleyball League 2026
                </h1>
                <p className="mb-0 text-white-50 fs-6 max-w-2xl leading-relaxed">
                  Complete your official player undertaking & registration online. Follow all 4 simple steps to submit your player profile.
                </p>
              </div>
            </div>

            {/* Form Body Container */}
            <div className="card-body p-3 p-sm-4 p-md-5 bg-white">
              <PDVLRegistrationForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


