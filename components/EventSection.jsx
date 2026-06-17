'use client';

import React, { useState, useEffect } from 'react';
import RegistrationSection from './Registration';
export default function EventsAndHighlights() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMarathonModal, setShowMarathonModal] = useState(false);


  
  const eventsData = [
    {
      id: 1,
      title: "Boisar Varsha Marathon 2025",
      tag: "MARATHON",
      bgImage: "/images/event1.jpeg",
      desc: "An exhilarating monsoon run uniting thousands of passionate athletes to promote fitness and community spirit.",
      modalTarget: "#imageGalleryModal"
    },
    {
      id: 2,
      title: "Saphale Lions Hill Marathon 2024",
      tag: "MARATHON",
      bgImage: "/images/image1.jpeg",
      desc: "A challenging scenic run testing endurance and grit against beautiful rolling hill landscapes.",
      modalTarget: "#imageGalleryModal"
    },
    {
      id: 3,
      title: "Adhivasi Jawar Marathon 2024 & 2025",
      tag: "MARATHON",
      bgImage: "/images/image6.jpeg",
      desc: "An impactful cultural run celebrating local heritage and empowering tribal communities through running.",
      modalTarget: "#imageGalleryModal"
    },
    {
      id: 4,
      title: "Atheletes Camp Dahanu",
      tag: "TRAINING CAMP",
      bgImage: "/images/image5.jpeg",
      desc: "An intensive high-performance residential camp providing elite coaching and structured training regimens for young prospects.",
      modalTarget: "#imageGalleryModal"
    },
    {
      id: 5,
      title: "Volleyball Tournament",
      tag: "CHAMPIONSHIP",
      bgImage: "/images/image4.jpeg",
      desc: "A high-energy competitive championship showcasing incredible spiked rallies, teamwork, and tactical court mastery.",
      modalTarget: "#imageGalleryModal"
    },
    {
      id: 6,
      title: "Cricket Tournament",
      tag: "CHAMPIONSHIP",
      bgImage: "/images/image3.jpeg",
      desc: "A thrilling regional tournament capturing intense rivalries, strategic play, and premium local talent under the pressure of the chase.",
      modalTarget: "#imageGalleryModal"
    }
  ];

const announcements = [
  {
    id: 1,
    text: "Boisar Varsha Marathon 2026",
    action: () => setShowMarathonModal(true)
  }
];
  // --- AUTOMATIC 3-SECOND TIMER ENGINE ---
  useEffect(() => {
    const autoSlideTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % eventsData.length);
    }, 3000); // 3000ms = 3 seconds

    // Cleanup phase: safely tears down the interval on component unmount 
    // or when currentIndex changes to cycle the 3s clock properly
    return () => clearInterval(autoSlideTimer);
  }, [currentIndex, eventsData.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % eventsData.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + eventsData.length) % eventsData.length);
  };

  return (
    <section id="events" className="py-5 bg-white">
      <div className="container-fluid px-4 px-md-5">
        
        <div className="row g-4 align-items-stretch">
          
          {/* LEFT SIDE: The Main Event Carousel Wrapper */}
          <div className="col-12 col-lg-9 d-flex flex-column justify-content-between">
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="position-relative">
                <h2 className="section-title fw-bold mb-0 text-dark" style={{ fontSize: '2.25rem', color: '#0A3D7A' }}>
                  Events Highlights
                </h2>
              </div>
              
              <div className="d-flex gap-2">
                <button 
                  onClick={handlePrev}
                  className="btn btn-light rounded-circle d-flex align-items-center justify-content-center custom-nav-arrow"
                  aria-label="Previous slide"
                >
                  ‹
                </button>
                <button 
                  onClick={handleNext}
                  className="btn btn-light rounded-circle d-flex align-items-center justify-content-center custom-nav-arrow"
                  aria-label="Next slide"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="classic-carousel-window overflow-hidden rounded-4 shadow-sm position-relative flex-grow-1">
              <div 
                className="classic-carousel-track d-flex"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {eventsData.map((event) => (
                  <article key={event.id} className="classic-carousel-slide position-relative">
                    <img className="carousel-slide-bg" src={event.bgImage} alt={event.title} />
                    <div className="carousel-slide-overlay"></div>
                    
                    <div className="carousel-slide-content text-white">
                      <span className="badge text-uppercase fw-bold mb-3 px-3 py-2 text-dark highlight-topic-tag">
                        {event.tag}
                      </span>
                      <h3 className="fw-bold display-5 mb-2 highlight-slide-title">
                        {event.title}
                      </h3>
                      <p className="text-light opacity-75 mb-4 highlight-slide-desc">
                        {event.desc}
                      </p>
                    <button
  className="btn bg-white fw-semibold px-4 py-2.5 d-inline-flex align-items-center gap-2 highlight-explore-btn"
  style={{ color: "#333" }}
>
  Explore Event <span style={{ color: "inherit" }}>→</span>
</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-start mt-4 px-2 align-items-center">
              {eventsData.map((_, index) => (
                <span 
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`carousel-progress-pill ${currentIndex === index ? 'progress-pill-active' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: Announcements Card Panel */}
          <div className="col-12 col-lg-3 d-flex mt-5 mt-lg-0">
            <div className="announcements-card border rounded-4 shadow-sm d-flex flex-column w-100 bg-white overflow-hidden">
              <div className="announcements-header p-4 border-bottom">
                <h3 className="h4 fw-bold mb-0" style={{ color: '#0A3D7A' }}>Announcements</h3>
              </div>
              
              <div className="announcements-body flex-grow-1 overflow-auto p-0">
                <ul className="list-group list-group-flush color-anim-list">
                  {announcements.map((item) => (
                    <li key={item.id} className="list-group-item announcement-item p-4 position-relative">
                      <button
  type="button"
  onClick={item.action}
  className="border-0 bg-transparent p-0 text-decoration-none d-flex align-items-start gap-2 text-start w-100"
>
                        <span className="announcement-bullet">•</span>
                        <span className="announcement-text fw-medium">
                          {item.text}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>
{showMarathonModal && (
  <div
    className="modal fade show d-block"
    style={{
      backgroundColor: "rgba(0,0,0,0.6)",
      position: "fixed",
      inset: 0,
      zIndex: 1055
    }}
  >
    <button
      className="btn-close bg-white rounded-circle p-3 position-fixed"
      style={{
        top: "20px",
        right: "20px",
        zIndex: 9999
      }}
      onClick={() => setShowMarathonModal(false)}
    />

    <RegistrationSection />
  </div>
)}
    </section>
  );
}

<style jsx>{`
.highlight-explore-btn,
.highlight-explore-btn span {
  color: #333 !important;
}

.highlight-explore-btn:hover,
.highlight-explore-btn:hover span,
.highlight-explore-btn:focus,
.highlight-explore-btn:focus span,
.highlight-explore-btn:active,
.highlight-explore-btn:active span {
  color: #6c757d !important;
  background-color: #f1f1f1 !important;
}
`}</style>