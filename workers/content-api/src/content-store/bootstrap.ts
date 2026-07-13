import { CONTENT_LOCALES, type ContentLocale } from '@bonae/content';
import {
  createOctokit,
  parseGitHubConfig,
  readPublishedJson,
  type GitHubConfig,
} from '../github.js';
import { loadGitHubSecrets } from '../secrets.js';
import type { Env } from '../types.js';
import { isPublishedCacheEmpty } from './migrations.js';
import { validateDraftsForPublish } from './publish-validation.js';
import { writePublishedAndDraftsFromBundle } from './queries.js';
import type { Octokit } from '@octokit/rest';

function fileNameFor(locale: ContentLocale): string {
  return locale === 'settings' ? 'settings.json' : `${locale}.json`;
}

async function latestBranchCommitSha(
  octokit: Octokit,
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

async function fetchPublishedBundleFromGit(
  octokit: Octokit,
  config: GitHubConfig,
  ref: string | undefined,
): Promise<{ es: unknown; en: unknown; settings: unknown }> {
  const bundle: { es: unknown; en: unknown; settings: unknown } = {
    es: null,
    en: null,
    settings: null,
  };
  for (const locale of CONTENT_LOCALES) {
    const { data } = await readPublishedJson(octokit, config, fileNameFor(locale), ref);
    bundle[locale] = data;
  }
  return bundle;
}

export type RehydrateResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Git-authoritative rehydrate: load published JSON from a commit (or branch tip),
 * validate, then overwrite published_cache and drafts. Never half-writes on validation failure.
 */
export async function rehydrateFromGit(
  sql: SqlStorage,
  env: Env,
  options: { commitSha?: string | null } = {},
): Promise<RehydrateResult> {
  try {
    const secrets = loadGitHubSecrets(env);
    const config = parseGitHubConfig(secrets, env);
    const octokit = await createOctokit(config);

    let commitSha = options.commitSha ?? null;
    if (!commitSha) {
      commitSha = await latestBranchCommitSha(
        octokit,
        config.owner,
        config.repo,
        config.branch,
      );
    }

    const ref = commitSha ?? config.branch;
    const raw = await fetchPublishedBundleFromGit(octokit, config, ref);
    const validation = validateDraftsForPublish(raw);
    if (!validation.ok) {
      const message = validation.errors.join('; ');
      console.error(
        JSON.stringify({
          action: 'rehydrate_from_git_invalid',
          commitSha,
          errors: validation.errors,
        }),
      );
      return { ok: false, error: message };
    }

    writePublishedAndDraftsFromBundle(sql, validation.drafts, commitSha);
    console.log(JSON.stringify({ action: 'rehydrate_from_git', commitSha }));
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rehydrate from git failed';
    console.error(JSON.stringify({ action: 'rehydrate_from_git_failed', error: message }));
    return { ok: false, error: message };
  }
}

export async function bootstrapFromGitIfNeeded(sql: SqlStorage, env: Env): Promise<void> {
  if (!isPublishedCacheEmpty(sql)) {
    return;
  }
  const result = await rehydrateFromGit(sql, env);
  if (!result.ok) {
    throw new Error(`Bootstrap from git failed: ${result.error}`);
  }
}
