'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';

const initialValues = {
  fullName: '',
  guardianName: '',
  dateOfBirth: '',
  gender: 'male',
  playerCategory: '',
  mobileNo: '',
  alternateMobile: '',
  email: '',
  address: '',
  district: 'Palghar',
  pinCode: '',
  teamName: '',
  playingPosition: '',
  preferredHand: 'right',
  heightCm: '',
  weightKg: '',
  playingExperience: '',
  previousClub: '',
  highestLevel: '',
  jerseySize: '',
  medicalLimitations: '',
  emergencyContactName: '',
  emergencyRelationship: 'parent',
  emergencyPhone: '',
  typedSignature: '',
  undertakingAccepted: false,
  medicalConsent: false,
};

export function getAvailablePDVLCategories(dob) {
  if (!dob) {
    return [
      { value: 'u14', label: 'U14 (Under 14) [Cut-Off: Born On/After 01/01/2013]' },
      { value: 'u17', label: 'U17 (Under 17) [Cut-Off: Born On/After 01/01/2010]' },
      { value: 'u19', label: 'U19 (Under 19) [Cut-Off: Born On/After 01/01/2008]' },
      { value: 'palghar_open', label: 'Palghar Open [Born before 01/01/2008]' },
      { value: 'icon_player', label: 'Icon Player [Born before 01/01/2008]' },
    ];
  }

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return [];
  }

  const cutOffU14 = new Date('2013-01-01');
  const cutOffU17 = new Date('2010-01-01');
  const cutOffU19 = new Date('2008-01-01');

  if (birthDate >= cutOffU14) {
    return [
      { value: 'u14', label: 'U14 (Under 14) [Cut-Off: Born On/After 01/01/2013]' },
    ];
  }

  if (birthDate >= cutOffU17) {
    return [
      { value: 'u17', label: 'U17 (Under 17) [Cut-Off: Born On/After 01/01/2010]' },
    ];
  }

  if (birthDate >= cutOffU19) {
    return [
      { value: 'u19', label: 'U19 (Under 19) [Cut-Off: Born On/After 01/01/2008]' },
    ];
  }

  return [
    { value: 'palghar_open', label: 'Palghar Open [Born before 01/01/2008]' },
    { value: 'icon_player', label: 'Icon Player [Born before 01/01/2008]' },
  ];
}

const POSITIONS = [
  { value: 'setter', label: 'Setter' },
  { value: 'outside_hitter', label: 'Outside Hitter' },
  { value: 'opposite_hitter', label: 'Opposite Hitter' },
  { value: 'middle_blocker', label: 'Middle Blocker' },
  { value: 'libero', label: 'Libero' },
  { value: 'other', label: 'Other' },
];

const HIGHEST_LEVELS = [
  { value: 'taluka', label: 'Taluka Level' },
  { value: 'district', label: 'District Level' },
  { value: 'state', label: 'State Level' },
  { value: 'national', label: 'National Level' },
  { value: 'other', label: 'Other' },
];

const JERSEY_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export default function PDVLRegistrationForm() {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewCountdown, setPreviewCountdown] = useState(0);
  const [registrationId, setRegistrationId] = useState('');
  const [photo, setPhoto] = useState({ url: '', uploading: false, name: '', size: '' });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (step !== 4 || previewCountdown <= 0) return undefined;
    const countdownTimer = window.setTimeout(() => {
      setPreviewCountdown((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearTimeout(countdownTimer);
  }, [step, previewCountdown]);

  // Auto calculate age from date of birth
  const calculatedAge = useMemo(() => {
    if (!values.dateOfBirth) return '';
    const dob = new Date(values.dateOfBirth);
    if (isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : '';
  }, [values.dateOfBirth]);

  // Available categories based on DOB cut-offs
  const availableCategories = useMemo(() => {
    return getAvailablePDVLCategories(values.dateOfBirth);
  }, [values.dateOfBirth]);

  const updateField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    if (name === 'dateOfBirth') {
      const availCats = getAvailablePDVLCategories(newValue);
      // Always auto-select: for youth there's only 1 option, for adults default to first (palghar_open)
      const autoCategory = availCats[0]?.value || '';
      setValues((prev) => ({
        ...prev,
        dateOfBirth: newValue,
        playerCategory: autoCategory,
      }));
      setFieldErrors((prev) => ({ ...prev, dateOfBirth: '', playerCategory: '' }));
      setError('');
    } else {
      updateField(name, newValue);
    }
  };

  const handleFileUpload = (file) => {
    // Ensure we have a real File object (not undefined/null)
    if (!(file instanceof File)) return;
    if (!file) return;

    // Check basic file type
    const isImage = file.type?.startsWith('image/') || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
    if (!isImage) {
      setError('Player photo must be an image (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Player photo must be 2 MB or smaller.');
      return;
    }

    setError('');
    const formattedSize = (file.size / 1024).toFixed(1) + ' KB';
    setPhoto({ url: '', uploading: true, name: file.name, size: formattedSize });

    // Step 1: Immediately read as base64 — guaranteed to work offline/on-network
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target.result;

      // Set base64 preview right away so the user sees the photo
      setPhoto({ url: base64Url, uploading: false, name: file.name, size: formattedSize });
      setFieldErrors((prev) => ({ ...prev, photo: '' }));

      // Step 2: Attempt background API upload to get a permanent Cloudinary URL
      try {
        const body = new FormData();
        body.append('file', file);
        body.append('label', 'pdvl-player-photo');
        const response = await fetch('/api/upload-document', { method: 'POST', body });
        if (response.ok) {
          const data = await response.json();
          if (data.url && !data.url.startsWith('data:')) {
            // Upgrade to permanent Cloudinary URL silently
            setPhoto((prev) => ({ ...prev, url: data.url }));
          }
        }
      } catch {
        // API failed — base64 preview is already set, form can still be submitted
      }
    };
    reader.onerror = () => {
      setPhoto({ url: '', uploading: false, name: '', size: '' });
      setError('Could not read the photo. Please try a different image.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const validateStep = (currentStep) => {
    const errors = {};
    let isStepValid = true;

    if (currentStep === 1) {
      if (!values.fullName.trim()) errors.fullName = 'Full name is required';
      if (!values.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!values.gender) errors.gender = 'Please select a gender';
      if (!values.playerCategory) errors.playerCategory = 'Please select a player category';
      if (!values.mobileNo.trim()) {
        errors.mobileNo = 'Mobile number is required';
      } else if (!/^[6-9]\d{9}$/.test(values.mobileNo.trim())) {
        errors.mobileNo = 'Enter a valid 10-digit Indian mobile number';
      }
      if (!values.email.trim()) {
        errors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        errors.email = 'Enter a valid email address';
      }
      if (!values.address.trim()) errors.address = 'Residential address is required';
      if (!photo.url || photo.uploading) {
        errors.photo = photo.uploading
          ? 'Please wait for the photo upload to complete'
          : 'Player photo upload is required';
      }
    } else if (currentStep === 2) {
      if (!values.teamName.trim()) errors.teamName = 'School/College/Institute name is required';
      if (!values.playingPosition) errors.playingPosition = 'Playing position is required';
      if (!values.highestLevel) errors.highestLevel = 'Highest level represented is required';
      if (!values.jerseySize) errors.jerseySize = 'Jersey size is required';
      if (!values.emergencyContactName.trim()) errors.emergencyContactName = 'Emergency contact person name is required';
      if (!values.emergencyPhone.trim()) {
        errors.emergencyPhone = 'Emergency contact phone is required';
      } else if (!/^[6-9]\d{9}$/.test(values.emergencyPhone.trim())) {
        errors.emergencyPhone = 'Enter a valid 10-digit mobile number';
      }
    } else if (currentStep === 3) {
      if (!values.undertakingAccepted) errors.undertakingAccepted = 'You must accept the player undertaking';
      if (!values.medicalConsent) errors.medicalConsent = 'You must accept the medical consent declaration';
      if (!values.typedSignature.trim()) errors.typedSignature = 'Please type your full name as digital signature';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      isStepValid = false;
      const firstErrMsg = Object.values(errors)[0];
      setError(firstErrMsg);
    } else {
      setError('');
    }

    return isStepValid;
  };

  const goToNextStep = () => {
    if (validateStep(step)) {
      if (step === 3) setPreviewCountdown(5);
      setStep((prev) => Math.min(4, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const jumpToStep = (targetStep) => {
    setError('');
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 4 || previewCountdown > 0 || submitting) return;
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setError('Please resolve all validation errors before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/pdvl-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          fullName: values.fullName.trim(),
          guardianName: values.guardianName.trim(),
          mobileNo: values.mobileNo.trim(),
          alternateMobile: values.alternateMobile.trim(),
          email: values.email.trim().toLowerCase(),
          address: values.address.trim(),
          district: values.district.trim(),
          pinCode: values.pinCode.trim(),
          teamName: values.teamName.trim(),
          previousClub: values.previousClub.trim(),
          medicalLimitations: values.medicalLimitations.trim(),
          emergencyContactName: values.emergencyContactName.trim(),
          emergencyRelationship: values.emergencyRelationship.trim(),
          emergencyPhone: values.emergencyPhone.trim(),
          typedSignature: values.typedSignature.trim(),
          photoUrl: photo.url,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit your registration.');
      }
      setRegistrationId(data.id || 'PDVL-' + Math.floor(100000 + Math.random() * 900000));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION RECEIPT VIEW
  if (registrationId) {
    return (
      <div className="py-4 text-center">
        {/* Animated Check Icon */}
        <div
          className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-3 shadow-lg"
          style={{ width: '72px', height: '72px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
        </div>

        <h2 className="h3 fw-bold text-dark mb-1">Registration Successfully Received!</h2>
        <p className="text-secondary mb-4">
          Your official PDVL 2026 player undertaking has been registered.
        </p>

        {/* Receipt / Details Card */}
        <div className="card border rounded-4 text-start p-4 mx-auto mb-4 bg-light shadow-sm" style={{ maxWidth: 640 }}>
          <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
            <div>
              <span className="text-uppercase small text-muted fw-bold d-block">Reference ID</span>
              <span className="font-monospace fw-bold text-primary fs-6">{registrationId}</span>
            </div>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-bold">
              STATUS: REGISTERED
            </span>
          </div>

          <div className="row g-3 small">
            <div className="col-12 col-sm-6">
              <span className="text-muted d-block">Player Name</span>
              <strong className="text-dark fs-6">{values.fullName}</strong>
            </div>
            <div className="col-12 col-sm-6">
              <span className="text-muted d-block">School/College/Institute</span>
              <strong className="text-dark fs-6">{values.teamName}</strong>
            </div>
            <div className="col-6 col-sm-4">
              <span className="text-muted d-block">Category</span>
              <strong className="text-dark text-capitalize">{values.playerCategory.replace('_', ' ')}</strong>
            </div>
            <div className="col-6 col-sm-4">
              <span className="text-muted d-block">Playing Position</span>
              <strong className="text-dark text-capitalize">{values.playingPosition.replace('_', ' ')}</strong>
            </div>
            <div className="col-6 col-sm-4">
              <span className="text-muted d-block">Jersey Size</span>
              <strong className="text-dark">{values.jerseySize.toUpperCase()}</strong>
            </div>
            <div className="col-6 col-sm-4">
              <span className="text-muted d-block">Mobile Phone</span>
              <strong className="text-dark">{values.mobileNo}</strong>
            </div>
            <div className="col-6 col-sm-4">
              <span className="text-muted d-block">District</span>
              <strong className="text-dark">{values.district}</strong>
            </div>
            <div className="col-6 col-sm-4">
              <span className="text-muted d-block">Date of Birth</span>
              <strong className="text-dark">{values.dateOfBirth}</strong>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-center gap-3">
          <button
            type="button"
            className="btn btn-outline-dark rounded-3 px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
            onClick={() => window.print()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z" />
            </svg>
            Print / Save Receipt
          </button>
          <Link href="/" className="btn btn-primary rounded-3 px-4 py-2 fw-semibold">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // STEPPER LABELS
  const steps = [
    { num: 1, label: '1. Personal' },
    { num: 2, label: '2. Sports & Safety' },
    { num: 3, label: '3. Undertaking' },
    { num: 4, label: '4. Preview & Submit' },
  ];

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate>
      {/* Visual Stepper */}
      <div className="pdvl-stepper-container mb-4 pb-2">
        <div className="pdvl-step-track">
          <div
            className="pdvl-step-track-fill"
            style={{
              width: step === 1 ? '0%' : step === 2 ? '33.3%' : step === 3 ? '66.6%' : '100%',
            }}
          />
        </div>
        <div className="d-flex justify-content-between align-items-center">
          {steps.map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            const stateClass = isActive ? 'active' : isCompleted ? 'completed' : 'upcoming';
            return (
              <button
                key={s.num}
                type="button"
                className={`pdvl-step-item text-center ${stateClass}`}
                onClick={() => {
                  if (isCompleted || s.num < step) setStep(s.num);
                }}
                disabled={!isCompleted && !isActive && s.num > step}
              >
                <div className="pdvl-step-badge mx-auto">
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <div className="pdvl-step-label d-none d-sm-block">{s.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Error Alert Banner */}
      {error && (
        <div className="alert alert-danger rounded-3 py-2 px-3 small d-flex align-items-center gap-2 mb-4" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {/* STEP 1: PERSONAL & CONTACT DETAILS */}
      {step === 1 && (
        <div className="row g-3">
          <div className="col-12 border-bottom pb-2 mb-2">
            <h5 className="fw-bold text-dark mb-1">Step 1: Player Personal & Contact Details</h5>
            <p className="text-muted small mb-0">Fill in official player identity, category, photo, and address details.</p>
          </div>

          {/* Full Name */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Full Name (as per official ID) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control pdvl-input ${fieldErrors.fullName ? 'is-invalid' : ''}`}
              placeholder="e.g. Rahul Ramesh Sharma"
              name="fullName"
              value={values.fullName}
              onChange={handleInputChange}
              required
            />
            {fieldErrors.fullName && <div className="invalid-feedback">{fieldErrors.fullName}</div>}
          </div>

          {/* Guardian Name */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Father / Mother / Guardian Name
            </label>
            <input
              type="text"
              className="form-control pdvl-input"
              placeholder="e.g. Ramesh Sharma"
              name="guardianName"
              value={values.guardianName}
              onChange={handleInputChange}
            />
          </div>

          {/* Date of Birth */}
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Date of Birth <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className={`form-control pdvl-input ${fieldErrors.dateOfBirth ? 'is-invalid' : ''}`}
              name="dateOfBirth"
              value={values.dateOfBirth}
              onChange={handleInputChange}
              required
            />
            {fieldErrors.dateOfBirth && <div className="invalid-feedback">{fieldErrors.dateOfBirth}</div>}
          </div>

          {/* Age (Auto calculated) */}
          <div className="col-6 col-md-2">
            <label className="form-label fw-semibold text-secondary small mb-1">Age (Years)</label>
            <input
              type="text"
              className="form-control pdvl-input bg-light text-muted"
              value={calculatedAge !== '' ? `${calculatedAge} yrs` : 'Auto'}
              readOnly
            />
          </div>

          {/* Gender */}
          <div className="col-6 col-md-3">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Gender <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select pdvl-select ${fieldErrors.gender ? 'is-invalid' : ''}`}
              name="gender"
              value={values.gender}
              onChange={handleInputChange}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Player Category — auto-selected from DOB */}
          <div className="col-12 col-md-3">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Player Category <span className="text-danger">*</span>
            </label>
            {!values.dateOfBirth ? (
              <div className="form-control pdvl-input bg-light text-muted small d-flex align-items-center gap-1" style={{ minHeight: 38 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" className="opacity-50">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
                Enter DOB to auto-fill
              </div>
            ) : availableCategories.length === 1 ? (
              // Youth categories — single option, show as locked badge
              <div>
                <div className={`form-control pdvl-input bg-success-subtle border-success-subtle d-flex align-items-center gap-2 ${fieldErrors.playerCategory ? 'border-danger' : ''}`} style={{ minHeight: 38 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="#198754" viewBox="0 0 16 16">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                  <span className="small fw-bold text-success text-truncate">{availableCategories[0].label.split(' [')[0]}</span>
                </div>
                <div className="text-muted text-xs mt-1">Auto-assigned from date of birth</div>
              </div>
            ) : (
              // Adults — let them choose between Palghar Open and Icon Player
              <div>
                <select
                  className={`form-select pdvl-select ${fieldErrors.playerCategory ? 'is-invalid' : ''}`}
                  name="playerCategory"
                  value={values.playerCategory}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label.split(' [')[0]}
                    </option>
                  ))}
                </select>
                {fieldErrors.playerCategory && <div className="invalid-feedback">{fieldErrors.playerCategory}</div>}
              </div>
            )}
          </div>

          {/* DOB Cut-off Info Banner */}
          <div className="col-12">
            <div className="px-3 py-2 bg-light rounded-3 border text-secondary small d-flex align-items-center flex-wrap gap-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 font-monospace fw-bold">
                DOB CUT-OFF DATES
              </span>
              <span>
                <strong>U14:</strong> Born on/after 01/01/2013 &nbsp;•&nbsp;
                <strong>U17:</strong> Born on/after 01/01/2010 &nbsp;•&nbsp;
                <strong>U19:</strong> Born on/after 01/01/2008 &nbsp;•&nbsp;
                <strong>Open / Icon:</strong> Born before 01/01/2008
              </span>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Player Mobile Number <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0 rounded-start-3 font-monospace small">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength="10"
                className={`form-control pdvl-input border-start-0 rounded-end-3 ${fieldErrors.mobileNo ? 'is-invalid' : ''}`}
                placeholder="10-digit mobile number"
                name="mobileNo"
                value={values.mobileNo}
                onChange={handleInputChange}
                required
              />
              {fieldErrors.mobileNo && <div className="invalid-feedback d-block">{fieldErrors.mobileNo}</div>}
            </div>
          </div>

          {/* Alternate / Parent Mobile */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Alternate / Parent Mobile
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0 rounded-start-3 font-monospace small">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength="10"
                className="form-control pdvl-input border-start-0 rounded-end-3"
                placeholder="Parent mobile number"
                name="alternateMobile"
                value={values.alternateMobile}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Email ID */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className={`form-control pdvl-input ${fieldErrors.email ? 'is-invalid' : ''}`}
              placeholder="player@example.com"
              name="email"
              value={values.email}
              onChange={handleInputChange}
              required
            />
            {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
          </div>

          {/* District & PIN Code */}
          <div className="col-6 col-md-3">
            <label className="form-label fw-semibold text-secondary small mb-1">City / District</label>
            <input
              type="text"
              className="form-control pdvl-input"
              name="district"
              value={values.district}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label fw-semibold text-secondary small mb-1">PIN Code</label>
            <input
              type="text"
              maxLength="6"
              className="form-control pdvl-input"
              placeholder="401102"
              name="pinCode"
              value={values.pinCode}
              onChange={handleInputChange}
            />
          </div>

          {/* Permanent Address */}
          <div className="col-12">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Permanent Address <span className="text-danger">*</span>
            </label>
            <textarea
              className={`form-control pdvl-textarea ${fieldErrors.address ? 'is-invalid' : ''}`}
              rows="2"
              placeholder="Enter full permanent postal address"
              name="address"
              value={values.address}
              onChange={handleInputChange}
              required
            />
            {fieldErrors.address && <div className="invalid-feedback">{fieldErrors.address}</div>}
          </div>

          {/* Drag & Drop Photo Upload */}
          <div className="col-12">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Players Photo (Passport Size) <span className="text-danger">*</span>
            </label>

            {/* Hidden file input — triggered by button clicks only, not label clicks */}
            <input
              id="pdvl-photo-input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
              className="d-none"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) {
                  const fileCopy = picked;
                  // Reset AFTER saving reference so FileReader can read the file
                  setTimeout(() => { e.target.value = ''; }, 300);
                  handleFileUpload(fileCopy);
                }
              }}
            />

            <div
              className={`pdvl-dropzone ${dragActive ? 'drag-active' : ''} ${photo.url ? 'has-photo' : ''} ${fieldErrors.photo ? 'border-danger' : ''}`}
              role="button"
              tabIndex={0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleFileUpload(dropped);
              }}
              onClick={() => {
                if (!photo.uploading) fileInputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !photo.uploading) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              {photo.uploading ? (
                <div className="py-2 text-center">
                  <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />
                  <div className="fw-semibold text-primary small">Reading photo...</div>
                </div>
              ) : photo.url ? (
                <div className="d-flex align-items-center justify-content-between text-start p-1">
                  <div className="d-flex align-items-center gap-3">
                    <div className="position-relative overflow-hidden rounded-3 border bg-white shadow-sm" style={{ width: 64, height: 64 }}>
                      <img src={photo.url} alt="Player preview" className="w-100 h-100 object-fit-cover" />
                    </div>
                    <div>
                      <div className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 mb-1 small fw-bold">
                        ✓ Photo Ready
                      </div>
                      <div className="fw-bold text-dark small text-truncate" style={{ maxWidth: 220 }}>
                        {photo.name}
                      </div>
                      <div className="text-muted text-xs">{photo.size} · Click to change</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="py-2 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="#0b72bc" className="mb-2 opacity-75" viewBox="0 0 16 16">
                    <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z" />
                    <path d="M8 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm0 1a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
                  </svg>
                  <div className="fw-bold text-dark small mb-1">Click or tap to select player photo</div>
                  <div className="text-muted text-xs">JPG, PNG, WEBP · Max 2 MB · Or drag &amp; drop</div>
                </div>
              )}
            </div>
            {fieldErrors.photo && <div className="text-danger small mt-1">{fieldErrors.photo}</div>}
          </div>
        </div>
      )}

      {/* STEP 2: VOLLEYBALL, SPORTS & MEDICAL DETAILS */}
      {step === 2 && (
        <div className="row g-3">
          <div className="col-12 border-bottom pb-2 mb-2">
            <h5 className="fw-bold text-dark mb-1">Step 2: Volleyball & Sports Details</h5>
            <p className="text-muted small mb-0">Specify playing position, physical attributes, experience, and emergency contact details.</p>
          </div>

          {/* Team / Club Name */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold text-secondary small mb-1">
              School/College/Institute Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control pdvl-input ${fieldErrors.teamName ? 'is-invalid' : ''}`}
              placeholder="e.g. Palghar Spikers Club"
              name="teamName"
              value={values.teamName}
              onChange={handleInputChange}
              required
            />
            {fieldErrors.teamName && <div className="invalid-feedback">{fieldErrors.teamName}</div>}
          </div>

          {/* Playing Position */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Playing Position <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select pdvl-select ${fieldErrors.playingPosition ? 'is-invalid' : ''}`}
              name="playingPosition"
              value={values.playingPosition}
              onChange={handleInputChange}
              required
            >
              <option value="">Select playing position</option>
              {POSITIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
            {fieldErrors.playingPosition && <div className="invalid-feedback">{fieldErrors.playingPosition}</div>}
          </div>

          {/* Preferred Hand */}
          <div className="col-6 col-md-3">
            <label className="form-label fw-semibold text-secondary small mb-1">Preferred Hand</label>
            <select className="form-select pdvl-select" name="preferredHand" value={values.preferredHand} onChange={handleInputChange}>
              <option value="right">Right Hand</option>
              <option value="left">Left Hand</option>
            </select>
          </div>

          {/* Height */}
          <div className="col-6 col-md-3">
            <label className="form-label fw-semibold text-secondary small mb-1">Height (cm)</label>
            <input
              type="number"
              className="form-control pdvl-input"
              placeholder="178"
              name="heightCm"
              value={values.heightCm}
              onChange={handleInputChange}
            />
          </div>

          {/* Weight */}
          <div className="col-6 col-md-3">
            <label className="form-label fw-semibold text-secondary small mb-1">Weight (kg)</label>
            <input
              type="number"
              className="form-control pdvl-input"
              placeholder="70"
              name="weightKg"
              value={values.weightKg}
              onChange={handleInputChange}
            />
          </div>

          {/* Playing Experience */}
          <div className="col-6 col-md-3">
            <label className="form-label fw-semibold text-secondary small mb-1">Experience (Years)</label>
            <input
              type="number"
              className="form-control pdvl-input"
              placeholder="3"
              name="playingExperience"
              value={values.playingExperience}
              onChange={handleInputChange}
            />
          </div>

          {/* Previous Club / Team */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold text-secondary small mb-1">Previous Club / Team</label>
            <input
              type="text"
              className="form-control pdvl-input"
              placeholder="Name of previous team if any"
              name="previousClub"
              value={values.previousClub}
              onChange={handleInputChange}
            />
          </div>

          {/* Highest Level Represented */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Highest Level Represented <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select pdvl-select ${fieldErrors.highestLevel ? 'is-invalid' : ''}`}
              name="highestLevel"
              value={values.highestLevel}
              onChange={handleInputChange}
              required
            >
              <option value="">Select highest level represented</option>
              {HIGHEST_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
            {fieldErrors.highestLevel && <div className="invalid-feedback">{fieldErrors.highestLevel}</div>}
          </div>

          {/* Jersey Size Selector */}
          <div className="col-12">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Jersey Size <span className="text-danger">*</span>
            </label>
            <div className="d-flex gap-2" style={{ maxWidth: 420 }}>
              {JERSEY_SIZES.map((size) => {
                const lowerSize = size.toLowerCase();
                const isSelected = values.jerseySize === lowerSize;
                return (
                  <button
                    key={size}
                    type="button"
                    className={`flex-fill pdvl-jersey-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => updateField('jerseySize', lowerSize)}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {fieldErrors.jerseySize && <div className="text-danger small mt-1">{fieldErrors.jerseySize}</div>}
          </div>

          {/* Medical Limitations */}
          <div className="col-12">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Existing Injury / Medical Limitations (if any)
            </label>
            <input
              type="text"
              className="form-control pdvl-input"
              placeholder="State any injury, illness, or medical notes (optional)"
              name="medicalLimitations"
              value={values.medicalLimitations}
              onChange={handleInputChange}
            />
          </div>

          {/* Emergency Contact Information Section */}
          <div className="col-12 border-top pt-3 mt-2">
            <h6 className="fw-bold text-dark mb-2">Emergency Contact Details</h6>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Emergency Contact Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control pdvl-input ${fieldErrors.emergencyContactName ? 'is-invalid' : ''}`}
              placeholder="Full name of contact person"
              name="emergencyContactName"
              value={values.emergencyContactName}
              onChange={handleInputChange}
              required
            />
            {fieldErrors.emergencyContactName && <div className="invalid-feedback">{fieldErrors.emergencyContactName}</div>}
          </div>

          <div className="col-6 col-md-4">
            <label className="form-label fw-semibold text-secondary small mb-1">Relationship</label>
            <input
              type="text"
              className="form-control pdvl-input"
              placeholder="e.g. Father, Mother, Coach"
              name="emergencyRelationship"
              value={values.emergencyRelationship}
              onChange={handleInputChange}
            />
          </div>

          <div className="col-6 col-md-4">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Emergency Phone Number <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0 rounded-start-3 font-monospace small">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength="10"
                className={`form-control pdvl-input border-start-0 rounded-end-3 ${fieldErrors.emergencyPhone ? 'is-invalid' : ''}`}
                placeholder="10-digit phone"
                name="emergencyPhone"
                value={values.emergencyPhone}
                onChange={handleInputChange}
                required
              />
              {fieldErrors.emergencyPhone && <div className="invalid-feedback d-block">{fieldErrors.emergencyPhone}</div>}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: UNDERTAKING & DIGITAL SIGNATURE */}
      {step === 3 && (
        <div className="vstack gap-3">
          <div className="border-bottom pb-2">
            <h5 className="fw-bold text-dark mb-1">Step 3: Player Declaration & Undertaking</h5>
            <p className="text-muted small mb-0">Please read official PDVL 2026/27 terms, medical rules, and confirm your signature.</p>
          </div>

          {/* Official Undertaking Text Card */}
          <div className="p-3 bg-light rounded-3 border small text-secondary">
            <strong className="text-dark d-block mb-1">Palghar District Volleyball League 2026/27 Rules & Code of Conduct:</strong>
            <p className="mb-2 leading-relaxed" style={{ fontSize: '0.85rem' }}>
              I hereby declare and undertake that the information provided by me in this Player Registration Form is true, correct and complete to the best of my knowledge. I agree to participate in accordance with official league rules, respect match officials, opponents and spectators, wear official team jerseys, and accept management decisions.
            </p>
            <strong className="text-dark d-block mb-1">Medical Treatment Undertaking:</strong>
            <p className="mb-0 leading-relaxed" style={{ fontSize: '0.85rem' }}>
              PDVL Committee will provide basic first aid during matches. Further medical treatment and related expenses are my or my parent/guardian&apos;s responsibility unless agreed otherwise in writing.
            </p>
          </div>

          {/* Declaration Checkboxes */}
          <div className={`p-3 rounded-3 border transition-all ${values.undertakingAccepted ? 'border-primary bg-primary-subtle' : 'bg-white'}`}>
            <label className="form-check m-0 cursor-pointer d-flex gap-2">
              <input
                type="checkbox"
                className="form-check-input flex-shrink-0 mt-1"
                name="undertakingAccepted"
                checked={values.undertakingAccepted}
                onChange={handleInputChange}
              />
              <span className="form-check-label small fw-semibold text-dark">
                I have read, understood, and accept the official PDVL player undertaking and code of conduct. <span className="text-danger">*</span>
              </span>
            </label>
            {fieldErrors.undertakingAccepted && <div className="text-danger small mt-1 ps-4">{fieldErrors.undertakingAccepted}</div>}
          </div>

          <div className={`p-3 rounded-3 border transition-all ${values.medicalConsent ? 'border-primary bg-primary-subtle' : 'bg-white'}`}>
            <label className="form-check m-0 cursor-pointer d-flex gap-2">
              <input
                type="checkbox"
                className="form-check-input flex-shrink-0 mt-1"
                name="medicalConsent"
                checked={values.medicalConsent}
                onChange={handleInputChange}
              />
              <span className="form-check-label small fw-semibold text-dark">
                I consent to basic first aid on-site and acknowledge medical treatment responsibilities. <span className="text-danger">*</span>
              </span>
            </label>
            {fieldErrors.medicalConsent && <div className="text-danger small mt-1 ps-4">{fieldErrors.medicalConsent}</div>}
          </div>

          {/* Typed Digital Signature */}
          <div className="mt-2">
            <label className="form-label fw-semibold text-secondary small mb-1">
              Type Your Full Name as Digital Signature <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control pdvl-input ${fieldErrors.typedSignature ? 'is-invalid' : ''}`}
              placeholder="e.g. Rahul Ramesh Sharma"
              name="typedSignature"
              value={values.typedSignature}
              onChange={handleInputChange}
              required
            />
            {fieldErrors.typedSignature && <div className="invalid-feedback">{fieldErrors.typedSignature}</div>}

            {/* Cursive Font Signature Preview */}
            {values.typedSignature.trim() && (
              <div className="mt-3 p-3 bg-light rounded-3 border">
                <span className="text-muted text-xs d-block mb-1">Digital Signature Preview:</span>
                <div className="pdvl-signature-preview">{values.typedSignature}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: PREVIEW & EDIT STEP (BEFORE FINAL SUBMISSION) */}
      {step === 4 && (
        <div className="vstack gap-4">
          <div className="border-bottom pb-2">
            <div className="badge bg-warning text-dark font-monospace mb-1">PRE-SUBMISSION REVIEW</div>
            <h5 className="fw-bold text-dark mb-1">Preview & Verify Registration Details</h5>
            <p className="text-muted small mb-0">Please carefully review all details below. Click &quot;Edit&quot; on any section to make changes before submitting.</p>
          </div>

          {/* Section 1 Preview */}
          <div className="card border rounded-3 p-3 bg-light position-relative">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
              <h6 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                <span>1. Personal & Contact Details</span>
              </h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold text-xs"
                onClick={() => jumpToStep(1)}
              >
                ✏️ Edit Section
              </button>
            </div>

            <div className="row g-3 small">
              <div className="col-12 col-md-3 text-center text-md-start">
                {photo.url ? (
                  <img src={photo.url} alt="Uploaded player photo" className="rounded-3 border shadow-sm object-fit-cover" style={{ width: 90, height: 90 }} />
                ) : (
                  <div className="badge bg-danger">Photo missing</div>
                )}
              </div>
              <div className="col-12 col-md-9">
                <div className="row g-2">
                  <div className="col-6">
                    <span className="text-muted d-block text-xs">Player Full Name</span>
                    <strong className="text-dark">{values.fullName}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block text-xs">Guardian Name</span>
                    <strong className="text-dark">{values.guardianName || '—'}</strong>
                  </div>
                  <div className="col-4">
                    <span className="text-muted d-block text-xs">Date of Birth</span>
                    <strong className="text-dark">{values.dateOfBirth} ({calculatedAge} yrs)</strong>
                  </div>
                  <div className="col-4">
                    <span className="text-muted d-block text-xs">Gender</span>
                    <strong className="text-dark text-capitalize">{values.gender}</strong>
                  </div>
                  <div className="col-4">
                    <span className="text-muted d-block text-xs">Category</span>
                    <strong className="text-dark text-capitalize">{values.playerCategory.replace('_', ' ')}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block text-xs">Mobile Number</span>
                    <strong className="text-dark">{values.mobileNo}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block text-xs">Email Address</span>
                    <strong className="text-dark">{values.email}</strong>
                  </div>
                  <div className="col-12">
                    <span className="text-muted d-block text-xs">Address</span>
                    <strong className="text-dark">{values.address}, {values.district} {values.pinCode && `- ${values.pinCode}`}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 Preview */}
          <div className="card border rounded-3 p-3 bg-light position-relative">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
              <h6 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                <span>2. Volleyball & Sports Details</span>
              </h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold text-xs"
                onClick={() => jumpToStep(2)}
              >
                ✏️ Edit Section
              </button>
            </div>

            <div className="row g-2 small">
              <div className="col-6 col-md-4">
                <span className="text-muted d-block text-xs">Team / Club</span>
                <strong className="text-dark">{values.teamName}</strong>
              </div>
              <div className="col-6 col-md-4">
                <span className="text-muted d-block text-xs">Position</span>
                <strong className="text-dark text-capitalize">{values.playingPosition.replace('_', ' ')}</strong>
              </div>
              <div className="col-4 col-md-4">
                <span className="text-muted d-block text-xs">Jersey Size</span>
                <strong className="text-dark">{values.jerseySize.toUpperCase()}</strong>
              </div>
              <div className="col-4 col-md-4">
                <span className="text-muted d-block text-xs">Hand</span>
                <strong className="text-dark text-capitalize">{values.preferredHand} Hand</strong>
              </div>
              <div className="col-4 col-md-4">
                <span className="text-muted d-block text-xs">Height & Weight</span>
                <strong className="text-dark">{values.heightCm ? `${values.heightCm} cm` : '—'} / {values.weightKg ? `${values.weightKg} kg` : '—'}</strong>
              </div>
              <div className="col-4 col-md-4">
                <span className="text-muted d-block text-xs">Experience</span>
                <strong className="text-dark">{values.playingExperience ? `${values.playingExperience} years` : '—'}</strong>
              </div>
              <div className="col-6 col-md-6">
                <span className="text-muted d-block text-xs">Highest Level</span>
                <strong className="text-dark">
                  {HIGHEST_LEVELS.find((level) => level.value === values.highestLevel)?.label || '—'}
                </strong>
              </div>
              <div className="col-6 col-md-6">
                <span className="text-muted d-block text-xs">Emergency Contact</span>
                <strong className="text-dark">{values.emergencyContactName || 'Guardian'} ({values.emergencyPhone})</strong>
              </div>
            </div>
          </div>

          {/* Section 3 Preview */}
          <div className="card border rounded-3 p-3 bg-light position-relative">
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
              <h6 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                <span>3. Declarations & Digital Signature</span>
              </h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold text-xs"
                onClick={() => jumpToStep(3)}
              >
                ✏️ Edit Section
              </button>
            </div>

            <div className="row g-2 small">
              <div className="col-12">
                <span className="text-success fw-bold">✓ Undertaking Accepted & Medical Consent Confirmed</span>
              </div>
              <div className="col-12 mt-2">
                <span className="text-muted d-block text-xs">Typed Signature:</span>
                <div className="pdvl-signature-preview mt-1" style={{ fontSize: '1.4rem' }}>
                  {values.typedSignature}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="d-flex align-items-center justify-content-between mt-4 pt-3 border-top">
        <button
          type="button"
          className="btn btn-outline-secondary rounded-3 px-4 py-2 fw-semibold"
          onClick={goToPrevStep}
          disabled={step === 1 || submitting}
        >
          Back
        </button>

        {step < 4 ? (
          <button
            type="button"
            className="btn btn-primary rounded-3 px-4 py-2 fw-bold d-inline-flex align-items-center gap-2"
            onClick={goToNextStep}
          >
            <span>{step === 3 ? 'Preview Form' : 'Continue'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-success rounded-3 px-5 py-2 fw-bold fs-6 d-inline-flex align-items-center gap-2 shadow-sm"
            disabled={submitting || previewCountdown > 0}
          >
            {submitting ? (
              <>
                <div className="spinner-border spinner-border-sm text-white" role="status" />
                <span>Submitting Registration...</span>
              </>
            ) : (
              <>
                <span>{previewCountdown > 0 ? `Review details (${previewCountdown}s)` : 'Confirm & Submit Registration'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15.854 1.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L8.5 8.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}