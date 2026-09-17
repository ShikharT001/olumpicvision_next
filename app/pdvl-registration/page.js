import PDVLRegistrationForm from '@/components/PDVLRegistrationForm';

export const metadata = { title: 'PDVL 2026 Player Registration | Olympic Vision' };

export default function PDVLRegistrationPage() {
  return <main className="bg-light min-vh-100 py-5"><div className="container py-4"><div className="mx-auto" style={{ maxWidth: 860 }}><div className="card border-0 shadow-sm rounded-4 overflow-hidden"><div className="p-4 p-md-5 text-white" style={{ background: 'linear-gradient(135deg, #063b78, #0b72bc)' }}><p className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: '.12em' }}>Player registration undertaking</p><h1 className="h2 fw-bold mb-2">Palghar District Volleyball League (PDVL) 2026</h1><p className="mb-0 text-white-50">Complete all three steps to register as a player for the 2026/27 league season.</p></div><div className="card-body p-4 p-md-5"><PDVLRegistrationForm /></div></div></div></div></main>;
}
