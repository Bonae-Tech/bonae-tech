import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import type { GitHubSecretPayload } from './types.js';
import type { Env } from './types.js';

export interface GitHubConfig {
  appId: string;
  installationId: string;
  privateKey: string;
  owner: string;
  repo: string;
  branch: string;
  contentPathPrefix: string;
}

export function parseGitHubConfig(secrets: GitHubSecretPayload, env: Env): GitHubConfig {
  const repoFull = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH ?? 'main';
  const contentPathPrefix = env.CONTENT_PATH_PREFIX ?? 'apps/static/content';

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

export function publishedFilePath(config: GitHubConfig, name: string): string {
  return `${config.contentPathPrefix}/published/${name}`;
}

export async function readPublishedJson(
  octokit: Octokit,
  config: GitHubConfig,
  fileName: string,
): Promise<{ data: unknown; sha?: string }> {
  const path = publishedFilePath(config, fileName);
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

export async function publishDraftsAtomic(
  octokit: Octokit,
  config: GitHubConfig,
  drafts: { es: unknown; en: unknown; settings: unknown },
  actor: string,
): Promise<{ commitSha: string }> {
  const files = [
    ['es.json', drafts.es],
    ['en.json', drafts.en],
    ['settings.json', drafts.settings],
  ] as const;

  const ref = await octokit.git.getRef({
    owner: config.owner,
    repo: config.repo,
    ref: `heads/${config.branch}`,
  });
  const baseCommitSha = ref.data.object.sha;

  const baseCommit = await octokit.git.getCommit({
    owner: config.owner,
    repo: config.repo,
    commit_sha: baseCommitSha,
  });
  const baseTreeSha = baseCommit.data.tree.sha;

  const treeEntries: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  for (const [fileName, data] of files) {
    const blob = await octokit.git.createBlob({
      owner: config.owner,
      repo: config.repo,
      content: JSON.stringify(data, null, 2) + '\n',
      encoding: 'utf-8',
    });
    treeEntries.push({
      path: publishedFilePath(config, fileName),
      mode: '100644',
      type: 'blob',
      sha: blob.data.sha,
    });
  }

  const tree = await octokit.git.createTree({
    owner: config.owner,
    repo: config.repo,
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  const commit = await octokit.git.createCommit({
    owner: config.owner,
    repo: config.repo,
    message: `chore(content): publish via admin (${actor})`,
    tree: tree.data.sha,
    parents: [baseCommitSha],
  });

  try {
    await octokit.git.updateRef({
      owner: config.owner,
      repo: config.repo,
      ref: `heads/${config.branch}`,
      sha: commit.data.sha,
    });
  } catch (err: unknown) {
    const status = typeof err === 'object' && err !== null && 'status' in err ? err.status : undefined;
    const message = err instanceof Error ? err.message : String(err);
    if (status === 403 && message.includes('Resource not accessible by integration')) {
      throw new Error(
        'GitHub App lacks Contents write permission. In GitHub App settings set Repository permissions → Contents → Read and write, then approve the update on the app installation.',
      );
    }
    if (status === 409 && message.includes('Changes must be made through a pull request')) {
      throw new Error(
        'Branch protection blocks direct commits on the configured branch. Allow the bonae-content-api GitHub App to bypass the pull request requirement for main (or point GITHUB_BRANCH at an unprotected branch).',
      );
    }
    throw err;
  }

  return { commitSha: commit.data.sha };
}
