import { CONTENT_LOCALES, type ContentLocale } from '@bonae/content';
import {
  createOctokit,
  parseGitHubConfig,
  readPublishedJson,
} from '../github.js';
import { loadGitHubSecrets } from '../secrets.js';
import type { Env } from '../types.js';
import { isPublishedCacheEmpty } from './migrations.js';

function fileNameFor(locale: ContentLocale): string {
  return locale === 'settings' ? 'settings.json' : `${locale}.json`;
}

async function latestBranchCommitSha(
  octokit: Awaited<ReturnType<typeof createOctokit>>,
  owner: string,
  repo: string,
  branch: string,
): Promise<string | null> {
  try {
    const ref = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    return ref.data.object.sha;
  } catch {
    return null;
  }
}

export async function bootstrapFromGitIfNeeded(sql: SqlStorage, env: Env): Promise<void> {
  if (!isPublishedCacheEmpty(sql)) {
    return;
  }

  const secrets = loadGitHubSecrets(env);
  const config = parseGitHubConfig(secrets, env);
  const octokit = await createOctokit(config);
  const commitSha = await latestBranchCommitSha(
    octokit,
    config.owner,
    config.repo,
    config.branch,
  );
  const now = Date.now();

  for (const locale of CONTENT_LOCALES) {
    const { data } = await readPublishedJson(octokit, config, fileNameFor(locale));
    const content = JSON.stringify(data);

    sql.exec(
      `INSERT INTO published_cache (locale, content, commit_sha, updated_at)
       VALUES (?, ?, ?, ?)`,
      locale,
      content,
      commitSha,
      now,
    );
    sql.exec(
      `INSERT INTO drafts (locale, content, updated_at) VALUES (?, ?, ?)`,
      locale,
      content,
      now,
    );
  }
}
