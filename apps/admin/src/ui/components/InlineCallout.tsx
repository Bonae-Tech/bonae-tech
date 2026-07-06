import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tone?: 'info' | 'warning';
}

export function InlineCallout({ children, tone = 'info' }: Props) {
  if (tone === 'warning') {
    return <div className="editor-banner-warning">{children}</div>;
  }
  return <div className="editor-info-callout">{children}</div>;
}
