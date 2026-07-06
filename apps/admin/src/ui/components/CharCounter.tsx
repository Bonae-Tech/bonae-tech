interface Props {
  current: number;
  max: number;
}

export function CharCounter({ current, max }: Props) {
  const over = current > max;
  return (
    <span className={`editor-counter ${over ? 'text-editor-error' : ''}`}>
      {current}/{max}
    </span>
  );
}
