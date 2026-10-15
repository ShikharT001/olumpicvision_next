'use client';

import React from 'react';
import './AboutSection.css'; // Adjust path based on your architecture

export default function AboutSection() {
  const stats = [
    { value: '15+', label: 'Sports Disciplines' },
    { value: '10+', label: 'Certified Coaches' },
    { value: '1,000+', label: 'Athletes Trained' },
    { value: '25+', label: 'Events Executed' }
  ];

  return (
    <section id="about" className="py-6 bg-light-gradient position-relative overflow-hidden">
      {/* Subtle structural accent graphics to break layout monotony */}
      <div className="sc-bg-blur-accent position-absolute top-0 end-0 opacity-10"></div>
      
      <div className="container px-4 px-md-5 position-relative" style={{ zIndex: 2 }}>
        
        {/* Row Layout for Main Text & Media Grid */}
        <div className="row g-5 align-items-center mb-5">
          
          {/* LEFT SIDE: Narrative Typography Block */}
          <div className="col-12 col-lg-6 fade-in">
            <div className="pe-lg-4">
              
              {/* Premium Category Pre-title */}
              <span className="text-uppercase fw-bold tracking-wider text-amber-gold mb-2 d-block" style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>
                Who We Are
              </span>
              
              {/* Main Structural Section Title */}
              <h2 className="fw-bold mb-4 text-dark position-relative pb-2" style={{ fontSize: '2.5rem', color: '#0A3D7A', lineHeight: '1.2' }}>
                Olympic Vision
              </h2>
              
              <p className="lead fw-normal text-muted mb-4" style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
                Olympic Vision is a dedicated sports and event management organization focused on athlete development, certified coaching, and impactful event execution.
              </p>
              
              <p className="text-secondary mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>
                We aim to promote sports culture, identify raw talent, and deliver athletic excellence through structured programs and strategic community engagement. Our mission is to nurture the next generation of champions while fostering a lifelong love for sports at every performance tier.
              </p>
              
            </div>
          </div>
          
          {/* RIGHT SIDE: Framed Media Display with Modern Shadows */}
          <div className="col-12 col-lg-6 fade-in">
            <div className="position-relative p-2">
              {/* Visual geometric frame behind image */}
              
              <div className="text-center position-relative overflow-hidden rounded-4 shadow-lg dynamic-img-wrapper">
                <img 
                  src="./images/aboutus.png" 
                  alt="Olympic Vision Athletes Training" 
                  className="img-fluid w-100 object-fit-cover transition-transform"
                  style={{ maxHeight: '420px' }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM METRICS BAR: Impact Counter Cards */}
        <div className="row g-4 row-cols-2 row-cols-md-4 mt-2">
          {stats.map(({ value, label }, index) => (
            <div key={index} className="col">
              <div className="bg-white border rounded-4 p-4 text-center h-100 shadow-sm transition-all sc-stat-card">
                <h3 className="display-5 fw-extrabold mb-1" style={{ color: '#0A3D7A', letterSpacing: '-1px' }}>
                  {value}
                </h3>
                <p className="text-uppercase fw-semibold text-muted mb-0" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}