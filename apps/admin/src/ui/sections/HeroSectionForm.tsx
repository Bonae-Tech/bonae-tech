import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';

interface Props {
  doc: ContentDocument;
  onSave: () => void;
  onEdit?: (doc: ContentDocument) => void;
  saving?: boolean;
}

type HeroFields = ContentDocument['hero'];

export function HeroSectionForm({ doc, onSave, onEdit, saving }: Props) {
  const { register, watch } = useForm<HeroFields>({ defaultValues: doc.hero });
  const values = watch();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onEdit?.({ ...doc, hero: values });
  }, [values]);

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h2 className="text-lg font-bold">Hero</h2>
      {(['badge', 'headline', 'subheadline', 'cta', 'ctaSecondary', 'ctaSub'] as const).map((field) => (
        <div key={field}>
          <label className="field-label">{field}</label>
          {field === 'subheadline' ? (
            <textarea className="field-input min-h-[100px]" {...register(field)} />
          ) : (
            <input className="field-input" {...register(field)} />
          )}
        </div>
      ))}
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
    </form>
  );
}
