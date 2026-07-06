import type { ContentDocument, SiteSettings } from '@bonae/content';
import {
  buildPublishReview,
  reviewBlocksPublish,
  reviewHasNoChanges,
} from '../../infrastructure/contentReview.js';
import type { SaveStatus } from '../../hooks/useContentWorkspace.js';
import { ChangeRow } from '../components/ChangeRow.js';

interface Props {
  draft: { es: ContentDocument; en: ContentDocument; settings: SiteSettings };
  published: { es: ContentDocument; en: ContentDocument; settings: SiteSettings };
  saveStatus: SaveStatus;
  publishing: boolean;
  hasClientErrors: boolean;
  onPublish: () => void;
}

export function EditorRailChanges({
  draft,
  published,
  saveStatus,
  publishing,
  hasClientErrors,
  onPublish,
}: Props) {
  const review = buildPublishReview({ draft, published });
  const blocked = reviewBlocksPublish(review) || hasClientErrors;
  const noChanges = reviewHasNoChanges(review);
  const isUnsaved = saveStatus === 'pending' || saveStatus === 'saving';

  const publishDisabled = publishing || blocked || noChanges;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
        {isUnsaved && (
          <div className="editor-banner-warning mb-3">
            Unsaved edits — saving shortly. Click <strong>Save draft</strong> to persist immediately before
            review.
          </div>
        )}
        {(review.validationErrors.length > 0 || hasClientErrors) && (
          <div className="editor-banner-error mb-3">
            Validation errors block publish. Fix highlighted fields.
            {review.validationErrors.length > 0 && (
              <ul className="mt-1 list-inside list-disc font-normal">
                {review.validationErrors.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {review.warnings.length > 0 && (
          <div className="editor-banner-warning mb-3 font-normal">
            {review.warnings.length} warning(s) — won&apos;t block publishing
          </div>
        )}
        {!isUnsaved && noChanges && !hasClientErrors && (
          <p className="py-8 text-center text-[12.5px] text-editor-faint">Nothing pending. Everything is live.</p>
        )}
        {review.changes.map((change) => (
          <ChangeRow key={`${change.locale}-${change.label}-${change.kind}-${change.after}`} change={change} />
        ))}
      </div>
      <div className="shrink-0 border-t border-editor-border px-4 py-3.5">
        <p className="mb-2 text-[11px] text-editor-faint">Review every change here before it goes live.</p>
        <button
          type="button"
          className={`btn-editor-publish ${publishDisabled ? '' : 'btn-editor-publish-active'}`}
          disabled={publishDisabled}
          onClick={onPublish}
        >
          {publishing ? 'Starting…' : 'Approve & publish'}
        </button>
      </div>
    </div>
  );
}
