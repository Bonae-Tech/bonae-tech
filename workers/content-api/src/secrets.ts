import type { Env, GitHubSecretPayload } from './types.js';

function validateGitHubSecret(parsed: GitHubSecretPayload): GitHubSecretPayload {
  parsed.privateKey = parsed.privateKey.replace(/\\n/g, '\n');

  if (!parsed.installationId || parsed.installationId === 'REPLACE') {
    throw new Error('GitHub secret installationId is missing or still set to REPLACE');
  }
  if (!/^\d+$/.test(parsed.installationId)) {
    throw new Error(
      'GitHub secret installationId must be the numeric ID from github.com/settings/installations/{id}, not the App Client ID',
    );
  }

  return parsed;
}

export function loadGitHubSecrets(env: Env): GitHubSecretPayload {
  if (!env.GITHUB_APP_ID || !env.GITHUB_INSTALLATION_ID || !env.GITHUB_PRIVATE_KEY) {
    throw new Error('GitHub App credentials are not configured');
  }

  return validateGitHubSecret({
    appId: env.GITHUB_APP_ID,
    installationId: env.GITHUB_INSTALLATION_ID,
    privateKey: env.GITHUB_PRIVATE_KEY,
  });
}
