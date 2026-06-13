export const config = {
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
  region: import.meta.env.VITE_AWS_REGION ?? 'us-east-1',
};

export function isConfigured(): boolean {
  if (config.useMock) {
    return true;
  }
  return Boolean(config.apiBaseUrl && config.userPoolId && config.clientId);
}
