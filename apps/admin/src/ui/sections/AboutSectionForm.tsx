import { useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';
import type { LocaleSectionErrors } from '../../hooks/useFieldValidation.js';
import { getLocaleFieldError } from '../../hooks/useFieldValidation.js';
import { useFormEditSync } from '../../hooks/useFormEditSync.js';
import { FieldCard } from '../components/FieldCard.js';
import { SectionHeader } from '../components/SectionHeader.js';

interface Props {
  doc: ContentDocument;
  onEdit?: (doc: ContentDocument) => void;
  errors: LocaleSectionErrors;
}

type AboutFormValues = {
  sectionBadge: string;
  title: string;
  foundersTitle: string;
  members: ContentDocument['about']['members'];
};

export function AboutSectionForm({ doc, onEdit, errors }: Props) {
  const docRef = useRef(doc);
  docRef.current = doc;

  const { register, control, watch, setValue: setFormValue } = useForm<AboutFormValues>({
    defaultValues: {
      sectionBadge: doc.about.sectionBadge,
      title: doc.about.title,
      foundersTitle: doc.about.foundersTitle,
      members: doc.about.members,
    },
  });
  const { fields } = useFieldArray({ control, name: 'members' });
  const values = watch();
  const [expandedMember, setExpandedMember] = useState<Record<string, boolean>>({});

  useFormEditSync(watch, (formValues) => {
    onEdit?.({
      ...docRef.current,
      about: {
        ...docRef.current.about,
        sectionBadge: formValues.sectionBadge,
        title: formValues.title,
        foundersTitle: formValues.foundersTitle,
        members: formValues.members,
      },
    });
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="About" description="Story and founders" />

      <FieldCard label="Title" error={getLocaleFieldError(errors, 'about', 'title')}>
        <input className="editor-input" {...register('title')} />
      </FieldCard>

      <FieldCard
        label="Description"
        counter={{ current: (values.foundersTitle ?? '').length, max: 300 }}
        error={getLocaleFieldError(errors, 'about', 'foundersTitle')}
      >
        <textarea className="editor-textarea" {...register('foundersTitle')} />
      </FieldCard>

      <details className="editor-card">
        <summary className="cursor-pointer text-xs font-semibold text-editor-muted">Advanced: section badge</summary>
        <input className="editor-input mt-2" {...register('sectionBadge')} />
      </details>

      <span className="editor-label">Founders</span>

      {fields.map((field, index) => (
        <div key={field.id} className="editor-card space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <input
                className="editor-input"
                placeholder="Name / initials"
                {...register(`members.${index}.initials` as const)}
              />
              {getLocaleFieldError(errors, 'about', 'founders', index, 'name') && (
                <p className="editor-error-text">
                  {getLocaleFieldError(errors, 'about', 'founders', index, 'name')}
                </p>
              )}
            </div>
            <div>
              <input className="editor-input" placeholder="Role" {...register(`members.${index}.role` as const)} />
              {getLocaleFieldError(errors, 'about', 'founders', index, 'role') && (
                <p className="editor-error-text">
                  {getLocaleFieldError(errors, 'about', 'founders', index, 'role')}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-editor-muted underline"
            onClick={() => setExpandedMember((s) => ({ ...s, [field.id]: !s[field.id] }))}
          >
            {expandedMember[field.id] ? 'Hide bio & highlights' : 'Bio & highlights'}
          </button>
          {expandedMember[field.id] && (
            <div className="space-y-2 border-t border-editor-track pt-2">
              <textarea className="editor-textarea-sm" {...register(`members.${index}.bio` as const)} />
              <input
                className="editor-input"
                placeholder="Highlights (comma-separated)"
                value={(values.members[index]?.highlights ?? []).join(', ')}
                onChange={(e) => {
                  const highlights = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setFormValue(`members.${index}.highlights`, highlights.length ? highlights : ['—'], {
                    shouldDirty: true,
                  });
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
