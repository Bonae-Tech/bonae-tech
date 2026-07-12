import { useRef } from 'react';
import { useForm } from 'react-hook-form';
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

type HeroFields = ContentDocument['hero'];

const FIELD_LABELS: Record<keyof HeroFields, string> = {
  badge: 'Insignia',
  headline: 'Titular',
  subheadline: 'Subtítulo',
  cta: 'Botón principal',
  ctaSecondary: 'Botón secundario',
  ctaSub: 'Nota de confianza',
};

const COUNTERS: Partial<Record<keyof HeroFields, number>> = {
  badge: 60,
  headline: 90,
  subheadline: 240,
};

export function HeroSectionForm({ doc, onEdit, errors }: Props) {
  const docRef = useRef(doc);
  docRef.current = doc;

  const { register, watch } = useForm<HeroFields>({ defaultValues: doc.hero });
  const values = watch();

  useFormEditSync(watch, (formValues) => {
    onEdit?.({ ...docRef.current, hero: formValues });
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Hero" description="Lo primero que ven los visitantes" />

      {(['badge', 'headline', 'subheadline'] as const).map((field) => (
        <FieldCard
          key={field}
          label={FIELD_LABELS[field]}
          counter={COUNTERS[field] ? { current: (values[field] ?? '').length, max: COUNTERS[field]! } : undefined}
          error={getLocaleFieldError(errors, 'hero', field)}
        >
          {field === 'subheadline' ? (
            <textarea className="editor-textarea" {...register(field)} />
          ) : (
            <input className="editor-input" {...register(field)} />
          )}
        </FieldCard>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        {(['cta', 'ctaSecondary'] as const).map((field) => (
          <FieldCard key={field} label={FIELD_LABELS[field]} error={getLocaleFieldError(errors, 'hero', field)}>
            <input className="editor-input" {...register(field)} />
          </FieldCard>
        ))}
      </div>

      <FieldCard label={FIELD_LABELS.ctaSub} error={getLocaleFieldError(errors, 'hero', 'ctaSub')}>
        <input className="editor-input" {...register('ctaSub')} />
      </FieldCard>
    </div>
  );
}
