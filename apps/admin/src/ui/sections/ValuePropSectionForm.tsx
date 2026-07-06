import { useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { ContentDocument, ValuePropIcon } from '@bonae/content';
import type { LocaleSectionErrors } from '../../hooks/useFieldValidation.js';
import { getLocaleFieldError } from '../../hooks/useFieldValidation.js';
import { useFormEditSync } from '../../hooks/useFormEditSync.js';
import { FieldCard } from '../components/FieldCard.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { InlineCallout } from '../components/InlineCallout.js';

interface Props {
  doc: ContentDocument;
  onEdit?: (doc: ContentDocument) => void;
  errors: LocaleSectionErrors;
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

export function ValuePropSectionForm({ doc, onEdit, errors }: Props) {
  const docRef = useRef(doc);
  docRef.current = doc;
  const syncCount = useRef(0);

  const { register, control, watch } = useForm<ValuePropFormValues>({
    defaultValues: {
      sectionBadge: doc.valueProp.sectionBadge,
      title: doc.valueProp.title,
      subheadline: doc.valueProp.subheadline,
      items: doc.valueProp.items,
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' });
  const values = watch();
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useFormEditSync(watch, (formValues) => {
    syncCount.current += 1;
    // #region agent log
    fetch('http://127.0.0.1:7768/ingest/36033ee5-db8c-4429-bd42-cc7f53ef3b11',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'65ab30'},body:JSON.stringify({sessionId:'65ab30',location:'ValuePropSectionForm.tsx:sync',message:'onSync fired',data:{syncCount:syncCount.current,itemsLen:formValues.items?.length},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    const current = docRef.current;
    onEdit?.({ ...current, valueProp: { ...current.valueProp, ...formValues } });
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Services" description="Grid of what you offer" />

      <FieldCard label="Eyebrow label" error={getLocaleFieldError(errors, 'valueProp', 'sectionBadge')}>
        <input className="editor-input" {...register('sectionBadge')} />
      </FieldCard>

      <FieldCard
        label="Section title"
        counter={{ current: (values.title ?? '').length, max: 90 }}
        error={getLocaleFieldError(errors, 'valueProp', 'title')}
      >
        <input className="editor-input" {...register('title')} />
      </FieldCard>

      <InlineCallout tone="warning">
        ES and EN must have the same number of cards. Add or remove cards in both locales before publishing.
      </InlineCallout>

      <div className="flex items-center justify-between">
        <span className="editor-label">Service cards</span>
        <button
          type="button"
          className="btn-editor-add"
          disabled={fields.length >= 8}
          onClick={() => append(defaultItem())}
        >
          + Add card
        </button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="editor-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-editor-faint">Card {index + 1}</span>
            <div className="flex gap-1.5">
              <button type="button" className="btn-editor-mini" disabled={index === 0} onClick={() => move(index, index - 1)}>
                ↑
              </button>
              <button
                type="button"
                className="btn-editor-mini"
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn-editor-mini-danger"
                disabled={fields.length <= 1}
                onClick={() => remove(index)}
              >
                Remove
              </button>
            </div>
          </div>
          <input className="editor-input" placeholder="Title" {...register(`items.${index}.title` as const)} />
          {getLocaleFieldError(errors, 'valueProp', 'items', index, 'title') && (
            <p className="editor-error-text">{getLocaleFieldError(errors, 'valueProp', 'items', index, 'title')}</p>
          )}
          <textarea className="editor-textarea-sm" placeholder="Description" {...register(`items.${index}.description` as const)} />
          {getLocaleFieldError(errors, 'valueProp', 'items', index, 'description') && (
            <p className="editor-error-text">
              {getLocaleFieldError(errors, 'valueProp', 'items', index, 'description')}
            </p>
          )}
          <button
            type="button"
            className="text-xs font-semibold text-editor-muted underline"
            onClick={() => setExpandedCards((s) => ({ ...s, [field.id]: !s[field.id] }))}
          >
            {expandedCards[field.id] ? 'Hide card details' : 'Card details (flip side)'}
          </button>
          {expandedCards[field.id] && (
            <div className="space-y-2 border-t border-editor-track pt-2">
              <select className="editor-input" {...register(`items.${index}.icon` as const)}>
                {valuePropIconOptions.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <input className="editor-input" placeholder="Back label" {...register(`items.${index}.backLabel` as const)} />
              <textarea
                className="editor-textarea-sm"
                placeholder="Back description"
                {...register(`items.${index}.backDescription` as const)}
              />
            </div>
          )}
        </div>
      ))}

      <details className="editor-card">
        <summary className="cursor-pointer text-xs font-semibold text-editor-muted">Advanced: section subheadline</summary>
        <textarea className="editor-textarea mt-2" {...register('subheadline')} />
      </details>
    </div>
  );
}
