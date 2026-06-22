import Image from 'next/image';
import Link from 'next/link';

const galleryImages = [
  {
    src: '/images/boisar_marathon/event1.jpeg',
    alt: 'Boisar Varsha Marathon runners at the event start',
  },
  {
    src: '/images/boisar_marathon/event2.jpeg',
    alt: 'Boisar Varsha Marathon crowd and event energy',
  },
  {
    src: '/images/boisar_marathon/image2.jpeg',
    alt: 'Boisar Varsha Marathon community celebration',
  },
];

const eventFacts = [
  { label: 'Event', value: 'Boisar Varsha Marathon 2025' },
  { label: 'Category', value: 'Marathon' },
  { label: 'Location', value: 'Boisar, Maharashtra' },
  { label: 'Theme', value: 'Monsoon fitness and community spirit' },
];

const highlights = [
  'Monsoon run experience built around energy, endurance, and local pride.',
  'Community-first event atmosphere for runners, families, and supporters.',
  'Organized by Olympic Vision Sports & Event Management with focused ground coordination.',
  'Photo moments, cheering zones, and a strong finish-line celebration.',
];

export const metadata = {
  title: 'Boisar Varsha Marathon 2025 | Olympic Vision',
  description: 'Explore Boisar Varsha Marathon 2025 by Olympic Vision Sports & Event Management.',
};

export default function BoisarVarshaMarathonPage() {
  return (
    <main className="event-detail-page">
      <section className="event-detail-hero">
        <Image
          src="/images/boisar_marathon/event1.jpeg"
          alt="Boisar Varsha Marathon 2025"
          fill
          priority
          sizes="100vw"
          className="event-detail-hero-img"
        />
        <div className="event-detail-hero-overlay" />
        <div className="container event-detail-hero-content">
          <Link href="/#events" className="event-back-link">
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Back to events
          </Link>
          <div className="event-kicker">Marathon</div>
          <h1>Boisar Varsha Marathon 2025</h1>
          <p>
            A spirited monsoon run bringing athletes, first-time runners, and the Boisar
            community together for fitness, celebration, and shared momentum.
          </p>
          <div className="event-hero-actions">
            <a href="#gallery" className="event-primary-action">
              View Gallery
            </a>
            <Link href="/#contact" className="event-secondary-action">
              Contact Team
            </Link>
          </div>
        </div>
      </section>

      <section className="event-detail-content">
        <div className="container">
          <div className="event-detail-grid">
            <aside className="event-facts-panel">
              <h2>Event Details</h2>
              <div className="event-fact-list">
                {eventFacts.map((fact) => (
                  <div className="event-fact" key={fact.label}>
                    <span>{fact.label}</span>
                    <strong>{fact.value}</strong>
                  </div>
                ))}
              </div>
            </aside>

            <div className="event-story-panel">
              <span className="event-section-label">Overview</span>
              <h2>Rain, road, and a city running together.</h2>
              <p>
                Boisar Varsha Marathon 2025 celebrates the joy of running in the rainy
                season with a route experience designed for participation, encouragement,
                and memorable event-day energy. The page is ready for richer race details
                as schedules, route maps, and registration data are finalized.
              </p>

              <div className="event-highlight-list">
                {highlights.map((highlight) => (
                  <div className="event-highlight-item" key={highlight}>
                    <i className="fa-solid fa-check" aria-hidden="true"></i>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="gallery" className="event-gallery-section">
            <div className="event-gallery-heading">
              <span className="event-section-label">Gallery</span>
              <h2>Moments from the marathon</h2>
            </div>
            <div className="event-gallery-grid">
              {galleryImages.map((image, index) => (
                <figure className="event-gallery-card" key={image.src}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="event-gallery-img"
                  />
                  <figcaption>Boisar Varsha Marathon {index + 1}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
