import { useState } from 'react';

interface Props {
  onSubmit: (email: string) => Promise<void>;
  onBack: () => void;
  onContinue: (email: string) => void;
}

export function ForgotPasswordForm({ onSubmit, onBack, onContinue }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
        {sent ? (
          <>
            <p className="text-sm text-slate-600">
              If an account exists for that email, a verification code has been sent. Check your inbox and enter the code on the next screen.
            </p>
            <button type="button" className="btn-primary w-full" onClick={() => onContinue(email)}>
              Enter verification code
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              Enter your administrator email. We will send a verification code if an account exists.
            </p>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div>
              <label className="field-label" htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send code'}
            </button>
            <button type="button" className="btn-secondary w-full" onClick={onBack}>
              Back to sign in
            </button>
          </>
        )}
      </form>
    </div>
  );
}
