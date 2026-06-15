'use client';
import { useState, useEffect } from 'react';

export default function RegistrationSection() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    school: '',
    gender: '',
    dob: '',
    category: '',
    experience: '10km',
    phone: ''
  });

  // Handle inputs changing
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'dob' && { category: '' }) // Reset category if DOB changes
    }));
  };

  // Dynamically filter categories based on Date of Birth
useEffect(() => {
  if (!formData.dob || !formData.gender) {
    setAvailableCategories([]);
    return;
  }

  const birthDate = new Date(formData.dob);
  const validCats = [];

  const cutOffU14 = new Date('2013-01-01');
  const cutOffU17 = new Date('2010-01-01');
  const cutOffU19 = new Date('2008-01-01');

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  // U14
  if (birthDate >= cutOffU14) {
    validCats.push({
      value: "u14",
      label:
        formData.gender === "male"
          ? "3 km - U14 Boys (Palghar District Only)"
          : "3 km - U14 Girls (Palghar District Only)",
    });
  }

  // U17
  else if (birthDate >= cutOffU17) {
    validCats.push({
      value: "u17",
      label:
        formData.gender === "male"
          ? "5 km - U17 Boys (Palghar District Only)"
          : "5 km - U17 Girls (Palghar District Only)",
    });
  }

  // U19
  else if (birthDate >= cutOffU19) {
    validCats.push({
      value: "u19",
      label:
        formData.gender === "male"
          ? "6 km - U19 Boys (Palghar District Only)"
          : "6 km - U19 Girls (Palghar District Only)",
    });
  }

  // Open Category
  if (formData.gender === "male") {
    validCats.push({
      value: "open_men",
      label: "11 km - Men's Open (Maharashtra State Only)",
    });
  }

  if (formData.gender === "female") {
    validCats.push({
      value: "open_women",
      label: "8 km - Women's Open (Maharashtra State Only)",
    });
  }

  // Senior Citizen
  if (age >= 55) {
    validCats.push({
      value: "senior",
      label: "1 km - Fun Run (Senior Citizens 55+)",
    });
  }

  // Couples Race
  validCats.push({
    value: "couple",
    label: "1 km - Fun Run (Couples Race – Husband & Wife)",
  });

  setAvailableCategories(validCats);
}, [formData.dob, formData.gender]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormSubmitted(true);
      } else {
        const errData = await response.json();
        console.error('Registration failed:', errData);
        alert('Registration failed: ' + (errData.error || 'Please try again.'));
      }
    } catch (error) {
      console.error('Error during registration submission:', error);
      alert('Network error. Please try again later.');
    }
  };

  return (
    <section id="register" className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="card shadow border-0 rounded-4 overflow-hidden">
              
              {/* Header Matching Global Theme */}
              <div 
  className="position-relative p-4 text-center border-bottom text-white d-flex flex-column justify-content-center" 
  style={{ background: 'linear-gradient(135deg, var(--secondary, #111), var(--dark, #222))', minHeight: '120px' }}
>
  {/* Left Logo pinned to the left edge */}
  <img 
    src="/images/logo (1).png" 
    alt="Boisar Varsha Marathon Logo" 
    className="position-absolute start-0 ms-4" 
    style={{ width: '100px', height: '100px', top: '50%', transform: 'translateY(-50%)' }} 
  />

  {/* Center Text remains unbothered */}
  <div className="px-5mx-5">
    <h2 className="fw-bold mb-1" style={{ color: 'var(--accent, #ffcc00)', letterSpacing: '1px' }}>
      BOISAR VARSHA MARATHON 2026
    </h2>
    <p className="mb-0 text-light opacity-75 small">Official Registration Portal &amp; Event Guidelines</p>
  </div>

  {/* Right Logo pinned to the right edge */}
  <img 
    src="/images/Olympic vision logo 2.png" 
    alt="Olympic Vision India Logo" 
    className="position-absolute end-0 me-4" 
    style={{ width: '135px', height: '60px', top: '50%', transform: 'translateY(-50%)' }} 
  />
</div>

              {/* Main Content Body */}
              <div className="card-body p-4 p-md-5" style={{ color: 'var(--dark, #111)', backgroundColor: '#fff' }}>
                
                {/* Official Document Style Guidelines Section */}
                <div className="mb-5 pb-4 border-bottom" style={{ lineHeight: '1.8', textAlign: 'justify' }}>
                  <p className="mb-1 fw-semibold text-muted">
                    <strong>Boisar Varsha Marathon 2026</strong><br />
                    Organised by <em>Pratishthan</em> and <em>Shiv Sena</em><br />
                    Supported by <em>Olympic Vision India</em><br />
                    Under the aegis of <em>Palghar District Athletic Association</em> and <em>Maharashtra Athletic Association</em>
                  </p>
                  
                  <p className="mb-3 fw-bold mt-4" style={{ fontSize: '1.2rem', color: 'var(--dark, #111)' }}>
                    Subject: Official Registration &amp; Race Categories
                  </p>
                  
                  <p className="mb-4 text-muted">
                    We are pleased to open registrations for the <strong>Boisar Varsha Marathon 2026</strong>. Below are the verified race categories, participant criteria, and early bird guidelines. Please confirm your category based on the regional boundaries and structural cut-offs specified.
                  </p>
                  
                  <div className="row g-4 mt-2">
                    <div className="col-md-7">
                      <p className="mb-2 fw-bold text-uppercase tracking-wider small text-secondary">
                        🏃 Race Categories &amp; Track Rules:
                      </p>
                      <ul className="ps-3 text-muted small lh-lg" style={{ listStyleType: 'square' }}>
                        <li className="mb-1"><strong>3 km (U14 Boys &amp; Girls):</strong> Born on or after 01/01/2013 <em className="text-danger">(Palghar District only)</em></li>
                        <li className="mb-1"><strong>5 km (U17 Boys &amp; Girls):</strong> Born on or after 01/01/2010 <em className="text-danger">(Palghar District only)</em></li>
                        <li className="mb-1"><strong>6 km (U19 Boys &amp; Girls):</strong> Born on or after 01/01/2008 <em className="text-danger">(Palghar District only)</em></li>
                        <li className="mb-1"><strong>11 km (Men's Open):</strong> Open Track <em className="text-primary">(Maharashtra State only)</em></li>
                        <li className="mb-1"><strong>8 km (Women's Open):</strong> Open Track <em className="text-primary">(Maharashtra State only)</em></li>
                        <li className="mb-1"><strong>1 km Fun Run:</strong> Senior Citizens <em className="text-muted">(Ages 55+)</em></li>
                        <li><strong>1 km Fun Run:</strong> Couples Race <em className="text-muted">(Husband &amp; Wife)</em></li>
                      </ul>
                    </div>

                    <div className="col-md-5">
                      <p className="mb-2 fw-bold text-uppercase tracking-wider small text-secondary">
                        🎁 Perks (11 km &amp; 8 km Categories):
                      </p>
                      <div className="p-3 bg-light rounded-3 border">
                        <ul className="ps-3 mb-0 text-muted small lh-lg">
                          <li className="mb-1">👕 Official Marathon T-Shirt</li>
                          <li className="mb-1">🧣 Commemorative Event Towel</li>
                          <li className="mb-1">⚡ Energy Drinks &amp; Refreshments</li>
                          <li>🏅 Finisher Medal</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Rendering State */}
                {formSubmitted ? (
                  <div className="alert alert-success text-center py-4 rounded-3 shadow-sm" role="alert">
                    <i className="fas fa-check-circle fa-2x mb-2 text-success"></i>
                    <h4 className="alert-heading fw-bold">Registration Successful!</h4>
                    <p className="mb-0">Your tracking data has been logged. See you at the starting grid!</p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="needs-validation">
                    <h4 className="fw-bold mb-4" style={{ color: 'var(--dark, #111)' }}>Participant Entry Form</h4>
                    
                    <div className="row g-4">
                      {/* Full Name */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-secondary">Full Name (As per Govt ID)</label>
                        <input 
                          type="text" 
                          className="form-control form-control-lg border-2" 
                          name="fullName" 
                          placeholder="Enter your full name"
                          value={formData.fullName} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-secondary">Contact Number</label>
                        <input 
                          type="tel" 
                          className="form-control form-control-lg border-2" 
                          name="phone" 
                          placeholder="Enter your phone number"
                          value={formData.phone} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-secondary">Date of Birth</label>
                        <input 
                          type="date" 
                          className="form-control form-control-lg border-2" 
                          name="dob" 
                          value={formData.dob} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>

                      {/* Gender Selector */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small text-secondary">Gender</label>
                        <select 
                          className="form-select form-control-lg border-2" 
                          name="gender" 
                          value={formData.gender} 
                          onChange={handleInputChange} 
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* School / Institution / Locality */}
                      <div className="col-md-12">
                        <label className="form-label fw-semibold small text-secondary">School / College / Organization Name</label>
                        <input 
                          type="text" 
                          className="form-control form-control-lg border-2" 
                          name="school" 
                          placeholder="Enter your institution or residential locality"
                          value={formData.school} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>

                      {/* Dynamic Track Category Selector */}
                      <div className="col-md-12">
                        <label className="form-label fw-semibold small text-secondary">Available Race Track</label>
                        <select 
                          className="form-select form-control-lg border-2" 
                          name="category" 
                          value={formData.category} 
                          onChange={handleInputChange} 
                          required 
                          disabled={!formData.dob}
                        >
                          <option value="">
                            {formData.dob ? '--- Select your verified track category ---' : '⚠️ Please input your Date of Birth to unlock applicable tracks'}
                          </option>
                          {availableCategories.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                        <div className="form-text text-muted small mt-1">
                          Our system filters specific categories to maintain compliance with regional sports association criteria.
                        </div>
                      </div>

                      {/* Submit CTA styling */}
                      <div className="col-12 mt-5">
                        <button 
                          type="submit" 
                          className="btn btn-lg w-100 text-uppercase fw-bold shadow-sm" 
                          style={{ 
                            background: 'var(--accent, #ffcc00)', 
                            color: 'var(--dark, #111)', 
                            borderRadius: '50px',
                            padding: '1rem 2rem',
                            letterSpacing: '1px'
                          }}
                        >
                          Submit Registration &amp; Lock Category
                        </button>
                      </div>

                    </div>
                  </form>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}