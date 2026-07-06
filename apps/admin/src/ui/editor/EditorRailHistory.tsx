interface Props {
  lastPublishedAt: number | null;
  lastCommitSha: string | null;
}

export function EditorRailHistory({ lastPublishedAt, lastCommitSha }: Props) {
  const entries: { summary: string; time: string; user: string }[] = [];

  if (lastPublishedAt) {
    entries.push({
      summary: 'Last successful publish',
      time: new Date(lastPublishedAt).toLocaleString(),
      user: 'System',
    });
  }
  if (lastCommitSha) {
    entries.push({
      summary: `Commit ${lastCommitSha.slice(0, 7)}`,
      time: lastPublishedAt ? new Date(lastPublishedAt).toLocaleString() : '—',
      user: 'GitHub',
    });
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
      {entries.length === 0 ? (
        <p className="py-8 text-center text-[12.5px] text-editor-faint">No publish history yet.</p>
      ) : (
        entries.map((log) => (
          <div key={log.summary} className="border-b border-editor-track py-2.5 last:border-b-0">
            <div className="text-xs font-bold text-editor-text">{log.summary}</div>
            <div className="mt-0.5 text-[11px] text-editor-faint">
              {log.time} · {log.user}
            </div>
          </div>
        ))
      )}
      <p className="mt-4 text-[11px] text-editor-faint">
        Full activity log with user identities requires a future server audit API.
      </p>
    </div>
  );
}
