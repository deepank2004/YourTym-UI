import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getProfile, updateProfile } from '../services/api/profileService.js';
import { getUserToken } from '../services/api/tokenStorage.js';

const EMPTY_PROFILE = {
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  dob: '',
  address1: '',
  address2: '',
  image: '',
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

export function ProfilePage({ go }) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const saveInFlight = useRef(false);

  const loadProfile = async () => {
    if (!getUserToken()) {
      setFeedback({ type: 'error', message: 'Please sign in to view your profile.' });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await getProfile();
      const nextProfile = result.profile || EMPTY_PROFILE;
      setProfile(nextProfile);
      setHasProfile(Object.values(nextProfile).some(Boolean));
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Unable to load your profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saveInFlight.current) return;

    const nextProfile = {
      ...profile,
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      phone: normalizePhone(profile.phone),
      gender: profile.gender.trim(),
      dob: profile.dob.trim(),
      address1: profile.address1.trim(),
      address2: profile.address2.trim(),
    };

    if (!nextProfile.fullName) {
      setFeedback({ type: 'error', message: 'Full name is required.' });
      return;
    }

    if (!isValidEmail(nextProfile.email)) {
      setFeedback({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }

    if (!/^\d{10}$/.test(nextProfile.phone)) {
      setFeedback({ type: 'error', message: 'Enter a valid 10-digit phone number.' });
      return;
    }

    if (!nextProfile.gender) {
      setFeedback({ type: 'error', message: 'Gender is required.' });
      return;
    }

    saveInFlight.current = true;
    setSaving(true);
    setFeedback(null);

    try {
      const result = await updateProfile({ profile: nextProfile, imageFile });
      setProfile(result.profile || nextProfile);
      setImageFile(null);
      setHasProfile(true);
      setFeedback({ type: 'success', message: result.message });
      await loadProfile();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Unable to update your profile.',
      });
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="animate-in">
      <button className="back-button" onClick={() => go('/')}>
        <ArrowLeft size={18} /> Back
      </button>
      <section className="section">
        <div className="panel">
          <p className="eyebrow">YourTym account</p>
          <h1 className="section-title">Profile</h1>

          {feedback && (
            <p
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}
            >
              {feedback.message}
            </p>
          )}

          {loading ? (
            <p>Loading profile...</p>
          ) : (
            <>
              {!hasProfile && !feedback && <p>No profile information is available yet.</p>}
              <form className="form-grid" onSubmit={handleSave}>
                <label>
                  Full name
                  <input value={profile.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
                </label>
                <label>
                  Email
                  <input type="email" value={profile.email} onChange={(event) => updateField('email', event.target.value)} />
                </label>
                <label>
                  Phone number
                  <input type="tel" value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} />
                </label>
                <label>
                  Gender
                  <input value={profile.gender} onChange={(event) => updateField('gender', event.target.value)} />
                </label>
                <label>
                  Date of birth
                  <input placeholder="DD/MM/YYYY" value={profile.dob} onChange={(event) => updateField('dob', event.target.value)} />
                </label>
                <label>
                  Address line 1
                  <input value={profile.address1} onChange={(event) => updateField('address1', event.target.value)} />
                </label>
                <label>
                  Address line 2
                  <input value={profile.address2} onChange={(event) => updateField('address2', event.target.value)} />
                </label>
                <label>
                  Profile image
                  <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
                </label>
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? 'Saving profile...' : 'Save profile'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
