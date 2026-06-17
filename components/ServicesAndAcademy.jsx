'use client';

import React from 'react';
import './ServicesAndAcademy.css'; // Adjust path based on your directory structure

export default function ServicesAndAcademy() {
  const servicesData = [
    {
      icon: 'fa-solid fa-chalkboard-user',
      title: 'Certified Sports Coaching',
      desc: 'Professional training modules delivered by certified coaches across 15+ athletic disciplines.'
    },
    {
      icon: 'fa-solid fa-user-graduate',
      title: 'PE Teacher Placement',
      desc: 'Connecting qualified physical education professionals with premier academic institutions.'
    },
    {
      icon: 'fa-solid fa-school-flag',
      title: 'School & College Events',
      desc: 'Turnkey sports tournament management and track-and-field meet planning for institutions.'
    },
    {
      icon: 'fa-solid fa-building-shield',
      title: 'Corporate Sports Properties',
      desc: 'Custom corporate athletic events designed for high-impact team building and community engagement.'
    },
    {
      icon: 'fa-solid fa-magnifying-glass-chart',
      title: 'Talent Identification Hubs',
      desc: 'Strategic scout camps designed to discover, bench-test, and nurture grassroots sporting talent.'
    },
    {
      icon: 'fa-solid fa-square-share-nodes',
      title: 'Sports Media & Marketing',
      desc: 'Comprehensive athletic lifestyle coverage, broadcast consulting, and contextual sponsor marketing.'
    },
    {
      icon: 'fa-solid fa-shirt',
      title: 'Premium Merchandising',
      desc: 'End-to-end design and manufacturing of custom high-performance sports apparel and branding solutions.'
    }
  ];

  return (
    <>
      {/* ================= SERVICES SECTION ================= */}
      <section id="services" className="py-6 bg-light border-bottom">
        <div className="container px-4 px-md-5">
          
          {/* Section Header */}
          <div className="text-center mb-5">
            <span className="text-uppercase fw-bold tracking-wider text-amber-gold mb-2 d-block" style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>
              What We Deliver
            </span>
            <h2 className="fw-bold mb-2 text-dark position-relative d-inline-block pb-3" style={{ fontSize: '2.25rem', color: '#0A3D7A' }}>
              Our Services
              <span className="position-absolute bottom-0 start-50 translate-middle-x" style={{ width: '55px', height: '4px', backgroundColor: '#F2A900' }}></span>
            </h2>
            <p className="text-secondary mt-3 fs-5 max-w-2xl mx-auto">
              Comprehensive institutional athletic administration and premium sport event execution
            </p>
          </div>

          {/* Balanced Dynamic Services Flex Grid */}
          <div className="row g-4 justify-content-center">
            {servicesData.map((service, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4 fade-in">
                <div className="card h-100 sc-service-card border-0 shadow-sm p-4 rounded-4 position-relative overflow-hidden bg-white">
                  <div className="card-body d-flex flex-column align-items-start p-0">
                    
                    {/* Modern Clean Floating Icon Shell */}
                    <div className="sc-service-icon-wrapper rounded-3 d-flex align-items-center justify-content-center mb-4">
                      <i className={`${service.icon} fs-4`} aria-hidden="true" />
                    </div>
                    
                    <h5 className="fw-bold mb-2 text-dark-blue-tint" style={{ fontSize: '1.2rem', color: '#0A3D7A' }}>
                      {service.title}
                    </h5>
                    
                    <p className="text-secondary mb-0 small-line-height" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                      {service.desc}
                    </p>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= ACADEMY LOCATIONS SECTION ================= */}
      <section id="academy" className="py-6 bg-white position-relative overflow-hidden">
        <div className="container px-4 px-md-5">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10 fade-in">
              
              <div className="sc-teaser-card border-0 rounded-4 overflow-hidden position-relative p-5 shadow text-center">
                {/* Background decorative styling layout pattern built via CSS layers */}
                <div className="sc-teaser-overlay position-absolute top-0 start-0 w-100 h-100" />
                
                <div className="position-relative" style={{ zIndex: 2 }}>
                  
                  {/* Subtle pulsing pin container icon shell */}
                  <div className="sc-teaser-icon-pulse mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle">
                    <i className="fa-solid fa-map-location-dot fs-2 text-amber-gold-tint" />
                  </div>
                  
                  <h3 className="fw-bold mb-3 text-white tracking-tight" style={{ fontSize: '2rem' }}>
                    Academy Locations Coming Soon
                  </h3>
                  
                  <p className="text-white-50 max-w-xl mx-auto mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.7' }}>
                    We are engineering premier athletic hubs across the region. Details regarding our certified academy branches, precise facility addresses, high-performance training schedules, and available sport disciplines will be announced shortly.
                  </p>
                  
                  {/* Premium contextual status pill badge */}
                  <div className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill bg-white-opacity-10 text-white border border-white-opacity-20">
                    <span className="spinner-grow spinner-grow-sm text-amber-gold-tint" role="status" aria-hidden="true"></span>
                    <span className="fw-semibold text-uppercase tracking-wider" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                      In Development Phase
                    </span>
                  </div>

                </div>

              </div>
              
            </div>
          </div>
        </div>
      </section>
    </>
  );
}