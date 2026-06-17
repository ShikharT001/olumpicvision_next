'use client';

import React from 'react';

// Fixed icons to utilize 100% Free Font Awesome 6 classes
const sports = [
  { num: '01', category: 'aquatic',   icon: 'fa-solid fa-person-running', name: 'Athletics' },
  { num: '02', category: 'team',      icon: 'fa-solid fa-volleyball',     name: 'Volleyball' },
  { num: '03', category: 'team',      icon: 'fa-solid fa-people-group',   name: 'Kabaddi' },
  { num: '04', category: 'team',      icon: 'fa-solid fa-basketball',     name: 'Basketball' },
  { num: '05', category: 'team',      icon: 'fa-solid fa-baseball-bat-ball', name: 'Cricket' },
  { num: '06', category: 'team',      icon: 'fa-solid fa-shoe-prints',    name: 'Kho-Kho' }, 
  { num: '07', category: 'martial',   icon: 'fa-solid fa-shield-halved',  name: 'Self Defence' },
  { num: '08', category: 'martial',   icon: 'fa-solid fa-award',          name: 'Taekwondo' },
  { num: '09', category: 'aquatic',   icon: 'fa-solid fa-water',          name: 'Swimming' },
  { num: '10', category: 'precision', icon: 'fa-solid fa-person-skating', name: 'Skating' }, // FIXED: 100% Free Icon
  { num: '11', category: 'precision', icon: 'fa-solid fa-bullseye',       name: 'Archery' },
  { num: '12', category: 'team',      icon: 'fa-solid fa-hand',           name: 'Handball' },
  { num: '13', category: 'precision', icon: 'fa-solid fa-table-tennis-paddle-ball', name: 'Table Tennis' },
  { num: '14', category: 'combat',    icon: 'fa-solid fa-dumbbell',       name: 'Weightlifting' },
  { num: '15', category: 'combat',    icon: 'fa-solid fa-hand-fist',      name: 'Boxing' },  // FIXED: 100% Free Combat Icon
];

// const legendItems = [
//   { id: 'aquatic',   color: '#378add', label: 'Aquatic & Field' },
//   { id: 'team',      color: '#1d9e75', label: 'Team Sports' },
//   { id: 'martial',   color: '#7f77dd', label: 'Martial Arts' },
//   { id: 'combat',    color: '#d85a30', label: 'Combat' },
//   { id: 'precision', color: '#ba7517', label: 'Precision' },
// ];

export default function SportsCoachingSection() {
  return (
    <section id="coaching" className="sc-section py-5 bg-white">
      {/* Reliable Font Awesome 6 CDN */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />

      <div className="container px-4 px-md-5">
        
        {/* Premium Section Title */}
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-2 text-dark position-relative d-inline-block pb-3" style={{ fontSize: '2.25rem', color: '#0A3D7A' }}>
            Sports Coaching Offered
            <span className="position-absolute bottom-0 start-50 translate-middle-x" style={{ width: '55px', height: '4px', backgroundColor: '#F2A900' }}></span>
          </h2>
          <p className="text-secondary mt-3 fs-5 max-w-2xl mx-auto">
            We provide certified elite coaches across premium athletic disciplines
          </p>
        </div>

        
        {/* <div className="d-flex flex-wrap gap-3 justify-content-center mb-5 sc-legend-container">
          {legendItems.map(({ id, color, label }) => (
            <div key={id} className="sc-legend__pill d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill border bg-light shadow-sm">
              <span className="sc-legend__dot rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: color, display: 'inline-block' }} />
              <span className="fw-semibold text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>{label}</span>
            </div>
          ))}
        </div> */}

        {/* Professional Minimal Grid System */}
        <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {sports.map(({ num, category, icon, name }) => (
            <div key={num} className="col">
              <div className={`card h-100 sc-premium-card border-0 shadow-sm rounded-4 position-relative overflow-hidden sc-card--${category}`}>
                
                <div className="sc-card-top-strip"></div>
                
                <div className="card-body d-flex flex-column align-items-center p-4 text-center">
                  
                  {/* Circular Floating Icon Hub Shell */}
                  <div className="sc-icon-hub rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-inner">
                    <i className={`${icon} fs-3`} aria-hidden="true" />
                  </div>
                  
                  <h4 className="card-title h6 fw-bold mb-0 text-dark-blue-tint mt-2">
                    {name}
                  </h4>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}