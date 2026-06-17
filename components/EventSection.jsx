'use client';

import React, { useState } from 'react';

export default function EventsAndHighlights() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const eventsData = [
    {
      id: 1,
      title: "Boisar Varsha Marathon 2025",
      tag: "Marathon",
      bgImage: "/images/event1.jpeg",
      desc: "Innovating the future with top industry leaders and cutting-edge tech.",
      modalTarget: "#imageGalleryModal"
    },
    {
      id: 2,
      title: "Cultural Fest 'Goonj'",
      tag: "CULTURE",
      bgImage: "/images/image1.jpeg",
      desc: "A vibrant celebration of art, music, and our rich cultural heritage.",
      modalTarget: "#imageGalleryModal"
    },
    {
      id: 3,
      title: "Saphale Hill Marathon 2024",
      tag: "RACING",
      bgImage: "/images/image6.jpeg",
      desc: "Saphale Lions Hill Marathon event bringing athletes together.",
      modalTarget: "#imageGalleryModal"
    }
  ];

  const announcements = [
    { id: 1, text: "Boisar Varsha Marathon 2026", link: "#" }
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % eventsData.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + eventsData.length) % eventsData.length);
  };

  return (
    <section id="events" className="py-5 bg-white">
      <div className="container-fluid px-4 px-md-5">
        
        {/* Main Side-by-Side Flex Grid Layout */}
        <div className="row g-4 align-items-stretch">
          
          {/* LEFT SIDE: The Main Event Carousel Wrapper (75% width on desktop) */}
          <div className="col-12 col-lg-9 d-flex flex-column justify-content-between">
            
            {/* Carousel Header Block with Title & Controls */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="position-relative">
                <h2 className="section-title fw-bold mb-0 text-dark" style={{ fontSize: '2.25rem', color: '#0A3D7A' }}>
                  Events Highlights
                </h2>
                
              </div>
              
              {/* Carousel Arrows */}
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

            {/* Slider Window Container */}
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
                        data-bs-toggle="modal" 
                        data-bs-target={event.modalTarget}
                      >
                        Explore Event <span className="action-arrow-icon">→</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Pagination Dash Indicator Bars */}
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

          {/* RIGHT SIDE: Announcements Card Panel (25% width on desktop) */}
          <div className="col-12 col-lg-3 d-flex mt-5 mt-lg-0">
            <div className="announcements-card border rounded-4 shadow-sm d-flex flex-column w-100 bg-white overflow-hidden">
              <div className="announcements-header p-4 border-bottom">
                <h3 className="h4 fw-bold mb-0" style={{ color: '#0A3D7A' }}>Announcements</h3>
              </div>
              
              <div className="announcements-body flex-grow-1 overflow-auto p-0">
                <ul className="list-group list-group-flush">
                  {announcements.map((item) => (
                    <li key={item.id} className="list-group-item announcement-item p-4 border-bottom-0 position-relative">
                      <a href={item.link} className="text-decoration-none d-flex align-items-start gap-3 text-secondary-hover">
                        <span className="announcement-bullet mt-1.5">•</span>
                        <span className="fw-medium text-dark-blue-tint transition-all" style={{ fontSize: '0.95rem', lineHeight: '1.45' }}>
                          {item.text}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <a href="#" className="announcements-footer p-4 text-white text-decoration-none d-flex justify-content-between align-items-center mt-auto">
                <span className="fw-semibold">View All Announcements</span>
                <span className="footer-circle-arrow">➔</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}