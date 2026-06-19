import { useCallback, useEffect, useRef, useState } from 'react';
import { config, isConfigured } from './config.js';
import { getCurrentSession, getSessionExpiresAt, signIn, signOut } from './infrastructure/auth.js';
import { registerSessionExpiredHandler } from './infrastructure/contentApi.js';
import { ConfigMissing } from './ui/ConfigMissing.js';
import { LoginForm } from './ui/LoginForm.js';
import { Dashboard } from './ui/Dashboard.js';

export default function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [newPasswordChallenge, setNewPasswordChallenge] = useState<((pw: string) => Promise<void>) | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    void signOut();
    setAuthenticated(false);
  }, []);

  const scheduleLogoutAt = useCallback(
    async (expiresAt: number | null) => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
      if (!expiresAt) return;

      const delay = Math.max(0, expiresAt - Date.now() - 30_000);
      logoutTimerRef.current = setTimeout(() => {
        handleLogout();
      }, delay);
    },
    [handleLogout],
  );

  const checkSession = useCallback(async () => {
    const session = await getCurrentSession();
    if (!session?.isValid()) {
      handleLogout();
      return;
    }
    const expiresAt = await getSessionExpiresAt();
    if (!expiresAt) {
      handleLogout();
      return;
    }
    setAuthenticated(true);
    await scheduleLogoutAt(expiresAt);
  }, [handleLogout, scheduleLogoutAt]);

  useEffect(() => {
    registerSessionExpiredHandler(handleLogout);
  }, [handleLogout]);

  useEffect(() => {
    if (!isConfigured()) {
      setReady(true);
      return;
    }

    checkSession().finally(() => setReady(true));
  }, [checkSession]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && authenticated) {
        void checkSession();
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [authenticated, checkSession]);

  if (!isConfigured()) {
    return <ConfigMissing />;
  }

  if (!ready) {
    return <div className="p-8 text-center text-slate-600">Loading…</div>;
  }

  if (newPasswordChallenge) {
    return (
      <>
        {config.useMock && <MockModeBanner />}
        <SetNewPasswordForm
          onSubmit={async (newPassword) => {
            await newPasswordChallenge(newPassword);
            setNewPasswordChallenge(null);
            setAuthenticated(true);
            const expiresAt = await getSessionExpiresAt();
            await scheduleLogoutAt(expiresAt);
          }}
        />
      </>
    );
  }

  if (!authenticated) {
    return (
      <>
        {config.useMock && <MockModeBanner />}
        <LoginForm
          mockMode={config.useMock}
          onLogin={async (email, password) => {
            const result = await signIn(email, password);
            if (result.type === 'success') {
              setAuthenticated(true);
              const expiresAt = await getSessionExpiresAt();
              await scheduleLogoutAt(expiresAt);
            } else {
              setNewPasswordChallenge(() => result.completeChallenge);
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      {config.useMock && <MockModeBanner />}
      <Dashboard onLogout={handleLogout} />
    </>
  );
}

function MockModeBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      Local mock mode — drafts and publish write to <code>apps/static/content/</code> on disk. No AWS or GitHub.
    </div>
  );
}

function SetNewPasswordForm({ onSubmit }: { onSubmit: (newPassword: string) => Promise<void> }) {
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
    setLoading(true);
    setError(null);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
        <p className="text-sm text-slate-600">Your temporary password has expired. Please choose a permanent password.</p>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div>
          <label className="field-label" htmlFor="new-password">New password</label>
          <input id="new-password" type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="field-label" htmlFor="confirm-password">Confirm password</label>
          <input id="confirm-password" type="password" className="field-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Set password'}
        </button>
      </form>
    </div>
  );
}
