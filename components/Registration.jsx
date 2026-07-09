'use client';

import Image from 'next/image';
import { useRef, useMemo, useState } from 'react';
import {
  OPEN_CATEGORY_FEE_RUPEES,
  getAvailableRaceCategories,
  isPaidCategory,
} from '@/lib/marathon';

const SPONSOR_IMAGES = [
  {
    src: '/images/brands/Maa_logo.webp',
    alt: 'Mira Bhayander Vasai Virar Police supporter logo',
    width: 1171,
    height: 912,
    role: 'Under the Aegis of',
    name: 'MAA',
  },
  {
    src: '/images/brands/Palghar_Police.webp',
    alt: 'Boisar Varsha Marathon organizing partners logo',
    width: 1408,
    height: 768,
    role: 'Supported by',
    name: 'Palghar Police',
  },
  {
    src: '/images/brands/Shivsena_logo.webp',
    alt: 'Palghar District Athletics Association supporter logo',
    width: 1408,
    height: 768,
    role: 'Organised by',
    name: 'Shiv Sena',
  },
  {
    src: '/images/brands/Aadhar_Pratishthan.webp',
    alt: 'Aadhar_Pratishthan supporter logo',
    width: 1408,
    height: 768,
    role: 'Organised by',
    name: 'Aadhar Pratishthan',
  },
  {
    src: '/images/brands/olympicvision.png',
    alt: 'Olympic Vision supporter logo',
    width: 1408,
    height: 768,
    role: 'Managed by',
    name: 'Olympic Vision',
  },
];

function loadPhonePeCheckout(scriptUrl) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('PhonePe checkout can only open in the browser.'));
      return;
    }

    if (window.PhonePeCheckout?.transact) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Unable to load PhonePe checkout.'));
    document.body.appendChild(script);
  });
}

async function postPaymentUpdate(url, payload) {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export default function RegistrationSection() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    fullName: '',
    phone: '',
    dob: '',
    gender: '',
    school: '',
    category: '',
    document: '',
    partnerDocument: '',
  });

  const [docState, setDocState] = useState({
    file: null,
    url: '',
    uploading: false,
    uploaded: false,
  });
  const [partnerDocState, setPartnerDocState] = useState({
    file: null,
    url: '',
    uploading: false,
    uploaded: false,
  });
  const docInputRef = useRef(null);
  const partnerDocInputRef = useRef(null);

  const todayString = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [formData, setFormData] = useState({
    fullName: '',
    school: '',
    gender: '',
    dob: '',
    category: '',
    experience: '10km',
    phone: '',
  });

  const availableCategories = useMemo(
    () =>
      getAvailableRaceCategories({
        dob: formData.dob,
        gender: formData.gender,
      }),
    [formData.dob, formData.gender]
  );

  const selectedCategory = availableCategories.find(
    (category) => category.value === formData.category
  );
  const selectedCategoryRequiresPayment = isPaidCategory(formData.category);
  const isCoupleCategory = formData.category === 'couple';

  // Upload a single document to Cloudinary
  const uploadDoc = async (file, label) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('label', label);
    const res = await fetch('/api/upload-document', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length > 10) return;

      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...((name === 'dob' || name === 'gender') && { category: '' }),
      }));
    }

    setErrors((prev) => ({
      ...prev,
      [name]: '',
      ...((name === 'dob' || name === 'gender') && { category: '' }),
    }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { fullName: '', phone: '', dob: '', gender: '', school: '', category: '', document: '', partnerDocument: '' };

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
      valid = false;
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters.';
      valid = false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone) {
      newErrors.phone = 'Contact number is required.';
      valid = false;
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number.';
      valid = false;
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required.';
      valid = false;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dobDate = new Date(formData.dob);
      if (dobDate > today) {
        newErrors.dob = 'Date of birth cannot be in the future.';
        valid = false;
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender.';
      valid = false;
    }

    if (!formData.school.trim()) {
      newErrors.school = 'Institution/Locality name is required.';
      valid = false;
    }

    if (!formData.category) {
      newErrors.category = 'Please select an eligible race track category.';
      valid = false;
    }

    if (!docState.uploaded || !docState.url) {
      newErrors.document = 'Please upload your identity document (Aadhaar / PAN / Passport).';
      valid = false;
    }

    if (isCoupleCategory && (!partnerDocState.uploaded || !partnerDocState.url)) {
      newErrors.partnerDocument = "Please upload your partner's identity document.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const verifyPayment = async ({ registrationId, orderId }) => {
    const verifyResponse = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registrationId,
        orderId,
      }),
    });

    const verifyData = await verifyResponse.json();

    if (verifyResponse.status === 202) {
      setSuccessMessage(
        'Your registration is saved and the PhonePe payment is still pending. We will confirm it once PhonePe marks it successful.'
      );
      setFormSubmitted(true);
      return;
    }

    if (!verifyResponse.ok) {
      throw new Error(verifyData.error || 'Payment verification failed.');
    }

    setSuccessMessage('Payment successful. Your marathon registration is confirmed.');
    setFormSubmitted(true);
  };

  const openPhonePePayment = async ({ registrationId, payment }) => {
    await loadPhonePeCheckout(payment.checkoutScriptUrl);

    return new Promise((resolve, reject) => {
      if (!window.PhonePeCheckout?.transact) {
        reject(new Error('PhonePe checkout is unavailable. Please try again.'));
        return;
      }

      let settled = false;

      window.PhonePeCheckout.transact({
        tokenUrl: payment.redirectUrl,
        type: 'IFRAME',
        callback: async (response) => {
          if (settled) return;
          settled = true;

          try {
            if (response === 'USER_CANCEL') {
              await postPaymentUpdate('/api/payments/cancel', {
                registrationId,
                orderId: payment.orderId,
              });
              reject(
                new Error(
                  'Payment was cancelled. Your registration is saved as payment pending.'
                )
              );
              return;
            }

            if (response === 'CONCLUDED') {
              await verifyPayment({ registrationId, orderId: payment.orderId });
              resolve();
              return;
            }

            await postPaymentUpdate('/api/payments/failure', {
              registrationId,
              orderId: payment.orderId,
              reason: 'PhonePe checkout closed before payment conclusion',
              rawResponse: { response },
            });
            reject(new Error('PhonePe payment was not completed.'));
          } catch (error) {
            reject(error);
          }
        },
      });
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Upload participant document if not already uploaded
      let participantDocUrl = docState.url;
      if (!participantDocUrl && docState.file) {
        setDocState((prev) => ({ ...prev, uploading: true }));
        participantDocUrl = await uploadDoc(docState.file, 'participant');
        setDocState((prev) => ({ ...prev, url: participantDocUrl, uploaded: true, uploading: false }));
      }

      // Upload partner document for couple category
      let partnerDocUrl = partnerDocState.url;
      if (isCoupleCategory && !partnerDocUrl && partnerDocState.file) {
        setPartnerDocState((prev) => ({ ...prev, uploading: true }));
        partnerDocUrl = await uploadDoc(partnerDocState.file, 'partner');
        setPartnerDocState((prev) => ({ ...prev, url: partnerDocUrl, uploaded: true, uploading: false }));
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          documentUrl: participantDocUrl,
          partnerDocumentUrl: partnerDocUrl || undefined,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Please try again.');
      }

      if (responseData.paymentRequired) {
        await openPhonePePayment({
          registrationId: responseData.id,
          payment: responseData.payment,
        });
        return;
      }

      setSuccessMessage('Registration successful. Your details have been submitted.');
      setFormSubmitted(true);
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="register" className="py-4 py-md-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div
              className="card border-0 rounded-4 overflow-hidden"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,.08)',
              }}
            >

              {/* Responsive Header Container */}
              <div
                className="p-4 border-bottom text-white d-flex flex-column flex-md-row align-items-center justify-content-between gap-4 text-center text-md-start"
                style={{
                  background: 'linear-gradient(135deg, var(--secondary, #111), var(--dark, #222))',
                }}
              >
                {/* Left Logo */}
                <img
                  src="/images/logo (1).png"
                  alt="Boisar Varsha Marathon Logo"
                  style={{ width: '90px', height: '90px', objectFit: 'contain' }}
                />

                {/* Main Header Text */}
                <div className="flex-grow-1 text-center px-md-3">
                  <h2 className="fw-bold mb-2 h3 responsive-heading" style={{ color: 'var(--accent, #ffcc00)', letterSpacing: '1px' }}>
                    BOISAR VARSHA MARATHON 2026
                  </h2>
                  <p className="mb-0 text-light opacity-75 small">Official Registration Portal &amp; Event Guidelines</p>
                </div>

                {/* Right Logo */}
                <img
                  src="/images/Olympic vision logo 2.png"
                  alt="Olympic Vision India Logo"
                  style={{ width: '120px', height: '55px', objectFit: 'contain' }}
                />
              </div>

              <div className="card-body p-3 p-sm-4 p-md-5" style={{ color: 'var(--dark, #111)', background: 'linear-gradient(to bottom,#ffffff,#fafbfc)' }}>
                <div className="mb-5 pb-4 border-bottom" style={{ lineHeight: '1.8', textAlign: 'justify' }}>
                  <p className="mb-1 fw-semibold text-muted small text-sm-start">
                    <strong>Boisar Varsha Marathon 2026</strong><br />
                    Organised by <em>Pratishthan</em> and <em>Shiv Sena</em><br />
                    Supported by <em>Olympic Vision India</em><br />
                    Under the aegis of <em>Palghar District Athletic Association</em> and <em>Maharashtra Athletic Association</em>
                  </p>

                  <p className="mb-3 fw-bold mt-4 h5" style={{ color: 'var(--dark, #111)' }}>
                    Subject: Official Registration &amp; Race Categories
                  </p>

                  <p className="mb-4 text-muted small">
                    We are pleased to open registrations for the <strong>Boisar Varsha Marathon 2026</strong>. Please enter date of birth and gender first so the form can show only eligible categories.
                  </p>

                  <div className="row g-4 mt-2">
                    <div className="col-md-7">
                      <p className="mb-2 fw-bold text-uppercase tracking-wider small text-secondary">
                        Race Categories &amp; Track Rules:
                      </p>
                      <ul className="ps-3 text-muted small lh-lg" style={{ listStyleType: 'square' }}>
                        <li className="mb-1"><strong>3 km U14:</strong> Available only for participants under 14.</li>
                        <li className="mb-1"><strong>5 km U17:</strong> Available only for participants under 17 after U14 age.</li>
                        <li className="mb-1"><strong>6 km U19:</strong> Available only for participants under 19 after U17 age.</li>
                        <li className="mb-1"><strong>11 km Men&apos;s Open:</strong> Available for eligible men age 19+ with Rs. {OPEN_CATEGORY_FEE_RUPEES} online fee.</li>
                        <li className="mb-1"><strong>8 km Women&apos;s Open:</strong> Available for eligible women age 19+ with Rs. {OPEN_CATEGORY_FEE_RUPEES} online fee.</li>
                        <li className="mb-1"><strong>1 km Fun Run:</strong> Senior Citizens, ages 55+.</li>
                        <li><strong>1 km Fun Run:</strong> Couples Race, husband and wife.</li>
                      </ul>
                    </div>

                    <div className="col-md-5">
                      <p className="mb-2 fw-bold text-uppercase tracking-wider small text-secondary">
                        Fee &amp; Payment:
                      </p>
                      <div className="p-3 bg-light rounded-3 border">
                        <ul className="ps-3 mb-0 text-muted small lh-lg">
                          <li className="mb-1">Only Men&apos;s Open and Women&apos;s Open require PhonePe payment.</li>
                          <li className="mb-1">Open category fee: Rs. {OPEN_CATEGORY_FEE_RUPEES}.</li>
                          <li>U14, U17, U19, Senior, and Couple categories are free in this form.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-top">
                    <p className="mb-2 fw-bold text-uppercase tracking-wider small text-secondary">
                      Awards &amp; Recognition:
                    </p>

                    <div className="row g-3">
                      {/* Race category prizes */}
                      <div className="col-md-7">
                        <div className="p-3 bg-light rounded-3 border">
                          <p className="mb-2 fw-semibold small" style={{ color: '#b8860b' }}>
                            🏆 Race Categories (11km, 8km, 6km, 5km, 3km)
                          </p>
                          <ul className="ps-3 mb-0 text-muted small lh-lg" style={{ listStyleType: 'square' }}>
                            <li className="mb-1"><strong>Top 5 finishers</strong> in each category receive cash prize, trophy, medal &amp; certificate.</li>
                            <li className="mb-1"><strong>Top 10 finishers</strong> in each category receive a medal.</li>
                            <li className="mb-1"><strong>Every participant</strong> receives a Certificate of Participation.</li>
                            <li><strong>Every participant</strong> receives refreshments on event day.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Special category prizes + school trophy */}
                      <div className="col-md-5">
                        <div className="p-3 bg-light rounded-3 border h-100">
                          <p className="mb-2 fw-semibold small" style={{ color: '#b8860b' }}>
                            🎁 Special Categories &amp; School Award
                          </p>
                          <ul className="ps-3 mb-0 text-muted small lh-lg" style={{ listStyleType: 'square' }}>
                            <li className="mb-1"><strong>Top 3 finishers</strong> in Senior Citizen Race &amp; Couples Race receive a gift.</li>
                            <li>Schools with <strong>100+ participants</strong> will be felicitated with a trophy.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {formSubmitted ? (
                  <div className="alert alert-success text-center py-4 rounded-3 shadow-sm" role="alert">
                    <h4 className="alert-heading fw-bold">Registration Successful!</h4>
                    <p className="mb-0">{successMessage}</p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} noValidate>
                    <div className="text-center mb-5">
                      <span
                        className="badge px-3 py-2 mb-3"
                        style={{
                          background: 'rgba(255,204,0,.15)',
                          color: '#b8860b',
                          letterSpacing: '1px',
                        }}
                      >
                        REGISTRATION FORM
                      </span>

                      <h3 className="fw-bold mb-2">
                        Participant Entry Form
                      </h3>

                      <p className="text-muted mb-0">
                        Fill in your details to register for Boisar Varsha Marathon 2026.
                      </p>
                    </div>

                    <div className="row g-4 row-form-fields">
                      {/* Full Name Field */}
                      <div className="col-md-6 field-container">
                        <label className="form-label fw-semibold small text-secondary">Full Name (As per Govt ID)</label>
                        <input
                          type="text"
                          className={`form-control form-control-lg ${errors.fullName ? 'is-invalid' : ''}`}
                          name="fullName"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="invalid-feedback">{errors.fullName}</div>
                      </div>

                      {/* Contact Number Field */}
                      <div className="col-md-6 field-container">
                        <label className="form-label fw-semibold small text-secondary">Contact Number</label>
                        <input
                          type="tel"
                          maxLength={10}
                          className={`form-control form-control-lg  ${errors.phone ? 'is-invalid' : ''}`}
                          name="phone"
                          placeholder="Enter your 10-digit phone number"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="invalid-feedback">{errors.phone}</div>
                      </div>

                      {/* Date of Birth Field */}
                      <div className="col-md-6 field-container">
                        <label className="form-label fw-semibold small text-secondary">Date of Birth</label>
                        <input
                          type="date"
                          max={todayString}
                          className={`form-control form-control-lg ${errors.dob ? 'is-invalid' : ''}`}
                          name="dob"
                          value={formData.dob}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="invalid-feedback">{errors.dob}</div>
                      </div>

                      {/* Gender Field */}
                      <div className="col-md-6 field-container">
                        <label className="form-label fw-semibold small text-secondary">Gender</label>
                        <select
                          className={`form-select form-control-lg ${errors.gender ? 'is-invalid' : ''}`}
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
                        <div className="invalid-feedback">{errors.gender}</div>
                      </div>

                      {/* Institution / Locality Field */}
                      <div className="col-md-12 field-container">
                        <label className="form-label fw-semibold small text-secondary">School / College / Organization Name</label>
                        <input
                          type="text"
                          className={`form-control form-control-lg ${errors.school ? 'is-invalid' : ''}`}
                          name="school"
                          placeholder="Enter your institution or residential locality"
                          value={formData.school}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="invalid-feedback">{errors.school}</div>
                      </div>

                      {/* Race Track Dropdown Field */}
                      <div className="col-md-12 field-container">
                        <label className="form-label fw-semibold small text-secondary">Available Race Track</label>
                        <select
                          className={`form-select form-control-lg ${errors.category ? 'is-invalid' : ''}`}
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          disabled={!formData.dob || !formData.gender}
                        >
                          <option value="">
                            {formData.dob && formData.gender
                              ? '--- Select your verified track category ---'
                              : 'Please input Date of Birth and Gender to unlock applicable tracks'}
                          </option>
                          {availableCategories.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                        {errors.category ? (
                          <div className="invalid-feedback">{errors.category}</div>
                        ) : (
                          <div className="form-text text-muted small mt-1">
                            The system filters categories by age and gender before registration.
                          </div>
                        )}
                      </div>

                      {selectedCategoryRequiresPayment ? (
                        <div className="col-12">
                          <div className="alert alert-warning mb-0" role="alert">
                            This open category requires an online PhonePe payment of Rs. {OPEN_CATEGORY_FEE_RUPEES}. Your registration is confirmed only after payment succeeds.
                          </div>
                        </div>
                      ) : null}

                      {/* =====================================================
                          DOCUMENT UPLOAD SECTION (mandatory for all)
                      ====================================================== */}
                      <div className="col-12">
                        <div
                          style={{
                            background: 'linear-gradient(135deg,rgba(255,204,0,.08),rgba(255,204,0,.03))',
                            border: '2px dashed rgba(184,134,11,.35)',
                            borderRadius: 16,
                            padding: '24px 20px',
                          }}
                        >
                          <div className="mb-3">
                            <span
                              style={{
                                display: 'inline-block',
                                background: '#b8860b',
                                color: '#fff',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                letterSpacing: '0.8px',
                                textTransform: 'uppercase',
                                borderRadius: 6,
                                padding: '3px 10px',
                                marginBottom: 10,
                              }}
                            >
                              📄 Identity Verification — Required
                            </span>
                            <p className="text-muted small mb-0">
                              Every participant must upload a valid government-issued identity proof (Aadhaar, PAN, Passport, Voter ID, Driving Licence). Accepted formats: JPG, PNG, PDF — max 5&nbsp;MB.
                            </p>
                          </div>

                          {/* Participant document */}
                          <div className="field-container mb-3">
                            <label
                              className="form-label fw-semibold small text-secondary"
                              htmlFor="doc-upload"
                            >
                              Your Identity Proof (Aadhaar / PAN / Passport)
                            </label>

                            {!docState.uploaded ? (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <input
                                  id="doc-upload"
                                  ref={docInputRef}
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                  style={{ display: 'none' }}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setErrors((prev) => ({ ...prev, document: '' }));
                                    setDocState({ file, url: '', uploading: true, uploaded: false });
                                    try {
                                      const url = await uploadDoc(file, 'participant');
                                      setDocState({ file, url, uploading: false, uploaded: true });
                                    } catch (err) {
                                      setDocState({ file: null, url: '', uploading: false, uploaded: false });
                                      setErrors((prev) => ({ ...prev, document: err.message || 'Upload failed. Please try again.' }));
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  style={{ borderRadius: 10, fontWeight: 600, fontSize: '0.85rem' }}
                                  onClick={() => docInputRef.current?.click()}
                                  disabled={docState.uploading}
                                >
                                  {docState.uploading ? '⏳ Uploading…' : '📎 Choose File'}
                                </button>
                                {docState.file && !docState.uploading && (
                                  <span className="text-muted small">{docState.file.name}</span>
                                )}
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  background: 'rgba(25,135,84,.08)',
                                  border: '1.5px solid rgba(25,135,84,.3)',
                                  borderRadius: 10,
                                  padding: '10px 14px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span style={{ color: '#198754', fontWeight: 700, fontSize: '1rem' }}>✅</span>
                                <span className="small fw-semibold" style={{ color: '#198754' }}>
                                  Document uploaded successfully
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger ms-auto"
                                  style={{ borderRadius: 8, fontSize: '0.75rem', padding: '2px 10px' }}
                                  onClick={() => {
                                    setDocState({ file: null, url: '', uploading: false, uploaded: false });
                                    if (docInputRef.current) docInputRef.current.value = '';
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            )}

                            {/* Inline document preview */}
                            {docState.uploaded && docState.url && (
                              <div style={{ marginTop: 12 }}>
                                {docState.file?.type?.startsWith('image/') || docState.url.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: 8, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                    <img
                                      src={docState.url}
                                      alt="Identity Document Preview"
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: '160px',
                                        borderRadius: 8,
                                        objectFit: 'contain',
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', padding: '8px 12px', borderRadius: 8 }}>
                                    <span style={{ fontSize: '1.2rem' }}>📎</span>
                                    <span className="small text-muted" style={{ wordBreak: 'break-all' }}>
                                      {docState.file?.name || 'Attached PDF Document'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            {errors.document && (
                              <div className="invalid-feedback" style={{ display: 'block' }}>
                                {errors.document}
                              </div>
                            )}
                          </div>

                          {/* Partner document — only for couple category */}
                          {isCoupleCategory && (
                            <div className="field-container">
                              <label
                                className="form-label fw-semibold small text-secondary"
                                htmlFor="partner-doc-upload"
                              >
                                Partner&apos;s Identity Proof (Aadhaar / PAN / Passport)
                              </label>

                              {!partnerDocState.uploaded ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <input
                                    id="partner-doc-upload"
                                    ref={partnerDocInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setErrors((prev) => ({ ...prev, partnerDocument: '' }));
                                      setPartnerDocState({ file, url: '', uploading: true, uploaded: false });
                                      try {
                                        const url = await uploadDoc(file, 'partner');
                                        setPartnerDocState({ file, url, uploading: false, uploaded: true });
                                      } catch (err) {
                                        setPartnerDocState({ file: null, url: '', uploading: false, uploaded: false });
                                        setErrors((prev) => ({ ...prev, partnerDocument: err.message || 'Upload failed. Please try again.' }));
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    style={{ borderRadius: 10, fontWeight: 600, fontSize: '0.85rem' }}
                                    onClick={() => partnerDocInputRef.current?.click()}
                                    disabled={partnerDocState.uploading}
                                  >
                                    {partnerDocState.uploading ? '⏳ Uploading…' : '📎 Choose File'}
                                  </button>
                                  {partnerDocState.file && !partnerDocState.uploading && (
                                    <span className="text-muted small">{partnerDocState.file.name}</span>
                                  )}
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    background: 'rgba(25,135,84,.08)',
                                    border: '1.5px solid rgba(25,135,84,.3)',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <span style={{ color: '#198754', fontWeight: 700, fontSize: '1rem' }}>✅</span>
                                  <span className="small fw-semibold" style={{ color: '#198754' }}>
                                    Partner document uploaded
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger ms-auto"
                                    style={{ borderRadius: 8, fontSize: '0.75rem', padding: '2px 10px' }}
                                    onClick={() => {
                                      setPartnerDocState({ file: null, url: '', uploading: false, uploaded: false });
                                      if (partnerDocInputRef.current) partnerDocInputRef.current.value = '';
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}

                              {/* Partner Inline document preview */}
                              {partnerDocState.uploaded && partnerDocState.url && (
                                <div style={{ marginTop: 12 }}>
                                  {partnerDocState.file?.type?.startsWith('image/') || partnerDocState.url.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                                    <div style={{ textAlign: 'center', background: '#f8fafc', padding: 8, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                      <img
                                        src={partnerDocState.url}
                                        alt="Partner Identity Document Preview"
                                        style={{
                                          maxWidth: '100%',
                                          maxHeight: '160px',
                                          borderRadius: 8,
                                          objectFit: 'contain',
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', padding: '8px 12px', borderRadius: 8 }}>
                                      <span style={{ fontSize: '1.2rem' }}>📎</span>
                                      <span className="small text-muted" style={{ wordBreak: 'break-all' }}>
                                        {partnerDocState.file?.name || 'Attached PDF Document'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {errors.partnerDocument && (
                                <div className="invalid-feedback" style={{ display: 'block' }}>
                                  {errors.partnerDocument}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-12 mt-4 mt-md-5">
                        <button
                          type="submit"
                          className="btn btn-lg w-100 text-uppercase fw-bold shadow-sm"
                          disabled={isSubmitting}
                          style={{
                            background: 'var(--accent, #ffcc00)',
                            color: 'var(--dark, #111)',
                            borderRadius: '50px',
                            padding: '0.85rem 1.5rem',
                            letterSpacing: '1px',
                          }}
                        >
                          {isSubmitting
                            ? 'Processing...'
                            : selectedCategoryRequiresPayment
                              ? `Pay Rs. ${OPEN_CATEGORY_FEE_RUPEES} & Submit Registration`
                              : 'Submit Registration & Lock Category'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="mt-5 pt-4 border-top" aria-label="Sponsors and supporters">
                  <div className="text-center mb-4">

                    <div
                      aria-hidden="true"
                      className="mx-auto"
                      style={{
                        width: 72,
                        height: 3,
                        borderRadius: 999,
                        background: 'var(--accent, #ffcc00)',
                      }}
                    />
                  </div>

                  <div className="sponsor-carousel" aria-label="Event sponsors and supporters">
                    <div className="sponsor-track">
                      {SPONSOR_IMAGES.map((image) => (
                        <div className="sponsor-card" key={image.src}>
                          <span className="sponsor-role">{image.role}</span>
                          <div className="sponsor-logo-wrap">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              width={image.width}
                              height={image.height}
                              quality={100}
                              sizes="(max-width: 768px) 60vw, (max-width: 1200px) 28vw, 220px"
                              className="sponsor-logo"
                            />
                          </div>
                          <span className="sponsor-name">{image.name}</span>
                        </div>
                      ))}
                      {SPONSOR_IMAGES.map((image) => (
                        <div className="sponsor-card" key={`${image.src}-loop`} aria-hidden="true">
                          <span className="sponsor-role">{image.role}</span>
                          <div className="sponsor-logo-wrap">
                            <Image
                              src={image.src}
                              alt=""
                              width={image.width}
                              height={image.height}
                              quality={100}
                              sizes="(max-width: 768px) 60vw, (max-width: 1200px) 28vw, 220px"
                              className="sponsor-logo"
                            />
                          </div>
                          <span className="sponsor-name">{image.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subtle Web Dev Agency Credit Footer */}
                  <div className="mt-5 pt-4 border-top d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 text-muted small">
                    <p className="mb-0 text-center text-sm-start opacity-75">
                      © 2026 Boisar Varsha Marathon. All rights reserved.
                    </p>
                    <p className="mb-0 text-center text-sm-end agency-credit">
                      Designed &amp; Developed by{' '}
                      <a
                        href="https://thetechnocyte.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fw-semibold text-decoration-none agency-link"
                      >
                        Technocyte
                      </a>
                    </p>
                  </div>

                  <style jsx>{`
                    html,
                    body {
                      overflow-x: hidden;
                      scroll-behavior: auto !important;
                    }

                    .card,
                    .card-body,
                    form,
                    .field-container {
                      transform: none !important;
                    }
                    /* =========================
                       PROFESSIONAL FORM DESIGN
                    ========================== */

                    .field-container label {
                      font-size: 0.85rem;
                      letter-spacing: 0.5px;
                      text-transform: uppercase;
                      margin-bottom: 8px;
                      font-weight: 700;
                    }

                    .field-container {
                      min-height: 120px;
                    }

                    .field-container :global(.invalid-feedback) {
                      display: block;
                      min-height: 20px;
                      margin-top: 6px;
                    }

                    .field-container :global(.form-text) {
                      display: block;
                      min-height: 20px;
                      margin-top: 6px;
                    }

                    /* =========================
                       INPUTS & SELECTS
                    ========================== */

                    :global(.form-control),
                    :global(.form-select) {
                      font-size: 16px !important;
                      border: 2px solid #e5e7eb;
                      border-radius: 12px;
                      background: #fff;
                      min-height: 58px;

                      transition:
                        border-color 0.2s ease,
                        background-color 0.2s ease;

                      transform: none !important;
                    }

                    :global(.form-control:hover),
                    :global(.form-select:hover) {
                      border-color: #d1d5db;
                    }

                    :global(.form-control:focus),
                    :global(.form-select:focus) {
                      border-color: #ffcc00;
                      box-shadow: none !important;
                      outline: none;
                      background: #fff;
                    }

                    /* =========================
                       BUTTON
                    ========================== */

                    button[type='submit'] {
                      background: linear-gradient(
                        135deg,
                        #ffcc00,
                        #ffb300
                      ) !important;
                      color: #111 !important;
                      border: none !important;
                      border-radius: 14px !important;
                      box-shadow: 0 12px 30px rgba(255, 204, 0, 0.25);
                      transition: all 0.3s ease;
                    }

                    button[type='submit']:hover:not(:disabled) {
                      transform: translateY(-2px);
                    }

                    button[type='submit']:active:not(:disabled) {
                      transform: translateY(0);
                    }

                    button[type='submit']:disabled {
                      opacity: 0.8;
                    }

                    /* =========================
                       ALERTS
                    ========================== */

                    :global(.alert-success) {
                      border: none;
                      border-radius: 18px;
                      background: linear-gradient(
                        135deg,
                        rgba(25, 135, 84, 0.08),
                        rgba(25, 135, 84, 0.15)
                      );
                    }

                    :global(.alert-warning) {
                      border-radius: 14px;
                      border: none;
                    }

                    /* =========================
                       CARD IMPROVEMENTS
                    ========================== */

                    :global(.card) {
                      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
                    }

                    /* =========================
                       SPONSOR SECTION
                    ========================== */

                    .responsive-heading {
                      font-size: clamp(1.2rem, 4vw, 1.75rem);
                    }

                    .sponsor-carousel {
                      overflow: hidden;
                      padding: 4px 0 14px;
                      mask-image: linear-gradient(
                        90deg,
                        transparent,
                        #000 9%,
                        #000 91%,
                        transparent
                      );
                    }

                    .sponsor-track {
                      display: flex;
                      width: max-content;
                      gap: 16px;
                      animation: sponsor-marquee 24s linear infinite;
                    }

                    .sponsor-carousel:hover .sponsor-track {
                      animation-play-state: paused;
                    }

                    .sponsor-card {
                      flex: 0 0 clamp(190px, 24vw, 250px);
                      height: 250px;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: flex-start;
                      border: 1px solid rgba(15, 23, 42, 0.08);
                      border-radius: 14px;
                      background: #fff;
                      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
                      overflow: hidden;
                      padding: 14px 10px 12px;
                      box-sizing: border-box;
                      transition: transform 0.3s ease;
                    }

                    .sponsor-card:hover {
                      transform: translateY(-4px);
                    }

                    .sponsor-role {
                      display: block;
                      width: 100%;
                      font-size: 0.68rem;
                      font-weight: 700;
                      text-transform: uppercase;
                      letter-spacing: 0.6px;
                      color: #b8860b;
                      text-align: center;
                      padding: 0 6px;
                    }

                    .sponsor-logo-wrap {
                      width: 100%;
                      height: 130px;
                      overflow: hidden;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      padding: 8px 14px;
                      box-sizing: border-box;
                    }

                    .sponsor-logo-wrap :global(img) {
                      width: 100% !important;
                      height: 100% !important;
                      max-width: 100%;
                      max-height: 100%;
                      object-fit: contain;
                      object-position: center;
                      image-rendering: -webkit-optimize-contrast;
                    }

                    .sponsor-name {
                      display: block;
                      width: 100%;
                      font-size: 0.82rem;
                      font-weight: 700;
                      color: var(--dark, #111);
                      text-align: center;
                      padding: 0 6px;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                    }

                    /* =========================
                       AGENCY FOOTER CREDIT
                    ========================== */

                    .agency-credit {
                      font-size: 0.8rem;
                      letter-spacing: 0.3px;
                      opacity: 0.75;
                      transition: opacity 0.2s ease;
                    }

                    .agency-credit:hover {
                      opacity: 1;
                    }

                    :global(.agency-link) {
                      color: var(--dark, #111) !important;
                      position: relative;
                      display: inline-block;
                    }

                    :global(.agency-link::after) {
                      content: '';
                      position: absolute;
                      width: 100%;
                      transform: scaleX(0);
                      height: 2px;
                      bottom: -2px;
                      left: 0;
                      background-color: var(--accent, #ffcc00);
                      transform-origin: bottom right;
                      transition: transform 0.25s ease-out;
                    }

                    :global(.agency-link:hover::after) {
                      transform: scaleX(1);
                      transform-origin: bottom left;
                    }

                    @keyframes sponsor-marquee {
                      from {
                        transform: translateX(0);
                      }

                      to {
                        transform: translateX(calc(-50% - 8px));
                      }
                    }

                    @media (max-width: 576px) {
                      .sponsor-track {
                        gap: 12px;
                        animation-duration: 20s;
                      }

                      .sponsor-card {
                        flex-basis: 210px;
                        height: 225px;
                        padding: 12px 8px 10px;
                      }

                      .sponsor-role {
                        font-size: 0.62rem;
                      }

                      .sponsor-logo-wrap {
                        height: 112px;
                        padding: 6px 10px;
                      }

                      .sponsor-name {
                        font-size: 0.76rem;
                      }
                    }

                    @media (prefers-reduced-motion: reduce) {
                      .sponsor-track {
                        animation: none;
                        flex-wrap: wrap;
                        justify-content: center;
                        width: 100%;
                      }

                      .sponsor-card[aria-hidden='true'] {
                        display: none;
                      }
                    }
                  `}</style>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
