import type { ReactNode } from 'react';

interface Props {
  topBar: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  rail: ReactNode;
  onOpenRail?: () => void;
  showRailToggle?: boolean;
}

export function EditorShell({ topBar, sidebar, main, rail, onOpenRail, showRailToggle }: Props) {
  return (
    <div className="editor-canvas editor-selection">
      <div className="editor-shell">
        {topBar}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {sidebar}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
            <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-16 md:px-8">
              {showRailToggle && onOpenRail && (
                <button
                  type="button"
                  className="btn-editor-add mb-4 lg:hidden"
                  onClick={onOpenRail}
                >
                  Revisar cambios
                </button>
              )}
              <div className="mx-auto flex max-w-[600px] flex-col gap-5">{main}</div>
            </main>
            {rail}
          </div>
        </div>
      </div>
    </div>
  );
}
