import type { ReactNode } from 'react';
import { CharCounter } from './CharCounter.js';
import { FieldError } from './FieldError.js';

interface Props {
  label: string;
  counter?: { current: number; max: number };
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export function FieldCard({ label, counter, error, children, className = '' }: Props) {
  return (
    <div className={`editor-card ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="editor-label">{label}</label>
        {counter && <CharCounter current={counter.current} max={counter.max} />}
      </div>
      {children}
      <FieldError message={error} />
    </div>
  );
}
