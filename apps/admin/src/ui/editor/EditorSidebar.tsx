import type { Locale } from '@bonae/content/schema';
import type { SectionId } from './types.js';
import { NAV_ITEMS } from './types.js';

interface Props {
  locale: Locale;
  section: SectionId;
  showLocale: boolean;
  onLocaleChange: (locale: Locale) => void;
  onSectionChange: (section: SectionId) => void;
  onDiscard: () => void;
  discardPending: boolean;
  navErrorCount: (section: SectionId) => number;
}

export function EditorSidebar({
  locale,
  section,
  showLocale,
  onLocaleChange,
  onSectionChange,
  onDiscard,
  discardPending,
  navErrorCount,
}: Props) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 border-b border-editor-border bg-white p-3.5 lg:w-[210px] lg:border-b-0 lg:border-r">
      {showLocale && (
        <div>
          <p className="mb-2 px-1.5 text-[10.5px] font-bold uppercase tracking-wider text-editor-faint">Locale</p>
          <div className="editor-segment-track">
            {(['es', 'en'] as Locale[]).map((loc) => (
              <button
                key={loc}
                type="button"
                className={`editor-segment-btn ${locale === loc ? 'editor-segment-btn-active' : ''}`}
                onClick={() => onLocaleChange(loc)}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(([id, label]) => {
          const active = section === id;
          const errCount = navErrorCount(id);
          return (
            <button
              key={id}
              type="button"
              className={`editor-nav-btn ${active ? 'editor-nav-btn-active' : ''}`}
              onClick={() => onSectionChange(id)}
            >
              <span
                className={`h-[5px] w-[5px] shrink-0 rounded-full ${active ? 'bg-editor-accent' : 'bg-transparent'}`}
                aria-hidden
              />
              <span className="flex-1">{label}</span>
              {errCount > 0 && (
                <span className="rounded-lg bg-editor-errorPill px-1.5 py-0.5 text-[10px] font-extrabold text-editor-error">
                  {errCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-editor-track pt-3.5">
        <button
          type="button"
          className="btn-editor-secondary"
          onClick={onDiscard}
          disabled={discardPending}
        >
          Discard all drafts
        </button>
      </div>
    </aside>
  );
}
