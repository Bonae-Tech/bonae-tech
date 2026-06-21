function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.replace(/\/$/, '');
}

export const config = {
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
  region: import.meta.env.VITE_AWS_REGION ?? 'sa-east-1',
};

export function isConfigured(): boolean {
  if (config.useMock) {
    return true;
  }
  // apiBaseUrl may be empty for same-origin /content/* via Cloudflare Pages service binding
  return Boolean(config.userPoolId && config.clientId);
}
