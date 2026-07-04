import { z } from 'zod';
import { localeSchema } from './schema.js';

/** Locale key stored in ContentStore (`es` | `en` | `settings`). */
export const contentLocaleSchema = z.union([localeSchema, z.literal('settings')]);
export type ContentLocale = z.infer<typeof contentLocaleSchema>;

export const CONTENT_LOCALES = ['es', 'en', 'settings'] as const satisfies readonly ContentLocale[];

export const publishStateValueSchema = z.enum([
  'idle',
  'committing',
  'building',
  'success',
  'failure',
]);
export type PublishStateValue = z.infer<typeof publishStateValueSchema>;

export const publishStateSchema = z.object({
  state: publishStateValueSchema,
  commitSha: z.string().nullable(),
  runUrl: z.string().nullable(),
  startedAt: z.number().nullable(),
  finishedAt: z.number().nullable(),
  error: z.string().nullable(),
});
export type PublishState = z.infer<typeof publishStateSchema>;

export function defaultPublishState(): PublishState {
  return {
    state: 'idle',
    commitSha: null,
    runUrl: null,
    startedAt: null,
    finishedAt: null,
    error: null,
  };
}

export function isPublishInFlight(state: PublishStateValue): boolean {
  return state === 'committing' || state === 'building';
}

/** Top-level keys of ContentDocument that map to admin section forms. */
export const contentSectionSchema = z.enum([
  'nav',
  'hero',
  'valueProp',
  'about',
  'contact',
  'plans',
  'footer',
]);
export type ContentSection = z.infer<typeof contentSectionSchema>;

export const contentStateResponseSchema = z.object({
  draft: z.object({
    es: z.unknown(),
    en: z.unknown(),
    settings: z.unknown(),
  }),
  published: z.object({
    es: z.unknown(),
    en: z.unknown(),
    settings: z.unknown(),
  }),
  lastPublishedAt: z.number().nullable(),
  lastCommitSha: z.string().nullable(),
  publishState: publishStateSchema,
});
export type ContentStateResponse = z.infer<typeof contentStateResponseSchema>;

export const saveDraftResponseSchema = z.object({
  savedAt: z.number(),
});
export type SaveDraftResponse = z.infer<typeof saveDraftResponseSchema>;

export const discardResponseSchema = z.object({
  discarded: z.literal(true),
});
export type DiscardResponse = z.infer<typeof discardResponseSchema>;

export const publishStatusResponseSchema = z.object({
  state: publishStateValueSchema,
  commitSha: z.string().nullable(),
  runUrl: z.string().nullable(),
  error: z.string().nullable(),
});
export type PublishStatusResponse = z.infer<typeof publishStatusResponseSchema>;

export const publishCallbackBodySchema = z.object({
  commitSha: z.string().min(1),
  status: z.enum(['success', 'failure', 'cancelled']),
  runUrl: z.string().min(1),
});
export type PublishCallbackBody = z.infer<typeof publishCallbackBodySchema>;
