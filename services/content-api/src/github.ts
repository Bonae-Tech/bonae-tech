import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import type { GitHubSecretPayload } from './secrets.js';

export interface GitHubConfig {
  appId: string;
  installationId: string;
  privateKey: string;
  owner: string;
  repo: string;
  branch: string;
  contentPathPrefix: string;
}

export function parseGitHubConfig(secrets: GitHubSecretPayload): GitHubConfig {
  const repoFull = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? 'main';
  const contentPathPrefix = process.env.CONTENT_PATH_PREFIX ?? 'apps/static/content';

  if (!repoFull) {
    throw new Error('GITHUB_REPO is not configured');
  }

  const [owner, repo] = repoFull.split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPO must be owner/repo');
  }

  return {
    appId: secrets.appId,
    installationId: secrets.installationId,
    privateKey: secrets.privateKey,
    owner,
    repo,
    branch,
    contentPathPrefix,
  };
}

export async function createOctokit(config: GitHubConfig): Promise<Octokit> {
  const auth = createAppAuth({
    appId: config.appId,
    privateKey: config.privateKey,
    installationId: config.installationId,
  });
  const installationAuth = await auth({ type: 'installation' });
  return new Octokit({ auth: installationAuth.token });
}

export function contentFilePath(config: GitHubConfig, tier: 'drafts' | 'published', name: string): string {
  return `${config.contentPathPrefix}/${tier}/${name}`;
}

export async function readRepoJson(
  octokit: Octokit,
  config: GitHubConfig,
  tier: 'drafts' | 'published',
  fileName: string,
): Promise<{ data: unknown; sha?: string }> {
  const path = contentFilePath(config, tier, fileName);
  try {
    const res = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path,
      ref: config.branch,
    });
    if (Array.isArray(res.data) || res.data.type !== 'file') {
      throw new Error(`Expected file at ${path}`);
    }
    const decoded = Buffer.from(res.data.content, 'base64').toString('utf8');
    return { data: JSON.parse(decoded), sha: res.data.sha };
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && err.status === 404) {
      throw new Error(`Content file not found: ${path}`);
    }
    throw err;
  }
}

export async function writeRepoJson(
  octokit: Octokit,
  config: GitHubConfig,
  tier: 'drafts' | 'published',
  fileName: string,
  data: unknown,
  sha: string | undefined,
  message: string,
): Promise<string> {
  const path = contentFilePath(config, tier, fileName);
  const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
  const res = await octokit.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path,
    message,
    content,
    branch: config.branch,
    sha,
  });
  return res.data.commit.sha ?? 'unknown';
}

export async function publishContent(
  octokit: Octokit,
  config: GitHubConfig,
  actor: string,
): Promise<{ commitSha: string }> {
  const files = ['es.json', 'en.json', 'settings.json'] as const;
  let lastSha = 'unknown';

  for (const file of files) {
    const draft = await readRepoJson(octokit, config, 'drafts', file);
    let publishedSha: string | undefined;
    try {
      const published = await readRepoJson(octokit, config, 'published', file);
      publishedSha = published.sha;
    } catch {
      publishedSha = undefined;
    }
    lastSha = await writeRepoJson(
      octokit,
      config,
      'published',
      file,
      draft.data,
      publishedSha,
      `chore(content): publish ${file} via admin (${actor})`,
    );
  }

  return { commitSha: lastSha };
}
