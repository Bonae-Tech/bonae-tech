import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export interface GitHubSecretPayload {
  appId: string;
  installationId: string;
  privateKey: string;
}

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

export async function loadGitHubSecrets(): Promise<GitHubSecretPayload> {
  const arn = process.env.GITHUB_SECRET_ARN;
  if (!arn) {
    throw new Error('GITHUB_SECRET_ARN is not configured');
  }

  const client = new SecretsManagerClient({});
  const res = await client.send(new GetSecretValueCommand({ SecretId: arn }));
  if (!res.SecretString) {
    throw new Error('GitHub secret is empty');
  }

  return validateGitHubSecret(JSON.parse(res.SecretString) as GitHubSecretPayload);
}
