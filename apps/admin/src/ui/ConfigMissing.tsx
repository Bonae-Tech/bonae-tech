import { config } from '../config.js';

export function ConfigMissing() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <div className="card space-y-4">
        <div>
          <h1 className="mb-2 text-xl font-bold text-slate-900">Configuración requerida</h1>
          <p className="text-sm text-slate-600">
            Configura las variables de entorno en <code>.env</code> (ver <code>.env.example</code>), o
            ejecuta el modo mock local sin AWS.
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <p className="mb-2 font-semibold text-slate-900">Probar el admin localmente (sin AWS)</p>
          <pre className="overflow-x-auto rounded bg-slate-900 px-3 py-2 text-xs text-slate-100">
            npm run admin:dev:mock
          </pre>
          <p className="mt-2 text-xs text-slate-500">
            Usa inicio de sesión mock y lee/escribe <code>apps/static/content/</code> vía el servidor
            de desarrollo de Vite.
          </p>
        </div>

        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>VITE_API_BASE_URL — {config.apiBaseUrl || 'faltante'}</li>
          <li>VITE_COGNITO_USER_POOL_ID — {config.userPoolId || 'faltante'}</li>
          <li>VITE_COGNITO_CLIENT_ID — {config.clientId || 'faltante'}</li>
        </ul>
      </div>
    </div>
  );
}
