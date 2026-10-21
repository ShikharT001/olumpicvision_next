import { authenticateAuction } from '@/app/auction/actions';

export default function AuctionLoginGate({ errorMessage, returnTo = '/auction' }) {
  return (
    <div className="auction-shell min-vh-100 d-flex flex-column align-items-center justify-content-center p-3" data-bs-theme="dark">
      <div className="auction-card p-4 p-sm-5 text-center shadow-lg" style={{ maxWidth: 460, width: '100%', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
        {/* Icon & Badge */}
        <div className="d-inline-flex align-items-center justify-content-center bg-dark rounded-circle mb-3 border border-secondary border-opacity-50" style={{ width: 72, height: 72 }}>
          <span className="fs-1">🏆</span>
        </div>

        <div className="mb-3">
          <span className="badge badge-gold px-2.5 py-1 rounded-pill text-xs fw-extrabold text-uppercase">
            Multi-Sport Tournament Portal
          </span>
          <h2 className="h4 fw-bold text-white mt-2 mb-1 tracking-tight">
            Auction Platform Sign-In
          </h2>
          <p className="text-secondary small mb-0 leading-relaxed">
            Admin access unlocks sport selection, tournament creation, team purses, and live auction gavel controls. Team passcode unlocks stage viewing and squad boards.
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger border-0 py-2 px-3 small text-start mb-3" role="alert">
            <strong>Access Denied:</strong> {errorMessage}
          </div>
        )}

        <form action={authenticateAuction} className="vstack gap-3 text-start">
          <input type="hidden" name="returnTo" value={returnTo} />

          <div>
            <label className="form-label text-white-50 small mb-1.5 fw-semibold" htmlFor="auction-password">
              Admin / Franchise Passcode PIN
            </label>
            <input
              id="auction-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter authorized password (e.g. admin)"
              className="form-control bg-dark text-white border-secondary"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary rounded-pill py-2.5 fw-bold text-sm w-100 shadow-sm transition-all"
          >
            Unlock Auction Portal →
          </button>
        </form>

        <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 text-center text-white-50 text-xs">
          <span>Olympic Vision Multi-Sport Auction System • Protected Area</span>
        </div>
      </div>
    </div>
  );
}
