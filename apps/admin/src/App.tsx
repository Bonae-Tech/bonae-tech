import { useCallback, useEffect, useRef, useState } from 'react';
import { config, isConfigured } from './config.js';
import {
  confirmPasswordReset,
  getCurrentSession,
  getSessionExpiresAt,
  refreshSession,
  requestPasswordReset,
  signIn,
  signOut,
  type LogoutReason,
} from './infrastructure/auth.js';
import { registerSessionExpiredHandler, registerSessionRefreshedHandler } from './infrastructure/contentApi.js';
import { validatePassword } from './infrastructure/passwordPolicy.js';
import { ConfigMissing } from './ui/ConfigMissing.js';
import { ForgotPasswordForm } from './ui/ForgotPasswordForm.js';
import { LoginForm } from './ui/LoginForm.js';
import { ResetPasswordForm } from './ui/ResetPasswordForm.js';
import { Dashboard } from './ui/Dashboard.js';

type AuthView = 'login' | 'forgot' | 'reset';

const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión de nuevo.';
const SESSION_REFRESHED_MESSAGE = 'Tu sesión se extendió automáticamente.';
const PASSWORD_RESET_SUCCESS_MESSAGE = 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.';

export default function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [loginInfoMessage, setLoginInfoMessage] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [newPasswordChallenge, setNewPasswordChallenge] = useState<((pw: string) => Promise<void>) | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const handleLogout = useCallback((reason: LogoutReason = 'manual') => {
    clearLogoutTimer();
    void signOut();
    setAuthenticated(false);
    setAuthView('login');
    setSessionMessage(null);
    if (reason === 'expired') {
      setLoginInfoMessage(SESSION_EXPIRED_MESSAGE);
    } else {
      setLoginInfoMessage(null);
    }
  }, [clearLogoutTimer]);

  const scheduleSessionCheckAt = useCallback(
    (expiresAt: number | null) => {
      clearLogoutTimer();
      if (!expiresAt) return;

      const delay = Math.max(0, expiresAt - Date.now());
      logoutTimerRef.current = setTimeout(() => {
        void (async () => {
          const session = await refreshSession();
          if (session) {
            const nextExpiresAt = await getSessionExpiresAt();
            setSessionMessage(SESSION_REFRESHED_MESSAGE);
            await scheduleSessionCheckAt(nextExpiresAt);
            return;
          }
          handleLogout('expired');
        })();
      }, delay);
    },
    [clearLogoutTimer, handleLogout],
  );

  const checkSession = useCallback(async () => {
    const session = await getCurrentSession();
    if (!session?.isValid()) {
      handleLogout('expired');
      return;
    }
    const expiresAt = await getSessionExpiresAt();
    if (!expiresAt) {
      const refreshed = await refreshSession();
      if (!refreshed) {
        handleLogout('expired');
        return;
      }
      const nextExpiresAt = await getSessionExpiresAt();
      if (!nextExpiresAt) {
        handleLogout('expired');
        return;
      }
      setAuthenticated(true);
      await scheduleSessionCheckAt(nextExpiresAt);
      return;
    }
    setAuthenticated(true);
    await scheduleSessionCheckAt(expiresAt);
  }, [handleLogout, scheduleSessionCheckAt]);

  useEffect(() => {
    registerSessionExpiredHandler(handleLogout);
    registerSessionRefreshedHandler(() => {
      setSessionMessage(SESSION_REFRESHED_MESSAGE);
    });
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

  async function completeLogin() {
    setAuthenticated(true);
    setLoginInfoMessage(null);
    const expiresAt = await getSessionExpiresAt();
    await scheduleSessionCheckAt(expiresAt);
  }

  if (!isConfigured()) {
    return <ConfigMissing />;
  }

  if (!ready) {
    return <div className="p-8 text-center text-slate-600">Cargando…</div>;
  }

  if (newPasswordChallenge) {
    return (
      <>
        {config.useMock && <MockModeBanner />}
        <SetNewPasswordForm
          onSubmit={async (newPassword) => {
            await newPasswordChallenge(newPassword);
            setNewPasswordChallenge(null);
            await completeLogin();
          }}
        />
      </>
    );
  }

  if (!authenticated) {
    if (authView === 'forgot') {
      return (
        <>
          {config.useMock && <MockModeBanner />}
          <ForgotPasswordForm
            onSubmit={requestPasswordReset}
            onBack={() => {
              setAuthView('login');
              setLoginInfoMessage(null);
            }}
            onContinue={(email) => {
              setResetEmail(email);
              setAuthView('reset');
            }}
          />
        </>
      );
    }

    if (authView === 'reset') {
      return (
        <>
          {config.useMock && <MockModeBanner />}
          <ResetPasswordForm
            email={resetEmail}
            onSubmit={async (email, code, newPassword) => {
              await confirmPasswordReset(email, code, newPassword);
              setAuthView('login');
              setLoginInfoMessage(PASSWORD_RESET_SUCCESS_MESSAGE);
            }}
            onBack={() => {
              setAuthView('login');
              setLoginInfoMessage(null);
            }}
          />
        </>
      );
    }

    return (
      <>
        {config.useMock && <MockModeBanner />}
        <LoginForm
          mockMode={config.useMock}
          infoMessage={loginInfoMessage}
          onLogin={async (email, password) => {
            const result = await signIn(email, password);
            if (result.type === 'success') {
              await completeLogin();
            } else {
              setNewPasswordChallenge(() => result.completeChallenge);
            }
          }}
          onForgotPassword={() => {
            setLoginInfoMessage(null);
            setAuthView('forgot');
          }}
        />
      </>
    );
  }

  return (
    <>
      {config.useMock && <MockModeBanner />}
      <Dashboard
        onLogout={() => handleLogout('manual')}
        sessionMessage={sessionMessage}
        onDismissSessionMessage={() => setSessionMessage(null)}
      />
    </>
  );
}

function MockModeBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      Modo mock local — los borradores están en memoria; publicar escribe en{' '}
      <code>apps/static/content/published/</code>. Sin AWS ni GitHub.
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
      setError('Las contraseñas no coinciden');
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
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo establecer la contraseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Establecer nueva contraseña</h1>
        <p className="text-sm text-slate-600">
          Elige una contraseña permanente para terminar de configurar tu cuenta.
        </p>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div>
          <label className="field-label" htmlFor="new-password">
            Nueva contraseña
          </label>
          <input
            id="new-password"
            type="password"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="confirm-password">
            Confirmar contraseña
          </label>
          <input
            id="confirm-password"
            type="password"
            className="field-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Guardando…' : 'Establecer contraseña'}
        </button>
      </form>
    </div>
  );
}
