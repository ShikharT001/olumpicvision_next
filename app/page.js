'use client';
import { useEffect, useState } from 'react';
import SportsCoachingSection from '../components/SportsCoachingSection';
import RegistrationSection from '../components/Registration';
import EventsAndHighlights from '@/components/EventSection';
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    sport: '',
    experience: 'beginner',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Form submission handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Process form data here (e.g., Send to a Next.js API route or external service)
    console.log('Registration Data Submitted:', formData);

    // Simulate successful API submission
    setFormSubmitted(true);
    
    // Reset form fields
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      age: '',
      sport: '',
      experience: 'beginner',
      message: ''
    });
  };


  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ensure bootstrap JS is available (best-effort dynamic import)
    import('bootstrap/dist/js/bootstrap.bundle')
      .then((mod) => {
        if (typeof window !== 'undefined') {
          window.bootstrap = mod;
        }
      })
      .catch(() => {});

    // Scroll animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Smooth scroll + close mobile navbar
    const navLinks = Array.from(document.querySelectorAll('.navbar-nav .nav-link, .mobile-nav-links a'));
    const handleNavClick = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (!href || !href.startsWith('#')) {
        return;
      }

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', href);
        setMenuOpen(false);
      }
    };
    navLinks.forEach(link => link.addEventListener('click', handleNavClick));

    // Navbar background on scroll
    const onScroll = () => {
      const navbar = document.querySelector('.navbar');
      if (!navbar) return;
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // MAC SPECIAL: carousel / cards track behavior
    try {
      const track = document.getElementById('track');
      if (track) {
        const wrap = track.parentElement;
        const cards = Array.from(track.children);
        const prev = document.getElementById('prev');
        const next = document.getElementById('next');
        const dotsBox = document.getElementById('dots');

        const isMobile = () => matchMedia('(max-width:767px)').matches;

        cards.forEach((_, i) => {
          const dot = document.createElement('span');
          dot.className = 'dot';
          dot.onclick = () => activate(i, true);
          dotsBox && dotsBox.appendChild(dot);
        });
        const dots = dotsBox ? Array.from(dotsBox.children) : [];

        let current = 0;

        function center(i) {
          const card = cards[i];
          if (!card || !wrap) return;
          const axis = isMobile() ? 'top' : 'left';
          const size = isMobile() ? 'clientHeight' : 'clientWidth';
          const start = isMobile() ? card.offsetTop : card.offsetLeft;
          wrap.scrollTo({ [axis]: start - (wrap[size] / 2 - card[size] / 2), behavior: 'smooth' });
        }

        function toggleUI(i) {
          cards.forEach((c, k) => c.toggleAttribute('active', k === i));
          dots.forEach((d, k) => d.classList.toggle('active', k === i));
          if (prev) prev.disabled = i === 0;
          if (next) next.disabled = i === cards.length - 1;
        }

        function activate(i, scroll) {
          if (i === current) return;
          current = i;
          toggleUI(i);
          if (scroll) center(i);
        }

        function go(step) {
          activate(Math.min(Math.max(current + step, 0), cards.length - 1), true);
        }

        prev && (prev.onclick = () => go(-1));
        next && (next.onclick = () => go(1));

        const keyHandler = (e) => {
          if (["ArrowRight", "ArrowDown"].includes(e.key)) go(1);
          if (["ArrowLeft", "ArrowUp"].includes(e.key)) go(-1);
        };
        addEventListener('keydown', keyHandler, { passive: true });

        cards.forEach((card, i) => {
          card.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && activate(i, true));
          card.addEventListener('click', () => activate(i, true));
        });

        let sx = 0, sy = 0;
        track.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        track.addEventListener('touchend', (e) => {
          const dx = e.changedTouches[0].clientX - sx;
          const dy = e.changedTouches[0].clientY - sy;
          if (isMobile() ? Math.abs(dy) > 60 : Math.abs(dx) > 60) go((isMobile() ? dy : dx) > 0 ? -1 : 1);
        }, { passive: true });

        if (window.matchMedia('(max-width:767px)').matches && dotsBox) dotsBox.hidden = true;

        addEventListener('resize', () => center(current));

        toggleUI(0);
        center(0);
      }
    } catch (err) {
      console.warn('Track carousel init failed', err);
    }

    // Modal gallery: populate carousel slides from clicked card
    const galleryButtons = Array.from(document.querySelectorAll('.project-card__btn'));
    const onGalleryClick = (e) => {
      const button = e.currentTarget;
      const carouselInner = document.getElementById('carouselInner');
      if (!carouselInner) return;
      carouselInner.innerHTML = '';
      const projectCard = button.closest('.project-card');
      const images = projectCard ? Array.from(projectCard.querySelectorAll('img')) : [];
      if (images.length === 0) return;
      images.forEach((img, index) => {
        const slide = document.createElement('div');
        slide.className = `carousel-item ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `\n                <img\n                    src="${img.getAttribute('src')}"\n                    class="d-block w-100"\n                    style="height: 850px; object-fit: contain; background-color: #f8f9fa;"\n                    loading="lazy"\n                    alt="${img.getAttribute('alt') || ''}"\n                >\n            `;
        carouselInner.appendChild(slide);
      });
      const title = projectCard ? projectCard.querySelector('.project-card__title')?.innerText : '';
      if (title) {
        const lbl = document.getElementById('galleryModalLabel');
        if (lbl) lbl.innerText = title;
      }
    };
    galleryButtons.forEach(b => b.addEventListener('click', onGalleryClick));

    // cleanup
    return () => {
      observer && observer.disconnect();
      navLinks.forEach(link => link.removeEventListener('click', handleNavClick));
      window.removeEventListener('scroll', onScroll);
      galleryButtons.forEach(b => b.removeEventListener('click', onGalleryClick));
    };
  }, []);

  return (
    <>
      <div>
        {/* Navbar */}
        <nav className="navbar fixed-top">
          <div className="container">
            <a className="navbar-brand" href="#home">
              <img src="/images/new logo.png" height="55" alt="Olympic Vision Sports and Event Management" />
            </a>
            <ul className="navbar-nav ms-auto p-0 d-none d-md-flex">
              <li className="nav-item"><a className="nav-link" href="#home">Home</a></li>
              <li className="nav-item"><a className="nav-link" href="#about">About</a></li>
              <li className="nav-item"><a className="nav-link" href="#events">Events</a></li>
              <li className="nav-item"><a className="nav-link" href="#team">Team</a></li>
              <li className="nav-item"><a className="nav-link" href="#coaching">Coaching</a></li>
              <li className="nav-item"><a className="nav-link" href="#services">Services</a></li>
              <li className="nav-item"><a className="nav-link" href="#register">Register</a></li>
              <li className="nav-item"><a className="nav-link" href="#contact">Contact</a></li>
            </ul>
        
            {/* Custom Mobile Toggler Button */}
            <button
              className={`mobile-nav-toggle d-lg-none ${menuOpen ? 'open' : ''}`}
              type="button"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            {/* Custom Mobile Navigation Drawer */}
            <div className={`mobile-nav-drawer d-lg-none ${menuOpen ? 'open' : ''}`}>
              <div className="mobile-nav-drawer-header">
                <a href="#home" onClick={() => setMenuOpen(false)}>
                  <img src="/images/new logo.png" height="50" alt="Olympic Vision Sports and Event Management" />
                </a>
              </div>
              <ul className="mobile-nav-links">
                <li><a href="#home" onClick={() => setMenuOpen(false)}>Home</a></li>
                <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
                <li><a href="#events" onClick={() => setMenuOpen(false)}>Events</a></li>
                <li><a href="#team" onClick={() => setMenuOpen(false)}>Team</a></li>
                <li><a href="#coaching" onClick={() => setMenuOpen(false)}>Coaching</a></li>
                <li><a href="#services" onClick={() => setMenuOpen(false)}>Services</a></li>
                <li><a href="#register" onClick={() => setMenuOpen(false)}>Register</a></li>
                <li><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
              </ul>
            </div>

            {/* Custom Mobile Overlay Background */}
            {menuOpen && (
              <div className="mobile-nav-overlay d-lg-none" onClick={() => setMenuOpen(false)} />
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section id="home" className="hero">
          <video className="hero-video" autoPlay muted loop playsInline>
            <source src="./videos/video1.mp4" type="video/mp4" />
          </video>
          <div className="hero-overlay" />
          <div className="hero-content container">
            <h1>Olympic Vision Sports &amp; Event Management</h1>
            <p>Empowering Athletes | Building Champions | Creating Excellence</p>
            <a href="#register" className="btn btn-lg" style={{background: 'var(--accent)', color: 'var(--dark)', fontWeight: 700, borderRadius: 50, padding: '1rem 3rem'}}>Register Now</a>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-light">
          <div className="container">
            <h2 className="section-title fade-in">About Us</h2>
            <div className="row align-items-center">
              <div className="col-lg-6 fade-in">
                <p className="lead" style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
                  Olympic Vision is a dedicated sports and event management organization focused on <strong>athlete development</strong>, <strong>certified coaching</strong>, and impactful event execution.
                </p>
                <p style={{fontSize: '1.1rem', lineHeight: '1.8'}}>
                  We aim to promote sports culture, identify talent, and deliver excellence through structured programs and community engagement. Our mission is to nurture the next generation of champions while fostering a love for sports at every level.
                </p>
              </div>
              <div className="col-lg-6 fade-in">
                <div className="text-center">
                  <img src="./images/aboutus.png" alt="About Us" className="img-fluid rounded" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Events Section */}
        <EventsAndHighlights />

        {/* Team Section */}
        <section id="team" className="py-5 bg-light">
  <div className="container py-4">
    
    {/* Section Header */}
    <div className="text-center mb-5 position-relative">
      <h2 className="section-title fade-in fw-bold text-dark mb-2" style={{ letterSpacing: '0.5px', color: '#0A3D7A' }}>
        Our Team
      </h2>
    </div>

    {/* Team Grid */}
    <div className="row g-4 justify-content-center">
      
      {/* Member 1: Rohit bari */}
      <div className="col-sm-6 col-md-6 col-lg-3 fade-in">
        <div className="card h-100 border-0 shadow-sm overflow-hidden team-governing-card bg-white rounded-4">
          {/* Balanced aspect ratio box for perfect length */}
          <div className="position-relative overflow-hidden aspect-ratio-balanced-box">
            <img 
              src="/images/team1.jpeg" 
              alt="Rohit bari" 
              className="card-img-top team-member-img object-fit-cover" style={{ height: '100%' }}
            />
          </div>
          {/* Snug padding for a tighter, cleaner bottom area */}
          <div className="card-body p-3 text-center d-flex flex-column justify-content-between">
            <h5 className="fw-bold text-dark mb-1 member-name" style={{ fontSize: '1.1rem', color: '#0A3D7A' }}>
              Rohit Bari
            </h5>
            <div className="role-badge py-2 px-3 rounded-3 mt-2 fw-semibold text-uppercase tracking-wider">
              FOUNDER
            </div>
          </div>
        </div>
      </div>

      {/* Member 2: Rakhi bari */}
      <div className="col-sm-6 col-md-6 col-lg-3 fade-in">
        <div className="card h-100 border-0 shadow-sm overflow-hidden team-governing-card bg-white rounded-4">
          <div className="position-relative overflow-hidden aspect-ratio-balanced-box">
            <img 
              src="/images/team3.jpg" 
              alt="Rakhi bari" 
              className="card-img-top team-member-img object-fit-cover" style={{ height: '100%' }}
            />
          </div>
          <div className="card-body p-3 text-center d-flex flex-column justify-content-between">
            <h5 className="fw-bold text-dark mb-1 member-name" style={{ fontSize: '1.1rem', color: '#0A3D7A' }}>
              Rakhi Bari
            </h5>
            <div className="role-badge py-2 px-3 rounded-3 mt-2 fw-semibold text-uppercase tracking-wider">
              CO FOUNDER
            </div>
          </div>
        </div>
      </div>

      {/* Member 3: Sumit Mishra */}
      <div className="col-sm-6 col-md-6 col-lg-3 fade-in">
        <div className="card h-100 border-0 shadow-sm overflow-hidden team-governing-card bg-white rounded-4">
          <div className="position-relative overflow-hidden aspect-ratio-balanced-box">
            <img 
              src="/images/team-4.jpeg" 
              alt="Sumit Mishra" 
              className="card-img-top team-member-img object-fit-cover" style={{ height: '100%' }}
            />
          </div>
          <div className="card-body p-3 text-center d-flex flex-column justify-content-between">
            <h5 className="fw-bold text-dark mb-1 member-name" style={{ fontSize: '1.1rem', color: '#0A3D7A' }}>
              Sumit Mishra
            </h5>
            <div className="role-badge py-2 px-3 rounded-3 mt-2 fw-semibold text-uppercase tracking-wider">
              TEAM CORDINATOR
            </div>
          </div>
        </div>
      </div>

      {/* Member 4: Dr Kalpesh Girase */}
      <div className="col-sm-6 col-md-6 col-lg-3 fade-in">
        <div className="card h-100 border-0 shadow-sm overflow-hidden team-governing-card bg-white rounded-4">
          <div className="position-relative overflow-hidden aspect-ratio-balanced-box">
            <img 
              src="/images/team-5.jpeg" 
              alt="Dr Kalpesh Girase" 
              className="card-img-top team-member-img object-fit-cover" style={{ height: '100%' }}
            />
          </div>
          <div className="card-body p-3 text-center d-flex flex-column justify-content-between">
            <h5 className="fw-bold text-dark mb-1 member-name" style={{ fontSize: '1.1rem', color: '#0A3D7A' }}>
              Dr Kalpesh Girase
            </h5>
            <div className="role-badge py-2 px-3 rounded-3 mt-2 fw-semibold text-uppercase tracking-wider">
              PHYSIO
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
        {/* Coaching Section */}
        <SportsCoachingSection />

        {/* Services Section */}
        <section id="services" className="bg-light">
          <div className="container">
            <h2 className="section-title fade-in">Our Services</h2>
            <div className="row g-4">
              <div className="col-md-6 col-lg-4 fade-in">
                <div className="service-card">
                  <i className="fas fa-chalkboard-teacher" />
                  <h5>Certified Sports Coaching</h5>
                  <p>Professional coaching from certified trainers across 16+ sports disciplines.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4 fade-in">
                <div className="service-card">
                  <i className="fas fa-user-graduate" />
                  <h5>PE Teacher Placement</h5>
                  <p>Connecting qualified physical education teachers with schools and institutions.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4 fade-in">
                <div className="service-card">
                  <i className="fas fa-school" />
                  <h5>School &amp; College Events</h5>
                  <p>Complete sports event management for educational institutions.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4 fade-in">
                <div className="service-card">
                  <i className="fas fa-building" />
                  <h5>Corporate Events</h5>
                  <p>Engaging sports events for corporate team building and community engagement.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4 fade-in">
                <div className="service-card">
                  <i className="fas fa-search" />
                  <h5>Talent Hunt Programs</h5>
                  <p>Identifying and nurturing young sporting talent for the future.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4 fade-in">
                <div className="service-card">
                  <i className="fas fa-bullhorn" />
                  <h5>Sports Media &amp; Marketing</h5>
                  <p>Comprehensive media coverage and marketing solutions for sports events.</p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4 fade-in">
                <div className="service-card">
                  <i className="fas fa-tshirt" />
                  <h5>Product Merchandising</h5>
                  <p>Custom sports merchandise and branding solutions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Academy Location Section */}
        <section id="academy">
          <div className="container">
            <h2 className="section-title fade-in">Academy Locations</h2>
            <div className="text-center fade-in">
              <div className="card" style={{background: 'linear-gradient(135deg, var(--secondary), var(--dark))', color: 'white', padding: '3rem'}}>
                <i className="fas fa-map-marker-alt fa-4x mb-3" style={{color: 'var(--accent)'}} />
                <h4>Coming Soon</h4>
                <p>Details of our academy branches will be updated here, including addresses, coaching schedules, and available sports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Registration Form Section */}
        <RegistrationSection />

        {/* Contact Section */}
        <section id="contact" className="bg-light">
          <div className="container">
            <h2 className="section-title fade-in">Contact Us</h2>
            <div className="row justify-content-center">
              <div className="col-lg-8 fade-in">
                <div className="contact-info">
                  <h4 className="mb-4">Get In Touch</h4>
                  <p className="mb-4">We welcome inquiries for coaching, collaborations, and event execution.</p>
                  <div className="contact-item">
                    <i className="fas fa-envelope" />
                    <div>
                      <strong>Email</strong><br />
                      <a
                        href="mailto:olympicvisionindia@gmail.com"
                        onClick={(event) => {
                          event.preventDefault();
                          window.open('https://mail.google.com/mail/?view=cm&fs=1&to=olympicvisionindia@gmail.com', '_blank');
                        }}
                        style={{color: 'inherit', textDecoration: 'none'}}
                      >
                        olympicvisionindia@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="contact-item">
                    <i className="fas fa-phone" />
                    <div>
                      <strong>Phone</strong><br />
                      <a href="tel:+919284129950" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>
                        +91 92841 29950
                      </a>
                    </div>
                  </div>
                  <div className="contact-item">
                    <i className="fab fa-instagram" />
                    <div>
                      <strong>Instagram</strong><br />
                      <a href="https://www.instagram.com/olympic_vision_india/" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>
                        @olympic_vision_india
                      </a>
                    </div>
                  </div>
                  <div className="contact-item">
                    <i className="fab fa-youtube" />
                    <div>
                      <strong>YouTube</strong><br />
                      <a href="https://www.youtube.com/@OlympicVisionIndia" target="_blank" style={{color: 'inherit', textDecoration: 'none'}}>
                        OlympicVisionIndia
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-dark text-light py-5">
          <div className="container">
            <div className="row align-items-center">
              {/* Logo + Brand */}
              <div className="col-md-6 mb-4 mb-md-0 d-flex align-items-center gap-3">
                <img
                  src="/images/new logo.png"
                  alt="Olympic Vision Sports and Event Management"
                  width={120}
                  height={120}
                  style={{ objectFit: "contain" }}
                />
                <div>
                  <h5 className="mb-1 fw-bold">
                    Olympic Vision Sports & Event Management
                  </h5>
                  <p className="mb-0 text-secondary">
                    Empowering Athletes | Building Champions | Creating Excellence
                  </p>
                </div>
              </div>

              {/* Links / Credits */}
              <div className="col-md-6 text-md-end text-center">
                <p className="mb-1">
                  © 2025 Olympic Vision. All rights reserved.
                </p>
                <p className="mb-0">
                  Designed & Developed by{" "}
                  <a
                    href="https://thetechnocyte.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-info text-decoration-none"
                  >
                    Technocyte
                  </a>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}