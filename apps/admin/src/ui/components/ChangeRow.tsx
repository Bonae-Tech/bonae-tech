import type { ReviewFieldChange } from '../../infrastructure/contentReview.js';

export function ChangeRow({ change }: { change: ReviewFieldChange }) {
  return (
    <div className="border-b border-editor-track py-2.5 last:border-b-0">
      <p className="text-[10.5px] font-bold text-editor-faint">{change.label}</p>
      {change.before && (
        <p className="mt-1 text-xs text-editor-errorStrike line-through decoration-[#E3A0A0]">{change.before}</p>
      )}
      {change.after && <p className="mt-0.5 text-xs text-editor-success">{change.after}</p>}
    </div>
  );
}
