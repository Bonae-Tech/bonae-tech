interface Props {
  message?: string | null;
}

export function FieldError({ message }: Props) {
  if (!message) {
    return null;
  }
  return <p className="editor-error-text">{message}</p>;
}
