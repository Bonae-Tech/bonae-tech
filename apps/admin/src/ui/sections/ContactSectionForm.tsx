import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';
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

export function ContactSectionForm({ doc, onEdit, errors }: Props) {
  const docRef = useRef(doc);
  docRef.current = doc;

  const { register, watch } = useForm({
    defaultValues: {
      title: doc.contact.title,
      subtitle: doc.contact.subtitle,
    },
  });
  const values = watch();

  useFormEditSync(watch, (formValues) => {
    onEdit?.({
      ...docRef.current,
      contact: {
        ...docRef.current.contact,
        title: formValues.title ?? '',
        subtitle: formValues.subtitle ?? '',
      },
    });
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Contacto" />

      <FieldCard label="Título" error={getLocaleFieldError(errors, 'contact', 'title')}>
        <input className="editor-input" {...register('title')} />
      </FieldCard>

      <FieldCard
        label="Descripción"
        counter={{ current: (values.subtitle ?? '').length, max: 240 }}
        error={getLocaleFieldError(errors, 'contact', 'subtitle')}
      >
        <textarea className="editor-textarea" {...register('subtitle')} />
      </FieldCard>

      <InlineCallout>
        Los canales están en <strong className="text-editor-brand">Configuración del sitio</strong>.
      </InlineCallout>
    </div>
  );
}
