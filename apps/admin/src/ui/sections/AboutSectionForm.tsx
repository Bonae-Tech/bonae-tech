import { useForm } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';

interface Props {
  doc: ContentDocument;
  onSave: (doc: ContentDocument) => void;
  saving?: boolean;
}

export function AboutSectionForm({ doc, onSave, saving }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      sectionBadge: doc.about.sectionBadge,
      title: doc.about.title,
      foundersTitle: doc.about.foundersTitle,
    },
  });

  return (
    <form
      className="card space-y-4"
      onSubmit={handleSubmit((values) =>
        onSave({
          ...doc,
          about: {
            ...doc.about,
            sectionBadge: values.sectionBadge,
            title: values.title,
            foundersTitle: values.foundersTitle,
          },
        }),
      )}
    >
      <h2 className="text-lg font-bold">About / team</h2>
      <input className="field-input" placeholder="Section badge" {...register('sectionBadge')} />
      <input className="field-input" placeholder="Title" {...register('title')} />
      <input className="field-input" placeholder="Founders title" {...register('foundersTitle')} />
      <p className="text-sm text-slate-500">
        Team member bios and highlights can be edited in Advanced JSON.
      </p>
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
    </form>
  );
}
