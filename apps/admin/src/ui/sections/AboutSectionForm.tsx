import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';

interface Props {
  doc: ContentDocument;
  onSave: () => void;
  onEdit?: (doc: ContentDocument) => void;
  saving?: boolean;
}

export function AboutSectionForm({ doc, onSave, onEdit, saving }: Props) {
  const { register, watch } = useForm({
    defaultValues: {
      sectionBadge: doc.about.sectionBadge,
      title: doc.about.title,
      foundersTitle: doc.about.foundersTitle,
    },
  });
  const values = watch();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onEdit?.({
      ...doc,
      about: {
        ...doc.about,
        sectionBadge: values.sectionBadge,
        title: values.title,
        foundersTitle: values.foundersTitle,
      },
    });
  }, [values]);

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
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
