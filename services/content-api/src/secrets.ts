import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export interface GitHubSecretPayload {
  appId: string;
  installationId: string;
  privateKey: string;
}

let cached: GitHubSecretPayload | null = null;

export async function loadGitHubSecrets(): Promise<GitHubSecretPayload> {
  if (cached) return cached;

  const arn = process.env.GITHUB_SECRET_ARN;
  if (!arn) {
    throw new Error('GITHUB_SECRET_ARN is not configured');
  }

  const client = new SecretsManagerClient({});
  const res = await client.send(new GetSecretValueCommand({ SecretId: arn }));
  if (!res.SecretString) {
    throw new Error('GitHub secret is empty');
  }

  const parsed = JSON.parse(res.SecretString) as GitHubSecretPayload;
  parsed.privateKey = parsed.privateKey.replace(/\\n/g, '\n');
  cached = parsed;
  return parsed;
}
