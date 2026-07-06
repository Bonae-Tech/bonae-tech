import { PublishStatusIndicator } from '../components/PublishStatusIndicator.js';

interface Props {
  hasPendingChanges: boolean;
  isPublishing: boolean;
  publishStatusLabel: string | null;
  publishFailed: boolean;
  publishRunUrl: string | null;
  publishTracking: boolean;
  onStopPublishTracking?: () => void;
}

export function WorkflowStepper({
  hasPendingChanges,
  isPublishing,
  publishStatusLabel,
  publishFailed,
  publishRunUrl,
  publishTracking,
  onStopPublishTracking,
}: Props) {
  const activeStep = isPublishing ? 2 : hasPendingChanges ? 1 : 0;

  const steps = [
    { num: '1', label: 'Draft' },
    { num: '2', label: 'Review' },
    { num: '3', label: 'Publish' },
  ];

  return (
    <div className="hidden items-center gap-4 lg:flex">
      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isComplete = index < activeStep;
        const dotClass = isActive
          ? 'bg-editor-brand text-white'
          : isComplete
            ? 'bg-editor-successBg text-editor-success'
            : 'bg-editor-track text-editor-faint';
        const labelClass = isActive ? 'text-editor-text' : 'text-editor-faint';

        return (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={`flex h-[19px] w-[19px] items-center justify-center rounded-full text-[10.5px] font-extrabold ${dotClass}`}
            >
              {step.num}
            </div>
            <span className={`text-xs font-semibold ${labelClass}`}>{step.label}</span>
            {index < steps.length - 1 && <span className="text-[13px] text-editor-border">›</span>}
          </div>
        );
      })}
      {isPublishing && publishStatusLabel && (
        <PublishStatusIndicator
          label={publishStatusLabel}
          runUrl={publishRunUrl}
          failed={publishFailed}
          tracking={publishTracking}
          onStopTracking={onStopPublishTracking}
        />
      )}
    </div>
  );
}
