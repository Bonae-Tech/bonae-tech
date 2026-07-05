import { publishCallbackBodySchema, isPublishInFlight } from '@bonae/content';
import type { Env } from '../types.js';
import { createOctokit, parseGitHubConfig, publishDraftsAtomic } from '../github.js';
import { loadGitHubSecrets } from '../secrets.js';
import { PUBLISH_ALARM_MS } from './constants.js';
import {
  callbackFailureMessage,
  evaluatePublishCallback,
} from './publish-state.js';
import { validateDraftsForPublish } from './publish-validation.js';
import {
  readDraftBundle,
  readPublishState,
  syncPublishedCacheFromDrafts,
  writePublishState,
} from './queries.js';

export async function handlePublishRequest(
  sql: SqlStorage,
  env: Env,
  actor: string,
  scheduleAlarm: (at: number) => void,
  clearAlarm: () => Promise<void>,
): Promise<{ status: number; body: unknown }> {
  const publishState = readPublishState(sql);
  if (isPublishInFlight(publishState.state)) {
    return { status: 409, body: { error: 'Publish already in flight' } };
  }

  const drafts = readDraftBundle(sql);
  const validation = validateDraftsForPublish(drafts);
  if (!validation.ok) {
    return { status: 422, body: { errors: validation.errors } };
  }

  const startedAt = Date.now();
  writePublishState(sql, 'committing', {
    commitSha: null,
    runUrl: null,
    startedAt,
    finishedAt: null,
    error: null,
  });
  scheduleAlarm(Date.now() + PUBLISH_ALARM_MS);

  try {
    const secrets = loadGitHubSecrets(env);
    const config = parseGitHubConfig(secrets, env);
    const octokit = await createOctokit(config);
    const { commitSha } = await publishDraftsAtomic(octokit, config, validation.drafts, actor);

    writePublishState(sql, 'building', {
      commitSha,
      startedAt,
      finishedAt: null,
      error: null,
      runUrl: null,
    });
    scheduleAlarm(Date.now() + PUBLISH_ALARM_MS);

    console.log(JSON.stringify({ action: 'publish_accepted', actor, commitSha }));
    return { status: 200, body: { accepted: true } };
  } catch (err) {
    await clearAlarm();
    const message = err instanceof Error ? err.message : 'Publish commit failed';
    writePublishState(sql, 'failure', {
      finishedAt: Date.now(),
      error: message,
    });
    console.error(JSON.stringify({ action: 'publish_commit_failed', actor, error: message }));
    return { status: 500, body: { error: message } };
  }
}

export async function handlePublishCallback(
  sql: SqlStorage,
  bodyText: string,
  clearAlarm: () => Promise<void>,
): Promise<{ status: number; body: unknown }> {
  const parsed = publishCallbackBodySchema.safeParse(JSON.parse(bodyText));
  if (!parsed.success) {
    return { status: 400, body: { error: 'Invalid callback payload' } };
  }

  const callback = parsed.data;
  const publishState = readPublishState(sql);
  const outcome = evaluatePublishCallback(publishState, callback);

  if (outcome.kind === 'ignored') {
    console.warn(
      JSON.stringify({
        action: 'publish_callback_ignored',
        reason: outcome.reason,
        commitSha: callback.commitSha,
        state: publishState.state,
      }),
    );
    return { status: 204, body: null };
  }

  await clearAlarm();
  const finishedAt = Date.now();

  if (outcome.success) {
    syncPublishedCacheFromDrafts(sql, callback.commitSha);
    writePublishState(sql, 'success', {
      commitSha: callback.commitSha,
      runUrl: callback.runUrl,
      finishedAt,
      error: null,
    });
    console.log(JSON.stringify({ action: 'publish_success', commitSha: callback.commitSha }));
  } else {
    writePublishState(sql, 'failure', {
      commitSha: callback.commitSha,
      runUrl: callback.runUrl,
      finishedAt,
      error: callbackFailureMessage(callback),
    });
    console.error(
      JSON.stringify({
        action: 'publish_failure',
        commitSha: callback.commitSha,
        status: callback.status,
        runUrl: callback.runUrl,
      }),
    );
  }

  return { status: 204, body: null };
}

export async function handlePublishAlarm(
  sql: SqlStorage,
): Promise<void> {
  const publishState = readPublishState(sql);
  if (!isPublishInFlight(publishState.state)) {
    return;
  }
  writePublishState(sql, 'failure', {
    finishedAt: Date.now(),
    error: 'Publish timed out waiting for deploy callback',
  });
  console.error(JSON.stringify({ action: 'publish_timeout', commitSha: publishState.commitSha }));
}

export async function handlePublishAbort(
  sql: SqlStorage,
  clearAlarm: () => Promise<void>,
): Promise<{ status: number; body: unknown }> {
  await clearAlarm();
  const publishState = readPublishState(sql);
  if (!isPublishInFlight(publishState.state)) {
    return { status: 200, body: { aborted: false, state: publishState.state } };
  }
  writePublishState(sql, 'failure', {
    finishedAt: Date.now(),
    error: 'Publish aborted by administrator',
  });
  console.warn(JSON.stringify({ action: 'publish_aborted', priorState: publishState.state }));
  return { status: 200, body: { aborted: true, state: 'failure' } };
}
