import { useState } from 'react';
import { validatePassword } from '../infrastructure/passwordPolicy.js';

interface Props {
  email: string;
  onSubmit: (email: string, code: string, newPassword: string) => Promise<void>;
  onBack: () => void;
}

export function ResetPasswordForm({ email: initialEmail, onSubmit, onBack }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const policyError = validatePassword(password);
    if (policyError) {
      setError(policyError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(email, code, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
        <p className="text-sm text-slate-600">
          Enter the verification code from your email and a new password (12+ characters with upper, lower, and number).
        </p>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div>
          <label className="field-label" htmlFor="reset-email-confirm">Email</label>
          <input
            id="reset-email-confirm"
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="verification-code">Verification code</label>
          <input
            id="verification-code"
            type="text"
            className="field-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoComplete="one-time-code"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            type="password"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="reset-password-confirm">Confirm password</label>
          <input
            id="reset-password-confirm"
            type="password"
            className="field-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Reset password'}
        </button>
        <button type="button" className="btn-secondary w-full" onClick={onBack}>
          Back to sign in
        </button>
      </form>
    </div>
  );
}
