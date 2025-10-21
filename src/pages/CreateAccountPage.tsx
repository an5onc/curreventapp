import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../api';

export interface CreateAccountValues {
  email: string;
  password: string;
}
export interface CreateAccountProps {
  onSuccess?: (values: CreateAccountValues) => void;
  onCancel?: () => void;
  className?: string;
}

const ALLOWED_DOMAINS = ['bears.unco.edu', 'unco.edu'];

const sendVerification = async (email: string, password: string) => {
  const accountType = email.includes('bears') ? 'Student' : 'Faculty';
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, accountType }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Failed to send verification email.');
  return data;
};

const CreateAccountForm: React.FC<CreateAccountProps> = ({ onSuccess, onCancel, className = '' }) => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if ((location.state as any)?.freshSignup) {
      setEmail(''); setPassword(''); setConfirm('');
    }
  }, [location.state]);

  const pwRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPwValid = Object.values(pwRules).every(Boolean);

  const validate = (): string | null => {
    let formErr: string | null = null;
    if (!email.trim()) { setEmailErr('Email is required.'); formErr = formErr || 'Fix errors and try again.'; }
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setEmailErr('Enter a valid email address.'); formErr = formErr || 'Fix errors and try again.'; }
    else {
      const domain = email.trim().split('@')[1]?.toLowerCase();
      if (!ALLOWED_DOMAINS.includes(domain)) { setEmailErr('Use your official UNCO Bear email (…@bears.unco.edu).'); formErr = formErr || 'Fix errors and try again.'; }
      else setEmailErr(null);
    }
    if (!isPwValid) { setPasswordErr('Password does not meet requirements.'); formErr = formErr || 'Fix errors and try again.'; }
    else setPasswordErr(null);
    if (confirm !== password) { formErr = formErr || 'Fix errors and try again.'; }
    return formErr;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // prevent double submit
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError(null);
    setSubmitting(true);
    try {
      const resp = await sendVerification(email.trim(), password);
      if (resp?.dev_code) setCode(resp.dev_code);
      setVerificationSent(true);
      setPassword(''); setConfirm('');
      onSuccess?.({ email: email.trim(), password: '' });
    } catch (e: any) {
      setError(e.message || 'Could not send verification email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (sendingVerification) return; // prevent multiple sends
    setError(null);
    setSendingVerification(true);
    try {
      const resp = await sendVerification(email.trim(), password);
      if (resp?.dev_code) setCode(resp.dev_code);
      setVerificationSent(true);
      setPassword(''); setConfirm('');
    } catch (e: any) {
      setError(e.message || 'Could not send verification email. Please try again.');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleVerify = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid verification code.');
      setVerified(true);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    }
  };

  // ---------- Render ----------

  if (verificationSent && !verified) {
    return (
      <div className={`max-w-md ${className}`}>
        <h1 className="text-2xl font-semibold mb-4 text-[#001F3D]">Verify your email</h1>
        <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-green-700">
          A verification email has been sent to <strong>{email.trim()}</strong>. Enter your 6-digit code.
        </div>
        <div className="mb-4">
          <label htmlFor="code" className="block text-sm font-medium mb-1 text-[#1C1C1C]">Verification Code</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded border border-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC300] focus:border-[#FFC300]"
            placeholder="6-digit code"
          />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={handleVerify}
            className="px-4 py-2 rounded-md bg-[#FFC300] text-[#001F3D] hover:bg-[#FFD633] focus:outline-none focus:ring-2 focus:ring-[#FFC300]"
          >
            Verify
          </button>
          <button
            type="button"
            onClick={onResend}
            disabled={sendingVerification}
            className="px-4 py-2 rounded-md border border-gray-500 text-[#001F3D] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFC300]"
          >
            {sendingVerification ? 'Resending…' : 'Resend Email'}
          </button>
        </div>
        {error && <div className="mb-4 rounded border border-[#FFC300]/60 bg-[#FFF3CC] p-3 text-[#001F3D]">{error}</div>}
      </div>
    );
  }

  if (verified) {
    return (
      <div className={`max-w-md ${className}`}>
        <h1 className="text-2xl font-semibold mb-2 text-green-700">Email Verified</h1>
        <p className="text-sm text-gray-700 mb-3">You can now sign in.</p>
        <Link to="/login" className="text-blue-600 underline">Go to Sign In</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`max-w-md ${className}`} noValidate autoComplete="off">
      {error && <div className="mb-4 rounded border border-[#FFC300]/60 bg-[#FFF3CC] p-3 text-[#001F3D]">{error}</div>}

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium mb-1 text-[#1C1C1C]">Email</label>
        <input
          id="email" type="email" autoComplete="off"
          className="w-full rounded border border-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC300] focus:border-[#FFC300]"
          placeholder="you@bears.unco.edu or you@unco.edu"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailErr(null); }}
          required
        />
        {emailErr && <p className="mt-1 text-xs text-red-700">{emailErr}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="block text-sm font-medium mb-1 text-[#1C1C1C]">Password</label>
        <div className="relative">
          <input
            id="password" type={showPwd ? 'text' : 'password'} autoComplete="new-password"
            className="w-full rounded border border-gray-400 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#FFC300] focus:border-[#FFC300]"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordErr(null); }}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-700 hover:underline"
            onClick={() => setShowPwd(v => !v)}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? 'Hide' : 'Show'}
          </button>
        </div>
        <ul className="mt-2 text-xs space-y-1">
          <li className={pwRules.length ? 'text-green-700' : 'text-gray-700'}>• At least 8 characters</li>
          <li className={pwRules.upper ? 'text-green-700' : 'text-gray-700'}>• One uppercase letter</li>
          <li className={pwRules.lower ? 'text-green-700' : 'text-gray-700'}>• One lowercase letter</li>
          <li className={pwRules.digit ? 'text-green-700' : 'text-gray-700'}>• One number</li>
          <li className={pwRules.special ? 'text-green-700' : 'text-gray-700'}>• One symbol (!@#$…)</li>
        </ul>
        {passwordErr && <p className="mt-1 text-xs text-red-700">{passwordErr}</p>}
      </div>

      <div className="mb-6">
        <label htmlFor="confirm" className="block text-sm font-medium mb-1 text-[#1C1C1C]">Confirm password</label>
        <input
          id="confirm" type={showPwd ? 'text' : 'password'} autoComplete="new-password"
          className="w-full rounded border border-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC300] focus:border-[#FFC300]"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {confirm !== password && confirm && <p className="mt-1 text-xs text-red-700">Passwords do not match.</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium ${isPwValid && !emailErr && confirm === password && email.trim() ? 'bg-[#FFC300] text-[#001F3D] hover:bg-[#FFD633]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          disabled={submitting || sendingVerification || !isPwValid || !!emailErr || confirm !== password || !email.trim()}
        >
          {submitting ? 'Creating…' : 'Create account'}
        </button>
        {onCancel && (
          <button type="button" className="px-4 py-2 rounded-md border border-gray-400 text-[#001F3D] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFC300]" onClick={onCancel}>Cancel</button>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-700">
        By creating an account you agree to the{' '}
        <a className="font-semibold text-[#001F3D] underline ml-1" href="https://www.unco.edu/student-affairs/policy/" target="_blank" rel="noopener noreferrer">
          UNC Guidelines & Policies
        </a>{' '}
        and{' '}
        <a className="font-semibold text-[#001F3D] underline ml-1" href="https://www.unco.edu/trustees/board-policy-manual.aspx" target="_blank" rel="noopener noreferrer">
          UNC Board Policy Manual
        </a>. You also agree to receive emails related to your account and events.
      </p>
    </form>
  );
};

const CreateAccountPage: React.FC = () => (
  <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#ffffff] via-[#9eb9d5] to-[#CBD6E0]/10 pt-16 pb-12">
    <div className="mx-auto max-w-xl px-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
        <h1 className="text-3xl font-bold text-[#001F3D] mb-2">Create Account</h1>
        <p className="text-sm text-gray-700 mb-4">Use your Bear email to sign up.</p>
        <CreateAccountForm />
      </div>
    </div>
  </section>
);

export default CreateAccountPage;
