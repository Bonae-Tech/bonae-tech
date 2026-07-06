import { WorkflowStepper } from './WorkflowStepper.js';
import { UserMenu } from '../components/UserMenu.js';

interface Props {
  saveStatusText: string;
  saveStatusTone: 'warning' | 'muted' | 'error';
  saveDraftDisabled: boolean;
  saving: boolean;
  onSaveDraft: () => void;
  lastPublishedLabel: string;
  userInitials: string;
  onLogout: () => void;
  hasPendingChanges: boolean;
  isPublishing: boolean;
  publishStatusLabel: string | null;
  publishFailed: boolean;
  publishRunUrl: string | null;
  publishTracking: boolean;
  onStopPublishTracking?: () => void;
}

export function EditorTopBar({
  saveStatusText,
  saveStatusTone,
  saveDraftDisabled,
  saving,
  onSaveDraft,
  lastPublishedLabel,
  userInitials,
  onLogout,
  hasPendingChanges,
  isPublishing,
  publishStatusLabel,
  publishFailed,
  publishRunUrl,
  publishTracking,
  onStopPublishTracking,
}: Props) {
  const statusColor =
    saveStatusTone === 'warning'
      ? 'text-editor-warning'
      : saveStatusTone === 'error'
        ? 'text-editor-error'
        : 'text-editor-faint';

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-editor-border bg-white px-4 py-3.5 md:px-6">
      <div className="flex min-w-0 shrink-0 items-center gap-3 whitespace-nowrap">
        <img
          src="/bonae-logo.png"
          alt="Bonae Tech"
          width={30}
          height={30}
          className="h-[30px] w-[30px] shrink-0 rounded-[7px] object-contain"
        />
        <div className="shrink-0 whitespace-nowrap">
          <div className="text-[14.5px] font-bold tracking-[-0.01em] text-editor-text">
            Bonae Tech · Content
          </div>
          <div className="text-[11.5px] text-editor-faint">Marketing site editor</div>
        </div>
      </div>

      <WorkflowStepper
        hasPendingChanges={hasPendingChanges}
        isPublishing={isPublishing}
        publishStatusLabel={publishStatusLabel}
        publishFailed={publishFailed}
        publishRunUrl={publishRunUrl}
        publishTracking={publishTracking}
        onStopPublishTracking={onStopPublishTracking}
      />

      <div className="flex shrink-0 items-center gap-3 md:gap-3.5">
        <span className={`hidden text-xs font-semibold whitespace-nowrap sm:inline ${statusColor}`}>
          {saving && (
            <span
              className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          )}
          {saveStatusText}
        </span>
        <button
          type="button"
          className={`btn-editor-save ${saveDraftDisabled ? '' : 'btn-editor-save-active'}`}
          disabled={saveDraftDisabled || saving}
          onClick={onSaveDraft}
        >
          Save draft
        </button>
        <div className="hidden h-[22px] w-px bg-editor-border sm:block" aria-hidden />
        <div className="hidden text-xs whitespace-nowrap text-editor-faint sm:block">
          Last published <span className="font-semibold text-editor-muted">{lastPublishedLabel}</span>
        </div>
        <div className="hidden h-[22px] w-px bg-editor-border sm:block" aria-hidden />
        <UserMenu initials={userInitials} onLogout={onLogout} />
      </div>
    </header>
  );
}
