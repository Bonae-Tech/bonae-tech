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
      setError(err instanceof Error ? err.message : 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
        {sent ? (
          <>
            <p className="text-sm text-slate-600">
              Si existe una cuenta con ese correo, se envió un código de verificación. Revisa tu
              bandeja de entrada e ingrésalo en la siguiente pantalla.
            </p>
            <button type="button" className="btn-primary w-full" onClick={() => onContinue(email)}>
              Ingresar código de verificación
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              Ingresa tu correo de administrador. Enviaremos un código de verificación si existe una
              cuenta.
            </p>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div>
              <label className="field-label" htmlFor="reset-email">
                Correo electrónico
              </label>
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
              {loading ? 'Enviando…' : 'Enviar código'}
            </button>
            <button type="button" className="btn-secondary w-full" onClick={onBack}>
              Volver al inicio de sesión
            </button>
          </>
        )}
      </form>
    </div>
  );
}
