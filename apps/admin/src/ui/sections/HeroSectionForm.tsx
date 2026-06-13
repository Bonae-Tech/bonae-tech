import { useForm } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';

interface Props {
  doc: ContentDocument;
  onSave: (doc: ContentDocument) => void;
  saving?: boolean;
}

type HeroFields = ContentDocument['hero'];

export function HeroSectionForm({ doc, onSave, saving }: Props) {
  const { register, handleSubmit } = useForm<HeroFields>({ defaultValues: doc.hero });

  return (
    <form
      className="card space-y-4"
      onSubmit={handleSubmit((hero) => onSave({ ...doc, hero }))}
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
