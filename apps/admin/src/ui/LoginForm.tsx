import { useState } from 'react';

interface Props {
  mockMode?: boolean;
  infoMessage?: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
}

export function LoginForm({ mockMode = false, infoMessage, onLogin, onForgotPassword }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">BONAE Content Admin</h1>
        <p className="text-sm text-slate-600">
          {mockMode
            ? 'Local mock mode: any email and password work.'
            : 'Sign in with your administrator account.'}
        </p>
        {infoMessage && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{infoMessage}</p>
        )}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        {!mockMode && onForgotPassword && (
          <p className="text-center text-sm">
            <button type="button" className="text-dark-blue underline" onClick={onForgotPassword}>
              Forgot password?
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
