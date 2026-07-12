interface Props {
  label: string | null;
  runUrl?: string | null;
  failed?: boolean;
  tracking?: boolean;
  onStopTracking?: () => void;
}

export function PublishStatusIndicator({ label, runUrl, failed, tracking, onStopTracking }: Props) {
  if (!label) {
    return null;
  }

  const showSpinner = !failed && label.endsWith('…');

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${failed ? 'text-red-700' : 'text-slate-600'}`}>
      {showSpinner && (
        <span
          className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      <span>{label}</span>
      {tracking && onStopTracking && (
        <button
          type="button"
          className="text-xs font-medium text-slate-500 underline hover:text-slate-800"
          onClick={onStopTracking}
        >
          Dejar de seguir
        </button>
      )}
      {failed && runUrl && (
        <a
          href={runUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-dark-blue underline"
        >
          Ver registros
        </a>
      )}
    </span>
  );
}
