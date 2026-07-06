interface Props {
  value: unknown;
}

export function JsonReadOnlyViewer({ value }: Props) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-[10px] bg-editor-code p-4 font-mono text-[11.5px] leading-relaxed text-editor-codeText">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
