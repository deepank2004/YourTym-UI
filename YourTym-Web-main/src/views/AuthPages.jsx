import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from '../components/CommonComponents.jsx';
import { loginWithPhone, registerUser, resendOtp, verifyOtp } from '../services/api/authService.js';
import {
  clearPendingLogin,
  getDeviceToken,
  getPendingLogin,
  savePendingLogin,
} from '../services/api/authFlowStorage.js';
import { getUserToken, setUserToken } from '../services/api/tokenStorage.js';

function BackButton() {
  return (
    <button className="back-button" onClick={() => window.history.back()}>
      <ArrowLeft size={18} /> Back
    </button>
  );
}

function normalizePhoneNumber(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

export function LoginPage({ go, step = 'phone' }) {
  const isOtpStep = step === 'otp';
  const isSignupStep = step === 'signup';
  const isPhoneStep = !isOtpStep && !isSignupStep;
  const pendingLogin = getPendingLogin();
  const [phone, setPhone] = useState(() =>
    isOtpStep && pendingLogin.phone ? `+91 ${pendingLogin.phone}` : '+91 '
  );
  const [feedback, setFeedback] = useState(() =>
    isOtpStep && pendingLogin.message
      ? { type: 'success', message: pendingLogin.message }
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [profileName, setProfileName] = useState('');
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    gender: '',
    refferalCode: '',
  });
  const requestInFlight = useRef(false);
  const resendInFlight = useRef(false);
  const registrationInFlight = useRef(false);

  useEffect(() => {
    if (isPhoneStep) {
      clearPendingLogin();
      return;
    }

    if (isOtpStep && !getPendingLogin().phone) {
      go('/login');
      return;
    }

    if (isSignupStep && !getUserToken()) {
      go('/login');
    }
  }, [go, isOtpStep, isPhoneStep, isSignupStep]);

  useEffect(() => {
    if (!isOtpStep || resendSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOtpStep, resendSeconds]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isOtpStep || requestInFlight.current) return;

    const enteredDigits = phone.replace(/\D/g, '');
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!enteredDigits || enteredDigits === '91') {
      setFeedback({ type: 'error', message: 'Phone number is required.' });
      return;
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      setFeedback({ type: 'error', message: 'Enter a valid 10-digit phone number.' });
      return;
    }

    requestInFlight.current = true;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await loginWithPhone(normalizedPhone);

      savePendingLogin({
        phone: normalizedPhone,
        loginId: result.loginId,
        message: result.message,
      });
      setFeedback({ type: 'success', message: result.message });
      go('/otp');
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Unable to send OTP. Please try again.',
      });
    } finally {
      requestInFlight.current = false;
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!isOtpStep || requestInFlight.current || resendInFlight.current) return;

    const pending = getPendingLogin();
    const normalizedOtp = otp.trim();

    if (!normalizedOtp) {
      setFeedback({ type: 'error', message: 'OTP is required.' });
      return;
    }

    if (!/^\d{4}$/.test(normalizedOtp)) {
      setFeedback({ type: 'error', message: 'Enter the 4-digit OTP.' });
      return;
    }

    if (!pending.loginId) {
      setFeedback({ type: 'error', message: 'Your OTP session is missing. Please request a new OTP.' });
      return;
    }

    requestInFlight.current = true;
    setIsVerifying(true);
    setFeedback(null);

    try {
      const result = await verifyOtp({
        loginId: pending.loginId,
        otp: normalizedOtp,
        deviceToken: getDeviceToken(),
      });

      setUserToken(result.token);
      clearPendingLogin();
      go('/signup');
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'OTP verification failed. Please try again.',
      });
    } finally {
      requestInFlight.current = false;
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!isOtpStep || requestInFlight.current || resendInFlight.current || resendSeconds > 0) return;

    const pending = getPendingLogin();

    if (!pending.loginId) {
      setFeedback({ type: 'error', message: 'Your OTP session is missing. Please request a new OTP.' });
      return;
    }

    resendInFlight.current = true;
    setIsResending(true);
    setFeedback(null);

    try {
      const result = await resendOtp(pending.loginId);
      savePendingLogin({ ...pending, message: result.message });
      setFeedback({ type: 'success', message: result.message });
      setResendSeconds(30);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Unable to resend OTP. Please try again.',
      });
    } finally {
      resendInFlight.current = false;
      setIsResending(false);
    }
  };

  const handleRegistration = async (event) => {
    event.preventDefault();

    if (!isSignupStep || registrationInFlight.current) return;

    const fullName = signupForm.fullName.trim();
    const email = signupForm.email.trim();
    const gender = signupForm.gender.trim();
    const refferalCode = signupForm.refferalCode.trim();

    if (!fullName) {
      setFeedback({ type: 'error', message: 'Full name is required.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFeedback({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }

    if (!gender) {
      setFeedback({ type: 'error', message: 'Gender is required.' });
      return;
    }

    registrationInFlight.current = true;
    setIsRegistering(true);
    setFeedback(null);

    try {
      const result = await registerUser({
        fullName,
        email,
        gender,
        refferalCode,
      });

      if (result.token) setUserToken(result.token);
      clearPendingLogin();
      const destination = sessionStorage.getItem('authReturnPath') || '/';
      sessionStorage.removeItem('authReturnPath');
      go(destination);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error?.message || 'Registration failed. Please try again.',
      });
    } finally {
      registrationInFlight.current = false;
      setIsRegistering(false);
    }
  };

  const updateSignupField = (field, value) => {
    setSignupForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="animate-in">
      <BackButton />
      <section className="auth-section">
        <div className="auth-card">
          <Logo />
          <h1>{isSignupStep ? 'Complete your profile' : 'Login / Signup'}</h1>
          <p>
            {isSignupStep
              ? 'Add your details to finish creating your YourTym account.'
              : 'Continue with your phone number and verify with OTP.'}
          </p>
          {feedback && (
            <p
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}
            >
              {feedback.message}
            </p>
          )}
          <form
            onSubmit={
              isSignupStep ? handleRegistration : isOtpStep ? handleVerifyOtp : handleSubmit
            }
          >
            {isSignupStep ? (
              <>
                <label>
                  Full name
                  <input
                    name="fullName"
                    autoComplete="name"
                    value={signupForm.fullName}
                    onChange={(event) => updateSignupField('fullName', event.target.value)}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={signupForm.email}
                    onChange={(event) => updateSignupField('email', event.target.value)}
                  />
                </label>
                <label>
                  Gender
                  <input
                    name="gender"
                    value={signupForm.gender}
                    onChange={(event) => updateSignupField('gender', event.target.value)}
                  />
                </label>
                <label>
                  Referral code
                  <input
                    name="refferalCode"
                    value={signupForm.refferalCode}
                    onChange={(event) => updateSignupField('refferalCode', event.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Phone number
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    readOnly={isOtpStep}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </label>
                <label>
                  OTP verification
                  <input
                    name="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 4 digit OTP"
                    disabled={!isOtpStep}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                  />
                </label>
                <label>
                  Profile name
                  <input
                    name="profileName"
                    placeholder="Your name"
                    disabled={!isOtpStep}
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                  />
                </label>
              </>
            )}
            <button
              type="submit"
              className="primary-button w-full justify-center"
              disabled={
                isSignupStep
                  ? isRegistering
                  : isOtpStep
                    ? isVerifying || isResending
                    : isSubmitting
              }
              aria-busy={isSubmitting || isVerifying || isRegistering}
            >
              {isSignupStep
                ? isRegistering
                  ? 'Creating account...'
                  : 'Create account'
                : isOtpStep
                ? isVerifying
                  ? 'Verifying OTP...'
                  : 'Verify OTP'
                : isSubmitting
                  ? 'Sending OTP...'
                  : 'Continue'}
            </button>
            {isOtpStep && (
              <button
                type="button"
                className="outline-button mt-3 w-full justify-center"
                onClick={handleResendOtp}
                disabled={isResending || isVerifying || resendSeconds > 0}
              >
                {isResending
                  ? 'Resending OTP...'
                  : resendSeconds > 0
                    ? `Resend OTP in ${resendSeconds}s`
                    : 'Resend OTP'}
              </button>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

export function SuccessPage({ go }) {
    const orderId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('lastOrderId') : '';
  return (
    <div className="animate-in">
      <section className="success">
        <div>
          <Check size={42} />
          <h1>Booking Confirmed</h1>
            <p>YourTym professional details and slot confirmation have been sent to your phone.</p>
            {orderId && <p>Order ID: {orderId}</p>}
          <button className="primary-button" onClick={() => go('/booking-history')}>
            View Booking History
          </button>
        </div>
      </section>
    </div>
  );
}
