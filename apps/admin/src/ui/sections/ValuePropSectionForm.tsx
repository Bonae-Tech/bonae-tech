import { useForm } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';

interface Props {
  doc: ContentDocument;
  onSave: (doc: ContentDocument) => void;
  saving?: boolean;
}

export function ValuePropSectionForm({ doc, onSave, saving }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      sectionBadge: doc.valueProp.sectionBadge,
      title: doc.valueProp.title,
      items: doc.valueProp.items,
    },
  });

  return (
    <form
      className="card space-y-4"
      onSubmit={handleSubmit((valueProp) => onSave({ ...doc, valueProp: { ...doc.valueProp, ...valueProp } }))}
    >
      <h2 className="text-lg font-bold">Value proposition</h2>
      <input className="field-input" placeholder="Section badge" {...register('sectionBadge')} />
      <input className="field-input" placeholder="Title" {...register('title')} />
      {doc.valueProp.items.map((item, index) => (
        <div key={item.icon} className="rounded-lg border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">{item.icon}</p>
          <input className="field-input" {...register(`items.${index}.title` as const)} />
          <textarea className="field-input min-h-[80px]" {...register(`items.${index}.description` as const)} />
        </div>
      ))}
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
    </form>
  );
}
