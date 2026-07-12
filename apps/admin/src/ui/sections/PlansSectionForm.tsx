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

type PlansFields = ContentDocument['plans'];

const FIELD_LABELS: Record<keyof PlansFields, string> = {
  title: 'Título',
  subtitle: 'Subtítulo',
  cta: 'Texto del botón',
};

const COUNTERS: Partial<Record<keyof PlansFields, number>> = {
  title: 90,
  subtitle: 240,
  cta: 40,
};

export function PlansSectionForm({ doc, onEdit, errors }: Props) {
  const docRef = useRef(doc);
  docRef.current = doc;

  const { register, watch } = useForm<PlansFields>({ defaultValues: doc.plans });
  const values = watch();

  useFormEditSync(watch, (formValues) => {
    onEdit?.({ ...docRef.current, plans: formValues });
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="CTA" description="Bloque de llamado a la acción" />

      <FieldCard
        label={FIELD_LABELS.title}
        counter={{ current: (values.title ?? '').length, max: COUNTERS.title! }}
        error={getLocaleFieldError(errors, 'plans', 'title')}
      >
        <input className="editor-input" {...register('title')} />
      </FieldCard>

      <FieldCard
        label={FIELD_LABELS.subtitle}
        counter={{ current: (values.subtitle ?? '').length, max: COUNTERS.subtitle! }}
        error={getLocaleFieldError(errors, 'plans', 'subtitle')}
      >
        <textarea className="editor-textarea" {...register('subtitle')} />
      </FieldCard>

      <FieldCard
        label={FIELD_LABELS.cta}
        counter={{ current: (values.cta ?? '').length, max: COUNTERS.cta! }}
        error={getLocaleFieldError(errors, 'plans', 'cta')}
      >
        <input className="editor-input" {...register('cta')} />
      </FieldCard>

      <InlineCallout>
        El botón abre WhatsApp. El número está en{' '}
        <strong className="text-editor-brand">Configuración del sitio</strong>.
      </InlineCallout>
    </div>
  );
}
