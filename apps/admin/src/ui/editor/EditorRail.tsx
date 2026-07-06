import { useState } from 'react';
import type { ContentDocument, SiteSettings } from '@bonae/content';
import type { SaveStatus } from '../../hooks/useContentWorkspace.js';
import type { RailTab } from './types.js';
import { EditorRailChanges } from './EditorRailChanges.js';
import { EditorRailHistory } from './EditorRailHistory.js';

interface Props {
  draft: { es: ContentDocument; en: ContentDocument; settings: SiteSettings } | null;
  published: { es: ContentDocument; en: ContentDocument; settings: SiteSettings } | null;
  saveStatus: SaveStatus;
  publishing: boolean;
  hasClientErrors: boolean;
  pendingCount: number;
  lastPublishedAt: number | null;
  lastCommitSha: string | null;
  onPublish: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function EditorRail({
  draft,
  published,
  saveStatus,
  publishing,
  hasClientErrors,
  pendingCount,
  lastPublishedAt,
  lastCommitSha,
  onPublish,
  mobileOpen,
  onMobileClose,
}: Props) {
  const [tab, setTab] = useState<RailTab>('changes');

  const railContent = (
    <>
      <div className="flex shrink-0 border-b border-editor-border">
        <button
          type="button"
          className={`editor-rail-tab ${tab === 'changes' ? 'editor-rail-tab-active' : ''}`}
          onClick={() => setTab('changes')}
        >
          Changes
          {pendingCount > 0 && (
            <span className="ml-1.5 rounded-[9px] bg-editor-accent px-1.5 py-px text-[10px] font-extrabold text-white">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`editor-rail-tab ${tab === 'history' ? 'editor-rail-tab-active' : ''}`}
          onClick={() => setTab('history')}
        >
          History
        </button>
      </div>
      {tab === 'changes' && draft && published ? (
        <EditorRailChanges
          draft={draft}
          published={published}
          saveStatus={saveStatus}
          publishing={publishing}
          hasClientErrors={hasClientErrors}
          onPublish={onPublish}
        />
      ) : (
        <EditorRailHistory lastPublishedAt={lastPublishedAt} lastCommitSha={lastCommitSha} />
      )}
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-[320px] shrink-0 flex-col border-l border-editor-border bg-white lg:flex">
        {railContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close review panel"
            onClick={onMobileClose}
          />
          <aside className="relative ml-auto flex h-full w-[min(320px,100%)] flex-col bg-white shadow-editor-shell">
            <div className="flex items-center justify-between border-b border-editor-border px-4 py-2">
              <span className="text-sm font-bold text-editor-text">Review</span>
              <button
                type="button"
                className="text-editor-faint hover:text-editor-text"
                onClick={onMobileClose}
              >
                Close
              </button>
            </div>
            {railContent}
          </aside>
        </div>
      )}
    </>
  );
}
