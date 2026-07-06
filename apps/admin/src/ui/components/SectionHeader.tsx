interface Props {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="editor-chip">{title}</span>
      {description && <span className="text-xs text-editor-faint">{description}</span>}
    </div>
  );
}
