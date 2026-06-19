'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  OPEN_CATEGORY_FEE_RUPEES,
  getAvailableRaceCategories,
  isPaidCategory,
} from '@/lib/marathon';

const SPONSOR_IMAGES = [
  { src: '/images/brands/form001.png', alt: 'Mira Bhayander Vasai Virar Police supporter logo', width: 1171, height: 912 },
  { src: '/images/brands/form002.png', alt: 'Boisar Varsha Marathon organizing partners logo', width: 1408, height: 768 },
  { src: '/images/brands/form003.png', alt: 'Palghar District Athletics Association supporter logo', width: 1408, height: 768 },
  { src: '/images/brands/form004.png', alt: 'Western Railway supporter logo', width: 1408, height: 768 },
  { src: '/images/brands/form005.png', alt: 'Aryanz Sports promoter logo', width: 1120, height: 955 },
  { src: '/images/brands/form006.png', alt: 'Indian Athletics and Maharashtra Athletics Association logo', width: 1152, height: 918 },
];

function loadRazorpayCheckout() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Razorpay checkout can only open in the browser.'));
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...((name === 'dob' || name === 'gender') && { category: '' }),
    }));
  };

  const verifyPayment = async ({ registrationId, response }) => {
    const verifyResponse = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registrationId,
        ...response,
      }),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      throw new Error(verifyData.error || 'Payment verification failed.');
    }

    setSuccessMessage('Payment successful. Your marathon registration is confirmed.');
    setFormSubmitted(true);
  };

  const openRazorpayPayment = async ({ registrationId, payment }) => {
    await loadRazorpayCheckout();

    return new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: 'Boisar Varsha Marathon 2026',
        description: `${selectedCategory?.label || 'Open category'} registration`,
        order_id: payment.orderId,
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
        },
        notes: {
          registration_id: registrationId,
          category: formData.category,
        },
        theme: {
          color: '#ffcc00',
        },
        handler: async (response) => {
          try {
            await verifyPayment({ registrationId, response });
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: async () => {
            await postPaymentUpdate('/api/payments/cancel', {
              registrationId,
              orderId: payment.orderId,
            });
            reject(new Error('Payment was cancelled. Your registration is saved as payment pending.'));
          },
        },
      });

      checkout.on('payment.failed', async (event) => {
        await postPaymentUpdate('/api/payments/failure', {
          registrationId,
          orderId: payment.orderId,
          paymentId: event.error?.metadata?.payment_id,
          reason: event.error?.description || 'Razorpay payment failed',
          rawResponse: event.error,
        });
        reject(new Error(event.error?.description || 'Razorpay payment failed.'));
      });

      checkout.open();
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Please try again.');
      }

      if (responseData.paymentRequired) {
        await openRazorpayPayment({
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
    <section id="register" className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="card shadow border-0 rounded-4 overflow-hidden">
              <div
                className="position-relative p-4 text-center border-bottom text-white d-flex flex-column justify-content-center"
                style={{
                  background: 'linear-gradient(135deg, var(--secondary, #111), var(--dark, #222))',
                  minHeight: '120px',
                }}
              >
                <img
                  src="/images/logo (1).png"
                  alt="Boisar Varsha Marathon Logo"
                  className="position-absolute start-0 ms-4"
                  style={{ width: '100px', height: '100px', top: '50%', transform: 'translateY(-50%)' }}
                />

                <div className="px-5mx-5">
                  <h2 className="fw-bold mb-1" style={{ color: 'var(--accent, #ffcc00)', letterSpacing: '1px' }}>
                    BOISAR VARSHA MARATHON 2026
                  </h2>
                  <p className="mb-0 text-light opacity-75 small">Official Registration Portal &amp; Event Guidelines</p>
                </div>

                <img
                  src="/images/Olympic vision logo 2.png"
                  alt="Olympic Vision India Logo"
                  className="position-absolute end-0 me-4"
                  style={{ width: '135px', height: '60px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>

              <div className="card-body p-4 p-md-5" style={{ color: 'var(--dark, #111)', backgroundColor: '#fff' }}>
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
                          <li className="mb-1">Only Men&apos;s Open and Women&apos;s Open require Razorpay payment.</li>
                          <li className="mb-1">Open category fee: Rs. {OPEN_CATEGORY_FEE_RUPEES}.</li>
                          <li>U14, U17, U19, Senior, and Couple categories are free in this form.</li>
                        </ul>
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
                  <form onSubmit={handleFormSubmit} className="needs-validation">
                    <h4 className="fw-bold mb-4" style={{ color: 'var(--dark, #111)' }}>Participant Entry Form</h4>

                    <div className="row g-4">
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

                      <div className="col-md-12">
                        <label className="form-label fw-semibold small text-secondary">Available Race Track</label>
                        <select
                          className="form-select form-control-lg border-2"
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
                        <div className="form-text text-muted small mt-1">
                          The system filters categories by age and gender before registration.
                        </div>
                      </div>

                      {selectedCategoryRequiresPayment ? (
                        <div className="col-12">
                          <div className="alert alert-warning mb-0" role="alert">
                            This open category requires an online Razorpay payment of Rs. {OPEN_CATEGORY_FEE_RUPEES}. Your registration is confirmed only after payment succeeds.
                          </div>
                        </div>
                      ) : null}

                      <div className="col-12 mt-5">
                        <button
                          type="submit"
                          className="btn btn-lg w-100 text-uppercase fw-bold shadow-sm"
                          disabled={isSubmitting}
                          style={{
                            background: 'var(--accent, #ffcc00)',
                            color: 'var(--dark, #111)',
                            borderRadius: '50px',
                            padding: '1rem 2rem',
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

                <div
                  className="mt-5 pt-4 border-top"
                  aria-label="Sponsors and supporters"
                >
                  <div className="text-center mb-4">
                    <p className="text-uppercase fw-bold small text-secondary mb-2" style={{ letterSpacing: '0.1em' }}>
                      Sponsored &amp; Supported By
                    </p>
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
                          <Image
                            src={image.src}
                            alt={image.alt}
                            width={image.width}
                            height={image.height}
                            sizes="(max-width: 768px) 60vw, (max-width: 1200px) 28vw, 220px"
                            className="sponsor-logo"
                          />
                        </div>
                      ))}
                      {SPONSOR_IMAGES.map((image) => (
                        <div className="sponsor-card" key={`${image.src}-loop`} aria-hidden="true">
                          <Image
                            src={image.src}
                            alt=""
                            width={image.width}
                            height={image.height}
                            sizes="(max-width: 768px) 60vw, (max-width: 1200px) 28vw, 220px"
                            className="sponsor-logo"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <style jsx>{`
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
                      display: grid;
                      place-items: center;
                      min-height: 178px;
                      border: 1px solid rgba(15, 23, 42, 0.1);
                      border-radius: 8px;
                      background: #fff;
                      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
                      overflow: hidden;
                    }

                    .sponsor-logo {
                      width: 100%;
                      height: 160px;
                      object-fit: contain;
                      padding: 18px;
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
                        min-height: 150px;
                      }

                      .sponsor-logo {
                        height: 136px;
                        padding: 14px;
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
