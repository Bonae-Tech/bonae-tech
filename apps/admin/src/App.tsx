import { useEffect, useState } from 'react';
import { config, isConfigured } from './config.js';
import { getCurrentSession, signIn, signOut } from './infrastructure/auth.js';
import { ConfigMissing } from './ui/ConfigMissing.js';
import { LoginForm } from './ui/LoginForm.js';
import { Dashboard } from './ui/Dashboard.js';

export default function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!isConfigured()) {
      setReady(true);
      return;
    }

    getCurrentSession()
      .then((session) => setAuthenticated(Boolean(session?.isValid())))
      .finally(() => setReady(true));
  }, []);

  if (!isConfigured()) {
    return <ConfigMissing />;
  }

  if (!ready) {
    return <div className="p-8 text-center text-slate-600">Loading…</div>;
  }

  if (!authenticated) {
    return (
      <>
        {config.useMock && <MockModeBanner />}
        <LoginForm
          mockMode={config.useMock}
          onLogin={async (email, password) => {
            await signIn(email, password);
            setAuthenticated(true);
          }}
        />
      </>
    );
  }

  return (
    <>
      {config.useMock && <MockModeBanner />}
      <Dashboard
        onLogout={() => {
          void signOut();
          setAuthenticated(false);
        }}
      />
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
