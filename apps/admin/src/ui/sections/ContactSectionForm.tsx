import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';
import type { LocaleSectionErrors } from '../../hooks/useFieldValidation.js';
import { getLocaleFieldError } from '../../hooks/useFieldValidation.js';
import { FieldCard } from '../components/FieldCard.js';
import { SectionHeader } from '../components/SectionHeader.js';
import { InlineCallout } from '../components/InlineCallout.js';

interface Props {
  doc: ContentDocument;
  onEdit?: (doc: ContentDocument) => void;
  errors: LocaleSectionErrors;
}

export function ContactSectionForm({ doc, onEdit, errors }: Props) {
  const { register, watch } = useForm({
    defaultValues: {
      title: doc.contact.title,
      subtitle: doc.contact.subtitle,
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
      contact: {
        ...doc.contact,
        title: values.title,
        subtitle: values.subtitle,
      },
    });
  }, [values]);

  return (
    <div className="space-y-4">
      <SectionHeader title="Contact" />

      <FieldCard label="Title" error={getLocaleFieldError(errors, 'contact', 'title')}>
        <input className="editor-input" {...register('title')} />
      </FieldCard>

      <FieldCard
        label="Description"
        counter={{ current: (values.subtitle ?? '').length, max: 240 }}
        error={getLocaleFieldError(errors, 'contact', 'subtitle')}
      >
        <textarea className="editor-textarea" {...register('subtitle')} />
      </FieldCard>

      <InlineCallout>
        Channels live under <strong className="text-editor-brand">Site settings</strong>.
      </InlineCallout>
    </div>
  );
}
