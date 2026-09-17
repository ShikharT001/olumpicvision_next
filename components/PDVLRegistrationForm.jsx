'use client';

import { useState } from 'react';

const initialValues = {
  fullName: '', dateOfBirth: '', gender: '', mobileNo: '', email: '',
  address: '', district: 'Palghar', teamName: '', playingPosition: '',
  jerseySize: '', emergencyPhone: '',
  typedSignature: '', undertakingAccepted: false, medicalConsent: false,
};

const positions = ['Setter', 'Outside Hitter', 'Opposite Hitter', 'Middle Blocker', 'Libero', 'Defensive Specialist', 'Other'];

export default function PDVLRegistrationForm() {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const [photo, setPhoto] = useState({ url: '', uploading: false, name: '' });

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };
  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) return setError('Player photo must be JPG, PNG, or WEBP.');
    if (file.size > 200 * 1024) return setError('Player photo must be 200 KB or smaller.');
    setError('');
    setPhoto({ url: '', uploading: true, name: file.name });
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('label', 'pdvl-player-photo');
      const response = await fetch('/api/upload-document', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Photo upload failed.');
      setPhoto({ url: data.url, uploading: false, name: file.name });
    } catch (uploadError) {
      setPhoto({ url: '', uploading: false, name: '' });
      setError(uploadError.message);
    }
  };

  const validateStep = () => {
    const required = step === 1
      ? ['fullName', 'dateOfBirth', 'gender', 'mobileNo', 'email', 'address']
      : step === 2
        ? ['teamName', 'playingPosition', 'jerseySize', 'emergencyPhone']
        : ['typedSignature'];
    const missing = required.some((key) => !String(values[key]).trim());
    if (missing) return 'Please complete all required fields before continuing.';
    if (step === 1 && (!photo.url || photo.uploading)) return photo.uploading ? 'Please wait for the player photo upload to finish.' : 'Please upload a player photo before continuing.';
    if (step === 1 && !/^[6-9]\d{9}$/.test(values.mobileNo)) return 'Enter a valid 10-digit Indian mobile number.';
    if (step === 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Enter a valid email address.';
    if (step === 2 && !/^[6-9]\d{9}$/.test(values.emergencyPhone)) return 'Enter a valid emergency contact number.';
    if (step === 3 && (!values.undertakingAccepted || !values.medicalConsent)) return 'Please accept both declarations to submit your registration.';
    return '';
  };

  const next = () => { const issue = validateStep(); if (issue) setError(issue); else setStep((current) => current + 1); };
  const submit = async (event) => {
    event.preventDefault();
    const issue = validateStep();
    if (issue) return setError(issue);
    setSubmitting(true);
    try {
      const response = await fetch('/api/pdvl-register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, photoUrl: photo.url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit your registration.');
      setRegistrationId(data.id);
    } catch (submissionError) { setError(submissionError.message); } finally { setSubmitting(false); }
  };

  if (registrationId) return <div className="text-center py-5"><div className="display-5 mb-3">✓</div><h2 className="h3 fw-bold">Registration received</h2><p className="text-secondary mb-1">Your PDVL 2026 player undertaking has been submitted.</p><p className="small text-secondary">Reference: {registrationId}</p></div>;

  return <form onSubmit={submit} noValidate>
    <div className="d-flex gap-2 mb-4" aria-label={`Step ${step} of 3`}>
      {[['1', 'Player'], ['2', 'Team & safety'], ['3', 'Undertaking']].map(([number, label]) => <div key={number} className="flex-fill"><div className={`rounded-pill text-center py-2 small fw-bold ${step >= Number(number) ? 'bg-primary text-white' : 'bg-light text-secondary'}`}>{number}. {label}</div></div>)}
    </div>
    {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
    {step === 1 && <div className="row g-3">
      <Field label="Player full name" name="fullName" value={values.fullName} onChange={update} required />
      <Field label="Date of birth" name="dateOfBirth" type="date" value={values.dateOfBirth} onChange={update} required />
      <Select label="Gender" name="gender" value={values.gender} onChange={update} options={['Male', 'Female', 'Other']} required />
      <Field label="Mobile number" name="mobileNo" inputMode="numeric" maxLength="10" value={values.mobileNo} onChange={update} required />
      <Field label="Email address" name="email" type="email" value={values.email} onChange={update} required />
      <Field label="District" name="district" value={values.district} onChange={update} />
      <div className="col-12"><label className="form-label fw-semibold">Residential address *</label><textarea className="form-control" name="address" rows="3" value={values.address} onChange={update} required /></div>
      <div className="col-12"><label className="form-label fw-semibold">Player photo *</label><input className="form-control" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} disabled={photo.uploading} required /><div className="form-text">JPG, PNG or WEBP only · maximum 200 KB.</div>{photo.uploading && <div className="small text-primary mt-1">Uploading photo…</div>}{photo.url && <div className="small text-success mt-1">Photo uploaded: {photo.name}</div>}</div>
    </div>}
    {step === 2 && <div className="row g-3">
      <Field label="Team / club name" name="teamName" value={values.teamName} onChange={update} required />
      <Select label="Playing position" name="playingPosition" value={values.playingPosition} onChange={update} options={positions} required />
      <Select label="Jersey size" name="jerseySize" value={values.jerseySize} onChange={update} options={['S', 'M', 'L', 'XL', 'XXL']} required />
      <Field label="Emergency contact number" name="emergencyPhone" inputMode="numeric" maxLength="10" value={values.emergencyPhone} onChange={update} required />
    </div>}
    {step === 3 && <div className="vstack gap-3">
      <div className="rounded-3 border bg-light p-3 small"><strong>Player undertaking & declaration</strong><p className="mb-0 mt-2">I confirm that my registration information is true and complete. I will follow PDVL 2026/27 league rules, the code of conduct, match officials&apos; and management&apos;s decisions, wear the assigned team jersey and proper sports shoes, and accept applicable disciplinary action. I permit PDVL to use my details for legitimate league administration, fixtures, results, statistics, identification and official communication.</p></div>
      <label className="form-check"><input className="form-check-input" type="checkbox" name="undertakingAccepted" checked={values.undertakingAccepted} onChange={update} /><span className="form-check-label">I have read and accept the player undertaking. *</span></label>
      <label className="form-check"><input className="form-check-input" type="checkbox" name="medicalConsent" checked={values.medicalConsent} onChange={update} /><span className="form-check-label">I consent to basic first aid. I understand further treatment and related expenses are my / my parent or guardian&apos;s responsibility unless PDVL agrees otherwise in writing. *</span></label>
      <Field label="Type your full name as your signature" name="typedSignature" value={values.typedSignature} onChange={update} required full />
    </div>}
    <div className="d-flex justify-content-between mt-4 pt-3 border-top"><button type="button" className="btn btn-outline-secondary" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>Back</button>{step < 3 ? <button type="button" className="btn btn-primary px-4" onClick={next}>Continue</button> : <button type="submit" className="btn btn-success px-4" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit registration'}</button>}</div>
  </form>;
}

function Field({ label, name, value, onChange, type = 'text', required, full, ...props }) { return <div className={full ? 'col-12' : 'col-md-6'}><label className="form-label fw-semibold">{label}{required && ' *'}</label><input className="form-control" type={type} name={name} value={value} onChange={onChange} required={required} {...props} /></div>; }
function Select({ label, name, value, onChange, options, required }) { return <div className="col-md-6"><label className="form-label fw-semibold">{label}{required && ' *'}</label><select className="form-select" name={name} value={value} onChange={onChange} required={required}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option.toLowerCase().replaceAll(' ', '_')}>{option}</option>)}</select></div>; }
