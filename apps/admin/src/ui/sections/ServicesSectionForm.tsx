import { useFieldArray, useForm } from 'react-hook-form';
import { serviceCardIcons, type ContentDocument } from '@bonae/content';

interface Props {
  doc: ContentDocument;
  onSave: (doc: ContentDocument) => void;
  saving?: boolean;
}

type ServicesFormValues = ContentDocument['services'];

export function ServicesSectionForm({ doc, onSave, saving }: Props) {
  const { register, control, handleSubmit } = useForm<ServicesFormValues>({
    defaultValues: doc.services,
  });

  const { fields: categories, append: appendCategory, remove: removeCategory } = useFieldArray({
    control,
    name: 'categories',
  });

  return (
    <form
      className="card space-y-4"
      onSubmit={handleSubmit((services) => onSave({ ...doc, services }))}
    >
      <h2 className="text-lg font-bold">Services</h2>
      <input className="field-input" placeholder="Section badge" {...register('sectionBadge')} />
      <input className="field-input" placeholder="Title" {...register('title')} />
      <input className="field-input" placeholder="Subtitle" {...register('subtitle')} />

      {categories.map((category, categoryIndex) => (
        <CategoryFields
          key={category.id}
          categoryIndex={categoryIndex}
          register={register}
          control={control}
          onRemove={() => removeCategory(categoryIndex)}
        />
      ))}

      <button
        type="button"
        className="btn-secondary"
        onClick={() => appendCategory({ title: 'New category', columns: 3, items: [{ icon: 'web', title: '', description: '' }] })}
      >
        Add category
      </button>

      <textarea className="field-input min-h-[80px]" placeholder="Closing note" {...register('expansion')} />
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
    </form>
  );
}

interface CategoryFieldsProps {
  categoryIndex: number;
  register: ReturnType<typeof useForm<ServicesFormValues>>['register'];
  control: ReturnType<typeof useForm<ServicesFormValues>>['control'];
  onRemove: () => void;
}

function CategoryFields({ categoryIndex, register, control, onRemove }: CategoryFieldsProps) {
  const { fields: items, append, remove } = useFieldArray({
    control,
    name: `categories.${categoryIndex}.items`,
  });

  return (
    <div className="rounded-lg border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-slate-500">Category {categoryIndex + 1}</p>
        <button type="button" className="text-sm text-red-600 hover:underline" onClick={onRemove}>
          Remove category
        </button>
      </div>
      <input className="field-input" placeholder="Category title" {...register(`categories.${categoryIndex}.title`)} />
      <select className="field-input" {...register(`categories.${categoryIndex}.columns`, { valueAsNumber: true })}>
        <option value={1}>1 column</option>
        <option value={2}>2 columns</option>
        <option value={3}>3 columns</option>
      </select>

      {items.map((item, itemIndex) => (
        <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-500">Card {itemIndex + 1}</p>
            <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => remove(itemIndex)}>
              Remove card
            </button>
          </div>
          <select className="field-input" {...register(`categories.${categoryIndex}.items.${itemIndex}.icon`)}>
            {serviceCardIcons.map((icon) => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
          <input className="field-input" placeholder="Title" {...register(`categories.${categoryIndex}.items.${itemIndex}.title`)} />
          <textarea className="field-input min-h-[80px]" placeholder="Description" {...register(`categories.${categoryIndex}.items.${itemIndex}.description`)} />
        </div>
      ))}

      <button
        type="button"
        className="btn-secondary"
        onClick={() => append({ icon: 'web', title: '', description: '' })}
      >
        Add card
      </button>
    </div>
  );
}
