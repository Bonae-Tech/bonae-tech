import type { PublishStateValue } from '@bonae/content/content-store';

interface Props {
  open: boolean;
  stage: PublishStateValue | 'dismissed';
  runUrl?: string | null;
  error?: string | null;
  onDismiss: () => void;
}

const STAGE_COPY: Record<
  Exclude<PublishStateValue, 'idle'>,
  { title: string; detail: string }
> = {
  committing: {
    title: 'Saving your changes…',
    detail: 'Committing published content to the repository.',
  },
  building: {
    title: 'Building your site…',
    detail: 'This can take 30–90 seconds while the static site builds and deploys.',
  },
  success: {
    title: 'Published!',
    detail: 'Your changes are live on the marketing site.',
  },
  failure: {
    title: 'Publish failed',
    detail: 'Review the workflow logs or try again.',
  },
};

export function PublishingOverlay({ open, stage, runUrl, error, onDismiss }: Props) {
  if (!open || stage === 'dismissed' || stage === 'idle') {
    return null;
  }

  const copy = STAGE_COPY[stage];
  const isTerminal = stage === 'success' || stage === 'failure';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
        <div className="flex items-start gap-3">
          {!isTerminal && (
            <div
              className="mt-1 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-dark-blue border-t-transparent"
              aria-hidden
            />
          )}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">{copy.title}</h2>
            <p className="text-sm text-slate-600">{error ?? copy.detail}</p>
            {runUrl && stage === 'failure' && (
              <a
                href={runUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm font-medium text-dark-blue underline"
              >
                View workflow run
              </a>
            )}
          </div>
        </div>
        {isTerminal && (
          <div className="mt-6 flex justify-end">
            <button type="button" className="btn-primary" onClick={onDismiss}>
              {stage === 'success' ? 'Done' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
