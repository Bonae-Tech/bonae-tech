interface Props {
  label: string | null;
  runUrl?: string | null;
  failed?: boolean;
}

export function PublishStatusIndicator({ label, runUrl, failed }: Props) {
  if (!label) {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${failed ? 'text-red-700' : 'text-slate-600'}`}>
      {!failed && label.endsWith('…') && (
        <span
          className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      <span>{label}</span>
      {failed && runUrl && (
        <a
          href={runUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-dark-blue underline"
        >
          View logs
        </a>
      )}
    </span>
  );
}
