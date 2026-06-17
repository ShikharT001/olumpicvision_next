'use client';

export default function BrandCarousel() {
  const brands = [
    { src: '/images/brands/brand1.png', name: 'Brand 1' },
    { src: '/images/brands/brand2.png', name: 'Brand 2' },
    { src: '/images/brands/brand3.png', name: 'Brand 3' },
    { src: '/images/brands/brand4.png', name: 'Brand 4' },
    { src: '/images/brands/brand5.png', name: 'Brand 5' },
    { src: '/images/brands/brand6.png', name: 'Brand 6' },
    { src: '/images/brands/brand7.png', name: 'Brand 7' },
  ];

  const repeated = [...brands, ...brands, ...brands, ...brands];

  return (
    <section className="bc-section">
      {/* Header */}
      <div className="bc-header">
        <p className="bc-eyebrow">Trusted Worldwide</p>
        <h2 className="bc-heading">
          Our Partners <span className="bc-gold">&amp;</span> Sponsors
        </h2>
        <div className="bc-rule">
          <span className="bc-dot" />
          <span className="bc-bar" />
          <span className="bc-dot" />
        </div>
        <p className="bc-sub">
          Trusted by leading organizations and brands across the athletic world.
        </p>
      </div>

      {/* Carousel */}
      <div className="bc-slider">
        <div className="bc-track">
          {repeated.map((brand, i) => (
            <div key={i} className="bc-item">
              <img src={brand.src} alt={brand.name} className="bc-img" />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* ── Section ── */
        .bc-section {
          background: #f5f7fa;
          padding: 4rem 0 3.5rem;
          overflow: hidden;
          position: relative;
        }

        /* ── Header ── */
        .bc-header {
          text-align: center;
          padding: 0 1.5rem;
          margin-bottom: 2.75rem;
        }

        .bc-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9922a;
          margin-bottom: 0.65rem;
        }

        .bc-heading {
          font-size: clamp(26px, 4vw, 38px);
          font-weight: 800;
          color: #1b2540;
          line-height: 1.15;
          margin-bottom: 0;
        }

        .bc-gold {
          color: #c9922a;
        }

        .bc-rule {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin: 0.75rem 0 1rem;
        }

        .bc-dot {
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #c9922a;
        }

        .bc-bar {
          display: block;
          width: 34px;
          height: 2px;
          border-radius: 2px;
          background: #c9922a;
        }

        .bc-sub {
          font-size: 15px;
          color: #6b7280;
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.65;
        }

        /* ── Slider shell ── */
        .bc-slider {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        /* Fade-edge masks */
        .bc-slider::before,
        .bc-slider::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 120px;
          z-index: 2;
          pointer-events: none;
        }
        .bc-slider::before {
          left: 0;
          background: linear-gradient(to right, #f5f7fa 0%, transparent 100%);
        }
        .bc-slider::after {
          right: 0;
          background: linear-gradient(to left, #f5f7fa 0%, transparent 100%);
        }

        /* ── Scrolling track ── */
        .bc-track {
          display: flex;
          width: max-content;
          animation: bc-scroll 30s linear infinite;
          padding: 12px 0;
        }

        .bc-track:hover {
          animation-play-state: paused;
        }

        @keyframes bc-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* ── Brand card ── */
        .bc-item {
          flex: 0 0 auto;
          width: 180px;
          height: 100px;
          margin: 0 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 16px;
          padding: 14px;
          position: relative;
          transition: transform 0.32s ease, box-shadow 0.32s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
          cursor: pointer;
          overflow: hidden;
        }

        /* Gold ring on hover */
        .bc-item::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          border: 2px solid transparent;
          transition: border-color 0.32s ease;
          pointer-events: none;
        }

        .bc-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.09);
        }

        .bc-item:hover::after {
          border-color: #c9922a;
        }

        /* ── Logo image ── */
        .bc-img {
          width: 140px;
          height: 70px;
          object-fit: contain;
          filter: grayscale(80%) opacity(0.75);
          transition: filter 0.32s ease, transform 0.32s ease;
          display: block;
        }

        .bc-item:hover .bc-img {
          filter: grayscale(0%) opacity(1);
          transform: scale(1.06);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .bc-item {
            width: 140px;
            height: 80px;
            margin: 0 10px;
          }

          .bc-img {
            width: 110px;
            height: 56px;
          }

          .bc-slider::before,
          .bc-slider::after {
            width: 60px;
          }
        }
      `}</style>
    </section>
  );
}