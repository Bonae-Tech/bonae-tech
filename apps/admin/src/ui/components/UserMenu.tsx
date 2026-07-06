import { useState, useRef, useEffect } from 'react';

interface Props {
  initials: string;
  onLogout: () => void;
}

export function UserMenu({ initials, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-editor-brand text-[11.5px] font-extrabold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-editor-brand"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 min-w-[140px] rounded-lg border border-editor-border bg-white py-1 shadow-editor-segment">
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-editor-muted hover:bg-editor-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-editor-brand"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
