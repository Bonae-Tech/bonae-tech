import {
  buildPublishReview,
  reviewBlocksPublish,
  reviewHasNoChanges,
  type ReviewGroupResult,
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

function GroupPanel({ group }: { group: ReviewGroupResult }) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">{group.label}</h3>
      {!group.hasChanges && group.validationErrors.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">No changes from published.</p>
      )}
      {group.changes.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
          {group.changes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {group.validationErrors.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-sm text-red-700">
          {group.validationErrors.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {group.missingTranslationIssues.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Locale parity
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-amber-900">
            {group.missingTranslationIssues.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
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

  const groups = buildPublishReview({ draft, published });
  const blocked = reviewBlocksPublish(groups);
  const noChanges = reviewHasNoChanges(groups);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">Review &amp; publish</h2>
        <p className="mt-1 text-sm text-slate-600">
          Confirm changes across Spanish, English, and site settings before going live.
        </p>

        <div className="mt-4 space-y-3">
          {groups.map((group) => (
            <GroupPanel key={group.id} group={group} />
          ))}
        </div>

        {noChanges && (
          <p className="mt-4 text-sm text-amber-800">Nothing differs from the published site.</p>
        )}
        {blocked && (
          <p className="mt-4 text-sm text-red-700">
            Fix validation and locale parity issues before publishing.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={publishing}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            disabled={publishing || blocked || noChanges}
          >
            {publishing ? 'Starting…' : 'Publish site'}
          </button>
        </div>
      </div>
    </div>
  );
}
