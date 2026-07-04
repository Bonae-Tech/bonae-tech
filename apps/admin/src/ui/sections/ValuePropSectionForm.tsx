import { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { ContentDocument, ValuePropIcon } from '@bonae/content';

interface Props {
  doc: ContentDocument;
  onSave: () => void;
  onEdit?: (doc: ContentDocument) => void;
  saving?: boolean;
}

const valuePropIconOptions: ValuePropIcon[] = ['accessible', 'simple', 'secure', 'close', 'education'];

type ValuePropFormValues = {
  sectionBadge: string;
  title: string;
  subheadline: string;
  items: Array<{
    icon: ValuePropIcon;
    title: string;
    description: string;
    backLabel: string;
    backDescription: string;
  }>;
};

const defaultItem = (): ValuePropFormValues['items'][number] => ({
  icon: 'accessible',
  title: '',
  description: '',
  backLabel: '',
  backDescription: '',
});

export function ValuePropSectionForm({ doc, onSave, onEdit, saving }: Props) {
  const { register, control, watch } = useForm<ValuePropFormValues>({
    defaultValues: {
      sectionBadge: doc.valueProp.sectionBadge,
      title: doc.valueProp.title,
      subheadline: doc.valueProp.subheadline,
      items: doc.valueProp.items,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const values = watch();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onEdit?.({ ...doc, valueProp: { ...doc.valueProp, ...values } });
  }, [values]);

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h2 className="text-lg font-bold">Value proposition</h2>
      <input className="field-input" placeholder="Section badge" {...register('sectionBadge')} />
      <input className="field-input" placeholder="Title" {...register('title')} />
      <textarea className="field-input min-h-[80px]" placeholder="Subheadline" {...register('subheadline')} />

      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        ES and EN must have the same number of cards. Add or remove cards in both locales before publishing.
      </p>

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold uppercase text-slate-500">Card {index + 1}</label>
            <button
              type="button"
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={fields.length <= 1}
              onClick={() => remove(index)}
            >
              Remove
            </button>
          </div>
          <select className="field-input" {...register(`items.${index}.icon` as const)}>
            {valuePropIconOptions.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
          <input className="field-input" placeholder="Title (frente)" {...register(`items.${index}.title` as const)} />
          <textarea
            className="field-input min-h-[80px]"
            placeholder="Descripción (frente)"
            {...register(`items.${index}.description` as const)}
          />
          <input
            className="field-input"
            placeholder="Etiqueta reverso (ej. Nuestra propuesta, Accesible…)"
            {...register(`items.${index}.backLabel` as const)}
          />
          <textarea
            className="field-input min-h-[80px]"
            placeholder="Texto reverso"
            {...register(`items.${index}.backDescription` as const)}
          />
        </div>
      ))}

      <button
        type="button"
        className="btn-secondary w-full"
        disabled={fields.length >= 8}
        onClick={() => append(defaultItem())}
      >
        Add card
      </button>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save draft'}
      </button>
    </form>
  );
}
