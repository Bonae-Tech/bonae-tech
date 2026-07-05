import {
  buildPublishReview,
  reviewBlocksPublish,
  reviewHasNoChanges,
  type ReviewChangeKind,
  type ReviewFieldChange,
} from '../../infrastructure/contentReview.js';
import type { ContentDocument, SiteSettings } from '@bonae/content';

interface Props {
  open: boolean;
  draft: { es: ContentDocument; en: ContentDocument; settings: SiteSettings };
  published: { es: ContentDocument; en: ContentDocument; settings: SiteSettings };
  publishing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LOCALE_HEADINGS: Record<'es' | 'en', string> = {
  es: 'Spanish (ES)',
  en: 'English (EN)',
};

const BADGE_STYLES: Record<ReviewChangeKind, string> = {
  changed: 'bg-sky-100 text-sky-800',
  added: 'bg-emerald-100 text-emerald-800',
  removed: 'bg-red-100 text-red-800',
};

function ChangeBadge({ kind }: { kind: ReviewChangeKind }) {
  return (
    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_STYLES[kind]}`}>
      {kind}
    </span>
  );
}

function ChangeRow({ change }: { change: ReviewFieldChange }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">{change.label}</p>
        <ChangeBadge kind={change.kind} />
      </div>
      {change.before && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-900 line-through">
          {change.before}
        </p>
      )}
      {change.after && (
        <p className={`mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ${change.before ? '' : 'mt-2'}`}>
          {change.after}
        </p>
      )}
    </div>
  );
}

export function ReviewPublishModal({
  open,
  draft,
  published,
  publishing,
  onClose,
  onConfirm,
}: Props) {
  if (!open) {
    return null;
  }

  const review = buildPublishReview({ draft, published });
  const blocked = reviewBlocksPublish(review);
  const noChanges = reviewHasNoChanges(review);

  const changesByLocale = (['es', 'en'] as const).map((locale) => ({
    locale,
    heading: LOCALE_HEADINGS[locale],
    changes: review.changes.filter((c) => c.locale === locale),
  }));

  const settingsChanges = review.changes.filter((c) => c.locale === 'settings');

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Review &amp; publish</h2>
            <p className="mt-1 text-sm text-slate-600">
              {review.changeCount === 0
                ? 'Confirm changes across Spanish, English, and site settings before going live.'
                : `${review.changeCount} change(s) staged across locales`}
            </p>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {review.warnings.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-900">
              {review.warnings.length} warning(s) — won&apos;t block publishing
            </p>
            <ul className="mt-2 space-y-1">
              {review.warnings.map((warning) => (
                <li key={`${warning.label}-${warning.message}`} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-amber-950">{warning.label}</span>
                  <span className="shrink-0 text-amber-800">{warning.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {review.validationErrors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-900">Fix these issues before publishing</p>
            <ul className="mt-2 list-inside list-disc text-sm text-red-800">
              {review.validationErrors.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 space-y-5">
          {changesByLocale.map(({ locale, heading, changes }) =>
            changes.length > 0 ? (
              <section key={locale}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{heading}</h3>
                <div className="mt-2 space-y-2">
                  {changes.map((change) => (
                    <ChangeRow key={`${change.locale}-${change.label}-${change.kind}`} change={change} />
                  ))}
                </div>
              </section>
            ) : null,
          )}

          {settingsChanges.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Site settings</h3>
              <div className="mt-2 space-y-2">
                {settingsChanges.map((change) => (
                  <ChangeRow key={`settings-${change.label}`} change={change} />
                ))}
              </div>
            </section>
          )}

          {noChanges && (
            <p className="text-sm text-slate-500">No changes from published.</p>
          )}
        </div>

        {noChanges && (
          <p className="mt-4 text-sm text-amber-800">Nothing differs from the published site.</p>
        )}

        <p className="mt-6 text-sm text-slate-600">
          Publishing commits the draft to <strong>main</strong> and rebuilds the site.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={publishing}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            disabled={publishing || blocked || noChanges}
          >
            {publishing
              ? 'Starting…'
              : review.changeCount > 0
                ? `Publish ${review.changeCount} change${review.changeCount === 1 ? '' : 's'}`
                : 'Publish site'}
          </button>
        </div>
      </div>
    </div>
  );
}
