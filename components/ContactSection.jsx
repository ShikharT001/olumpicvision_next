'use client';

import React from 'react';
import './ContactSection.css'; // Adjust path based on your architecture

export default function ContactSection() {
  
  const handleEmailClick = (event) => {
    event.preventDefault();
    window.open('https://mail.google.com/mail/?view=cm&fs=1&to=olympicvisionindia@gmail.com', '_blank');
  };

  return (
    <section id="contact" className="py-6 bg-light-gradient position-relative">
      <div className="container px-4 px-md-5">
        
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="text-uppercase fw-bold tracking-wider text-amber-gold mb-2 d-block" style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>
            Connect With Us
          </span>
          <h2 className="fw-bold mb-2 text-dark position-relative d-inline-block pb-3" style={{ fontSize: '2.25rem', color: '#0A3D7A' }}>
            Contact Us
            <span className="position-absolute bottom-0 start-50 translate-middle-x" style={{ width: '55px', height: '4px', backgroundColor: '#F2A900' }}></span>
          </h2>
          <p className="text-secondary mt-3 fs-5 max-w-2xl mx-auto">
            We welcome inquiries for elite coaching, institution collaborations, and athletic event execution.
          </p>
        </div>

        {/* Professional Two-Column Layout */}
        <div className="row g-5 align-items-stretch">
          
          {/* LEFT SIDE: Institutional Contact Info Cards */}
          <div className="col-12 col-lg-5 d-flex flex-column justify-content-between fade-in">
            <div className="d-flex flex-column gap-3 h-100 justify-content-center">
              
              {/* EMAIL CARD */}
              <div className="sc-contact-card bg-white p-4 rounded-4 shadow-sm d-flex align-items-center gap-4 border">
                <div className="sc-contact-icon-wrapper rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                  <i className="fa-solid fa-envelope fs-5" />
                </div>
                <div>
                  <h6 className="text-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Official Email</h6>
                  <a 
                    href="mailto:olympicvisionindia@gmail.com" 
                    onClick={handleEmailClick}
                    className="sc-contact-link fw-bold text-dark-blue-tint text-break"
                  >
                    olympicvisionindia@gmail.com
                  </a>
                </div>
              </div>

              {/* PHONE CARD */}
              <div className="sc-contact-card bg-white p-4 rounded-4 shadow-sm d-flex align-items-center gap-4 border">
                <div className="sc-contact-icon-wrapper rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                  <i className="fa-solid fa-phone fs-5" />
                </div>
                <div>
                  <h6 className="text-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Telephone Support</h6>
                  <a href="tel:+919284129950" className="sc-contact-link fw-bold text-dark-blue-tint">
                    +91 9284129950
                  </a>
                </div>
              </div>

              {/* INSTAGRAM CARD */}
              <div className="sc-contact-card bg-white p-4 rounded-4 shadow-sm d-flex align-items-center gap-4 border">
                <div className="sc-contact-icon-wrapper rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                  <i className="fa-brands fa-instagram fs-5" />
                </div>
                <div>
                  <h6 className="text-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Instagram</h6>
                  <a href="https://www.instagram.com/olympic_vision_india/" target="_blank" rel="noopener noreferrer" className="sc-contact-link fw-bold text-dark-blue-tint">
                    @olympic_vision_india
                  </a>
                </div>
              </div>

              {/* YOUTUBE CARD */}
              <div className="sc-contact-card bg-white p-4 rounded-4 shadow-sm d-flex align-items-center gap-4 border">
                <div className="sc-contact-icon-wrapper rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                  <i className="fa-brands fa-youtube fs-5" />
                </div>
                <div>
                  <h6 className="text-muted fw-semibold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>YouTube Channel</h6>
                  <a href="https://www.youtube.com/@OlympicVisionIndia" target="_blank" rel="noopener noreferrer" className="sc-contact-link fw-bold text-dark-blue-tint">
                    OlympicVisionIndia
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT SIDE: Premium Engagement Form */}
          <div className="col-12 col-lg-7 fade-in">
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border h-100">
              <h4 className="fw-bold mb-4 text-dark-blue-tint" style={{ color: '#0A3D7A' }}>Send a Message</h4>
              
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-muted">Your Name</label>
                    <input type="text" className="form-control sc-form-input p-3 rounded-3" placeholder="John Doe" required />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-muted">Email Address</label>
                    <input type="email" className="form-control sc-form-input p-3 rounded-3" placeholder="name@example.com" required />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-muted">Inquiry Category</label>
                    <select className="form-select sc-form-input p-3 rounded-3 text-muted">
                      <option value="coaching">Sports Coaching & Academy Programs</option>
                      <option value="placement">PE Teacher Placement Solutions</option>
                      <option value="events">School / Corporate Event Management</option>
                      <option value="other">General Collaboration</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-muted">Message Details</label>
                    <textarea className="form-control sc-form-input p-3 rounded-3" rows="4" placeholder="Describe your requirement..." required></textarea>
                  </div>
                  <div className="col-12 mt-4">
                    <button type="submit" className="btn text-white w-100 py-3 fw-bold rounded-3 transition-all sc-submit-btn" style={{ backgroundColor: '#0A3D7A' }}>
                      Submit Secure Inquiry
                    </button>
                  </div>
                </div>
              </form>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}