import { SectionHeader } from '../components/SectionHeader.js';
import { JsonReadOnlyViewer } from '../components/JsonReadOnlyViewer.js';

interface Props {
  value: unknown;
}

export function AdvancedJsonSection({ value }: Props) {
  return (
    <div className="space-y-3">
      <SectionHeader title="JSON" description="Read-only export" />
      <JsonReadOnlyViewer value={value} />
    </div>
  );
}
