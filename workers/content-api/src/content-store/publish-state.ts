import {
  isPublishInFlight,
  type PublishCallbackBody,
  type PublishState,
  type PublishStateValue,
} from '@bonae/content';

export type PublishCallbackOutcome =
  | { kind: 'applied'; success: boolean }
  | { kind: 'ignored'; reason: 'wrong_state' | 'sha_mismatch' };

export function evaluatePublishCallback(
  publishState: PublishState,
  callback: PublishCallbackBody,
): PublishCallbackOutcome {
  if (publishState.state !== 'building') {
    return { kind: 'ignored', reason: 'wrong_state' };
  }
  if (publishState.commitSha !== callback.commitSha) {
    return { kind: 'ignored', reason: 'sha_mismatch' };
  }
  const success = callback.status === 'success';
  return { kind: 'applied', success };
}

export function callbackFailureMessage(callback: PublishCallbackBody): string {
  if (callback.status === 'cancelled') {
    return 'Deploy workflow was cancelled';
  }
  return 'Deploy workflow failed';
}

export function shouldTimeoutPublish(state: PublishStateValue): boolean {
  return isPublishInFlight(state);
}
