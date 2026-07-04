import type { Env } from '../types.js';
import { CONTENT_STORE_ID } from './constants.js';

const DO_BASE_URL = 'https://content-store.internal';

export function getContentStoreStub(env: Env): DurableObjectStub {
  const id = env.CONTENT_STORE.idFromName(CONTENT_STORE_ID);
  return env.CONTENT_STORE.get(id);
}

export async function contentStoreRequest<T>(
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const stub = getContentStoreStub(env);
  const res = await stub.fetch(`${DO_BASE_URL}${path}`, init);
  const text = await res.text();
  const body = text ? (JSON.parse(text) as T) : (null as T);
  return { status: res.status, body };
}
