import type { ReviewChangeKind, ReviewFieldChange } from '../../infrastructure/contentReview.js';

const BADGE_STYLES: Record<ReviewChangeKind, string> = {
  changed: 'bg-editor-accentSoft text-editor-brand',
  added: 'bg-editor-successBg text-editor-success',
  removed: 'bg-editor-errorBg text-editor-error',
};

function ChangeBadge({ kind }: { kind: ReviewChangeKind }) {
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${BADGE_STYLES[kind]}`}
    >
      {kind}
    </span>
  );
}

export function ChangeRow({ change }: { change: ReviewFieldChange }) {
  return (
    <div className="border-b border-editor-track py-2.5 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-editor-faint">{change.label}</p>
        <ChangeBadge kind={change.kind} />
      </div>
      {change.before && (
        <p className="mt-1 text-xs text-[#B03434] line-through decoration-[#E3A0A0]">{change.before}</p>
      )}
      {change.after && (
        <p className="mt-0.5 rounded bg-editor-successBg px-2 py-1 text-xs text-editor-success">{change.after}</p>
      )}
    </div>
  );
}
