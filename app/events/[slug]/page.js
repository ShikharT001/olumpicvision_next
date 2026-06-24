import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EventGallery from '@/components/EventGallery';

// ─── Central event registry ───────────────────────────────────────────────────
// Add / edit events here. Drop real image paths in when you have them.
const eventsRegistry = {
//   'boisar-varsha-marathon-2025': {
//     title: 'Boisar Varsha Marathon 2025',
//     tag: 'Marathon',
//     location: 'Boisar, Maharashtra',
//     theme: 'Monsoon fitness and community spirit',
//     heroImage: '/images/boisar_marathon/event1.jpeg',
//     overview: {
//       heading: 'Rain, road, and a city running together.',
//       body: `Boisar Varsha Marathon 2025 celebrates the joy of running in the rainy
//       season with a route experience designed for participation, encouragement,
//       and memorable event-day energy. The page is ready for richer race details
//       as schedules, route maps, and registration data are finalized.`,
//     },
//     highlights: [
//       'Monsoon run experience built around energy, endurance, and local pride.',
//       'Community-first event atmosphere for runners, families, and supporters.',
//       'Organized by Olympic Vision Sports & Event Management with focused ground coordination.',
//       'Photo moments, cheering zones, and a strong finish-line celebration.',
//     ],
//     gallery: [
//       { src: '/images/boisar_marathon/event1.jpeg', alt: 'Boisar Varsha Marathon – start line energy' },
//       { src: '/images/boisar_marathon/event2.jpeg', alt: 'Boisar Varsha Marathon – crowd and atmosphere' },
//       { src: '/images/boisar_marathon/image2.jpeg', alt: 'Boisar Varsha Marathon – community celebration' },
//     ],
//   },

//   'saphale-lions-hill-marathon-2024': {
//     title: 'Saphale Lions Hill Marathon 2024',
//     tag: 'Marathon',
//     location: 'Saphale, Maharashtra',
//     theme: 'Endurance through scenic hill terrain',
//     heroImage: '/images/saphale_marathon/hero.jpeg', // placeholder – replace when ready
//     overview: {
//       heading: 'Hills, heart, and runners who earned every metre.',
//       body: `The Saphale Lions Hill Marathon challenged participants across rolling
//       scenic terrain, testing endurance and grit while showcasing the natural
//       beauty of the region. Full race details, route maps, and results will be
//       published here as they are confirmed.`,
//     },
//     highlights: [
//       'Challenging hill route designed for seasoned and first-time marathon runners.',
//       'Scenic landscapes offering a visually rewarding race experience.',
//       'Supported by Lions Club and local sports bodies for smooth coordination.',
//       'Medal ceremony and post-race community celebration at the finish.',
//     ],
//     gallery: [
//       { src: '/images/saphale_marathon/gallery1.jpeg', alt: 'Saphale Lions Hill Marathon – hill terrain run' },
//       { src: '/images/saphale_marathon/gallery2.jpeg', alt: 'Saphale Lions Hill Marathon – finish line' },
//       { src: '/images/saphale_marathon/gallery3.jpeg', alt: 'Saphale Lions Hill Marathon – runners in nature' },
//     ],
//   },

//   'adhivasi-jawar-marathon-2024-2025': {
//     title: 'Adhivasi Jawar Marathon 2024 & 2025',
//     tag: 'Marathon',
//     location: 'Jawar, Maharashtra',
//     theme: 'Cultural heritage and tribal community empowerment',
//     heroImage: '/images/jawar_marathon/hero.jpeg', // placeholder – replace when ready
//     overview: {
//       heading: 'Running as celebration of culture and community.',
//       body: `The Adhivasi Jawar Marathon honours the local tribal heritage of the
//       Jawar region while empowering participants through sport. Held across two
//       editions, this event has grown into a meaningful cultural fixture, bringing
//       together runners, families, and community leaders in shared celebration.`,
//     },
//     highlights: [
//       'Deeply rooted in tribal heritage, making every race mile meaningful.',
//       'Two successful editions (2024 & 2025) with growing community participation.',
//       'Empowers local youth through structured race-day roles and visibility.',
//       'Celebration of Adhivasi culture woven into the event-day experience.',
//     ],
//     gallery: [
//       { src: '/images/jawar_marathon/gallery1.jpeg', alt: 'Adhivasi Jawar Marathon – community runners' },
//       { src: '/images/jawar_marathon/gallery2.jpeg', alt: 'Adhivasi Jawar Marathon – cultural moments' },
//       { src: '/images/jawar_marathon/gallery3.jpeg', alt: 'Adhivasi Jawar Marathon – tribal celebration' },
//     ],
//   },

//   'athletes-camp-dahanu': {
//     title: 'Athletes Camp Dahanu',
//     tag: 'Training Camp',
//     location: 'Dahanu, Maharashtra',
//     theme: 'Elite residential training for young prospects',
//     heroImage: '/images/dahanu_camp/hero.jpeg', // placeholder – replace when ready
//     overview: {
//       heading: 'Where future champions build their foundation.',
//       body: `The Athletes Camp Dahanu is an intensive high-performance residential
//       programme designed to develop young sporting talent through structured
//       coaching, fitness regimens, and competitive exposure. The camp brings
//       together promising athletes under elite guidance for focused skill-building.`,
//     },
//     highlights: [
//       'Residential format with full immersion in athletic discipline and routines.',
//       'Elite coaching staff delivering sport-specific technical training.',
//       'Structured regimens covering conditioning, nutrition, and mental toughness.',
//       'Pathway programme offering visibility for selection into higher competitions.',
//     ],
//     gallery: [
//       { src: '/images/dahanu_camp/gallery1.jpeg', alt: 'Athletes Camp Dahanu – training session' },
//       { src: '/images/dahanu_camp/gallery2.jpeg', alt: 'Athletes Camp Dahanu – coaching on the field' },
//       { src: '/images/dahanu_camp/gallery3.jpeg', alt: 'Athletes Camp Dahanu – residential camp life' },
//     ],
//   },

//   'volleyball-tournament': {
//     title: 'Volleyball Tournament',
//     tag: 'Championship',
//     location: 'Maharashtra',
//     theme: 'High-energy competitive court action',
//     heroImage: '/images/volleyball/hero.jpeg', // placeholder – replace when ready
//     overview: {
//       heading: 'Every spike, every rally, every point earned.',
//       body: `The Volleyball Tournament brought together competitive teams across
//       the region for a high-intensity championship format. Teams demonstrated
//       tactical mastery, teamwork, and athletic excellence across multiple match
//       days. Full fixtures, scores, and team highlights will be featured here.`,
//     },
//     highlights: [
//       'Multi-team regional championship with knockout and league formats.',
//       'High-energy match days with cheering crowds and competitive spirit.',
//       'Showcases grassroots volleyball talent from across Maharashtra.',
//       'Organized with professional match officiating and structured scheduling.',
//     ],
//     gallery: [
//       { src: '/images/volleyball/gallery1.jpeg', alt: 'Volleyball Tournament – match in action' },
//       { src: '/images/volleyball/gallery2.jpeg', alt: 'Volleyball Tournament – team celebration' },
//       { src: '/images/volleyball/gallery3.jpeg', alt: 'Volleyball Tournament – award ceremony' },
//     ],
//   },

//   'cricket-tournament': {
//     title: 'Cricket Tournament',
//     tag: 'Championship',
//     location: 'Maharashtra',
//     theme: 'Regional rivalry and premium local talent',
//     heroImage: '/images/cricket/hero.jpeg', // placeholder – replace when ready
//     overview: {
//       heading: 'Bat, ball, and the thrill of the chase.',
//       body: `The Cricket Tournament captured intense regional rivalries with
//       strategic play across multiple match days. Teams competed under pressure
//       with every match delivering the drama, skill, and passion that defines
//       grassroots cricket. Detailed match summaries and standings will be
//       published as results are confirmed.`,
//     },
//     highlights: [
//       'Thrilling regional format with competitive teams from across the district.',
//       'Intense rivalries and high-pressure chase scenarios in every fixture.',
//       'Showcases premium local batting and bowling talent.',
//       'Professionally managed with structured scheduling and umpiring.',
//     ],
//     gallery: [
//       { src: '/images/cricket/gallery1.jpeg', alt: 'Cricket Tournament – batting in action' },
//       { src: '/images/cricket/gallery2.jpeg', alt: 'Cricket Tournament – bowling and fielding' },
//       { src: '/images/cricket/gallery3.jpeg', alt: 'Cricket Tournament – team and trophy' },
//     ],
//   },
'boisar-varsha-marathon-2025': {
    title: 'Boisar Varsha Marathon 2025',
    tag: 'Marathon',
    location: 'Boisar, Maharashtra',
    theme: 'Monsoon fitness and community spirit',
    heroImage: '/images/boisar_marathon/event1.jpeg',
    overview: {
      heading: 'Rain, road, and a city running together.',
      body: `Boisar Varsha Marathon 2025 celebrates the joy of running in the rainy
      season with a route experience designed for participation, encouragement,
      and memorable event-day energy. The page is ready for richer race details
      as schedules, route maps, and registration data are finalized.`,
    },
    highlights: [
      'Monsoon run experience built around energy, endurance, and local pride.',
      'Community-first event atmosphere for runners, families, and supporters.',
      'Organized by Olympic Vision Sports & Event Management with focused ground coordination.',
      'Photo moments, cheering zones, and a strong finish-line celebration.',
    ],
    gallery: [
      { src: '/images/boisar_marathon/event1.jpeg', alt: 'Boisar Varsha Marathon – start line energy' },
      { src: '/images/boisar_marathon/event2.jpeg', alt: 'Boisar Varsha Marathon – crowd and atmosphere' },
      { src: '/images/boisar_marathon/image2.jpeg', alt: 'Boisar Varsha Marathon – community celebration' },
    ],
  },

  'saphale-lions-hill-marathon-2024': {
    title: 'Saphale Lions Hill Marathon 2024',
    tag: 'Marathon',
    location: 'Saphale, Maharashtra',
    theme: 'Endurance through scenic hill terrain',
    heroImage: '/images/saphale_marathon/image1.jpeg', // placeholder – replace when ready
    overview: {
      heading: 'Hills, heart, and runners who earned every metre.',
      body: `The Saphale Lions Hill Marathon challenged participants across rolling
      scenic terrain, testing endurance and grit while showcasing the natural
      beauty of the region. Full race details, route maps, and results will be
      published here as they are confirmed.`,
    },
    highlights: [
      'Challenging hill route designed for seasoned and first-time marathon runners.',
      'Scenic landscapes offering a visually rewarding race experience.',
      'Supported by Lions Club and local sports bodies for smooth coordination.',
      'Medal ceremony and post-race community celebration at the finish.',
    ],
    gallery: [
      { src: '/images/saphale_marathon/image1.jpeg', alt: 'Saphale Lions Hill Marathon – hill terrain run' },
    //   { src: '/images/saphale_marathon/image2.jpeg', alt: 'Saphale Lions Hill Marathon – finish line' },
    //   { src: '/images/saphale_marathon/image3.jpeg', alt: 'Saphale Lions Hill Marathon – runners in nature' },
    ],
  },

  'adhivasi-jawar-marathon-2024-2025': {
    title: 'Adhivasi Jawar Marathon 2024 & 2025',
    tag: 'Marathon',
    location: 'Jawar, Maharashtra',
    theme: 'Cultural heritage and tribal community empowerment',
    heroImage: '/images/jawar_marathon/image6.jpeg', // placeholder – replace when ready
    overview: {
      heading: 'Running as celebration of culture and community.',
      body: `The Adhivasi Jawar Marathon honours the local tribal heritage of the
      Jawar region while empowering participants through sport. Held across two
      editions, this event has grown into a meaningful cultural fixture, bringing
      together runners, families, and community leaders in shared celebration.`,
    },
    highlights: [
      'Deeply rooted in tribal heritage, making every race mile meaningful.',
      'Two successful editions (2024 & 2025) with growing community participation.',
      'Empowers local youth through structured race-day roles and visibility.',
      'Celebration of Adhivasi culture woven into the event-day experience.',
    ],
    gallery: [
      { src: '/images/jawar_marathon/image6.jpeg', alt: 'Adhivasi Jawar Marathon – community runners' },
    //   { src: '/images/jawar_marathon/image2.jpeg', alt: 'Adhivasi Jawar Marathon – cultural moments' },
    //   { src: '/images/jawar_marathon/image3.jpeg', alt: 'Adhivasi Jawar Marathon – tribal celebration' },
    ],
  },

  'athletes-camp-dahanu': {
    title: 'Athletes Camp Dahanu',
    tag: 'Training Camp',
    location: 'Dahanu, Maharashtra',
    theme: 'Elite residential training for young prospects',
    heroImage: '/images/camp/image5.jpeg', // placeholder – replace when ready
    overview: {
      heading: 'Where future champions build their foundation.',
      body: `The Athletes Camp Dahanu is an intensive high-performance residential
      programme designed to develop young sporting talent through structured
      coaching, fitness regimens, and competitive exposure. The camp brings
      together promising athletes under elite guidance for focused skill-building.`,
    },
    highlights: [
      'Residential format with full immersion in athletic discipline and routines.',
      'Elite coaching staff delivering sport-specific technical training.',
      'Structured regimens covering conditioning, nutrition, and mental toughness.',
      'Pathway programme offering visibility for selection into higher competitions.',
    ],
    gallery: [
      { src: '/images/camp/image5.jpeg', alt: 'Athletes Camp Dahanu – training session' },
    //   { src: '/images/camp/image2.jpeg', alt: 'Athletes Camp Dahanu – coaching on the field' },
    //   { src: '/images/camp/image3.jpeg', alt: 'Athletes Camp Dahanu – residential camp life' },
    ],
  },

  'volleyball-tournament': {
    title: 'Volleyball Tournament',
    tag: 'Championship',
    location: 'Maharashtra',
    theme: 'High-energy competitive court action',
    heroImage: '/images/volleyball/image4.jpeg', // placeholder – replace when ready
    overview: {
      heading: 'Every spike, every rally, every point earned.',
      body: `The Volleyball Tournament brought together competitive teams across
      the region for a high-intensity championship format. Teams demonstrated
      tactical mastery, teamwork, and athletic excellence across multiple match
      days. Full fixtures, scores, and team highlights will be featured here.`,
    },
    highlights: [
      'Multi-team regional championship with knockout and league formats.',
      'High-energy match days with cheering crowds and competitive spirit.',
      'Showcases grassroots volleyball talent from across Maharashtra.',
      'Organized with professional match officiating and structured scheduling.',
    ],
    gallery: [
      { src: '/images/volleyball/image7.jpeg', alt: 'Volleyball Tournament – match in action' },
      { src: '/images/volleyball/image8.jpeg', alt: 'Volleyball Tournament – team celebration' },
      { src: '/images/volleyball/image9.jpeg', alt: 'Volleyball Tournament – award ceremony' },
      { src: '/images/volleyball/image10.jpeg', alt: 'Volleyball Tournament – crowd and atmosphere' },  
      { src: '/images/volleyball/image11.jpeg', alt: 'Volleyball Tournament – intense rally' },
    ],
  },

  'cricket-tournament': {
    title: 'Cricket Tournament',
    tag: 'Championship',
    location: 'Maharashtra',
    theme: 'Regional rivalry and premium local talent',
    heroImage: '/images/cricket/image3.jpeg', // placeholder – replace when ready
    overview: {
      heading: 'Bat, ball, and the thrill of the chase.',
      body: `The Cricket Tournament captured intense regional rivalries with
      strategic play across multiple match days. Teams competed under pressure
      with every match delivering the drama, skill, and passion that defines
      grassroots cricket. Detailed match summaries and standings will be
      published as results are confirmed.`,
    },
    highlights: [
      'Thrilling regional format with competitive teams from across the district.',
      'Intense rivalries and high-pressure chase scenarios in every fixture.',
      'Showcases premium local batting and bowling talent.',
      'Professionally managed with structured scheduling and umpiring.',
    ],
    gallery: [
    //   { src: '/images/cricket/image1.jpeg', alt: 'Cricket Tournament – batting in action' },
    //   { src: '/images/cricket/image2.jpeg', alt: 'Cricket Tournament – bowling and fielding' },
      { src: '/images/cricket/image3.jpeg', alt: 'Cricket Tournament – team and trophy' },
    ],
  },
};

// ─── Metadata (Next.js) ───────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = eventsRegistry[slug];
  if (!event) return { title: 'Event Not Found | Olympic Vision' };
  return {
    title: `${event.title} | Olympic Vision`,
    description: `${event.overview.body.slice(0, 155).trim()}…`,
  };
}

// ─── Static params (optional – enables SSG) ──────────────────────────────────
export function generateStaticParams() {
  return Object.keys(eventsRegistry).map((slug) => ({ slug }));
}

// ─── Page component ───────────────────────────────────────────────────────────
export default async function EventDetailPage({ params }) {
  const { slug } = await params;
  const event = eventsRegistry[slug];

  if (!event) notFound();

  const eventFacts = [
    { label: 'Event', value: event.title },
    { label: 'Category', value: event.tag },
    { label: 'Location', value: event.location },
    { label: 'Theme', value: event.theme },
  ];

  return (
    <main className="event-detail-page">
      {/* ── Hero ── */}
      <section className="event-detail-hero">
        <Image
          src={event.heroImage}
          alt={event.title}
          fill
          priority
          sizes="100vw"
          className="event-detail-hero-img"
        />
        <div className="event-detail-hero-overlay" />
            <div className="container event-detail-hero-content">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                    <Link href="/#events" className="event-back-link">
                    <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                    Back to events
                    </Link>
                    <div className="event-kicker">{event.tag}</div>
                </div>
                <h1>{event.title}</h1>
                <p>{event.overview.body}</p>
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

      {/* ── Body ── */}
      <section className="event-detail-content">
        <div className="container">
          <div className="event-detail-grid">
            {/* Sidebar facts */}
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

            {/* Story */}
            <div className="event-story-panel">
              <span className="event-section-label">Overview</span>
              <h2>{event.overview.heading}</h2>
              <p>{event.overview.body}</p>

              <div className="event-highlight-list">
                {event.highlights.map((highlight) => (
                  <div className="event-highlight-item" key={highlight}>
                    <i className="fa-solid fa-check" aria-hidden="true"></i>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div id="gallery" className="event-gallery-section">
            <div className="event-gallery-heading">
              <span className="event-section-label">Gallery</span>
              <h2>Moments from the event</h2>
            </div>
            <EventGallery images={event.gallery} eventTitle={event.title} />
          </div>
        </div>
      </section>
    </main>
  );
}