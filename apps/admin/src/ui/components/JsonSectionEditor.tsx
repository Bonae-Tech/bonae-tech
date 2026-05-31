import { useState } from 'react';

interface Props<T> {
  title: string;
  value: T;
  onSave: (value: T) => void;
  saving?: boolean;
}

export function JsonSectionEditor<T>({ title, value, onSave, saving }: Props<T>) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    try {
      const parsed = JSON.parse(text) as T;
      setError(null);
      onSave(parsed);
    } catch {
      setError('Invalid JSON');
    }
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <textarea
        className="field-input min-h-[420px] font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save draft'}
      </button>
    </div>
  );
}
