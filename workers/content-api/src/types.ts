export interface Env {
  GITHUB_APP_ID: string;
  GITHUB_INSTALLATION_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  CONTENT_PATH_PREFIX: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_REGION: string;
  CORS_ORIGIN?: string;
  CONTENT_STORE: DurableObjectNamespace;
  PUBLISH_CALLBACK_SECRET?: string;
}

export interface GitHubSecretPayload {
  appId: string;
  installationId: string;
  privateKey: string;
}
