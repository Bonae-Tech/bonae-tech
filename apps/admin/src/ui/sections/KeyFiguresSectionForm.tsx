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

type KeyFiguresFields = ContentDocument['keyFigures'];

const FIELD_LABELS: Record<keyof KeyFiguresFields, string> = {
  years: 'Years value',
  yearsLabel: 'Years label',
  clientsValue: 'Clients value',
  clients: 'Clients label',
  projectsValue: 'Projects value',
  projects: 'Projects label',
  presenceValue: 'Presence value',
  presenceLabel: 'Presence label',
  presence: 'Presence short label',
  foundersCount: 'Founders count',
  foundersLabel: 'Founders label',
};

const COUNTERS: Partial<Record<keyof KeyFiguresFields, number>> = {
  years: 20,
  yearsLabel: 80,
  clientsValue: 20,
  clients: 80,
  projectsValue: 20,
  projects: 80,
  presenceValue: 20,
  presenceLabel: 80,
  presence: 40,
  foundersCount: 20,
  foundersLabel: 40,
};

const GROUPS: { title: string; description: string; fields: (keyof KeyFiguresFields)[] }[] = [
  {
    title: 'Experience',
    description: 'First stat card on the site',
    fields: ['years', 'yearsLabel'],
  },
  {
    title: 'Clients',
    description: 'Second stat card',
    fields: ['clientsValue', 'clients'],
  },
  {
    title: 'Projects',
    description: 'Third stat card',
    fields: ['projectsValue', 'projects'],
  },
  {
    title: 'Regional presence',
    description: 'Fourth stat card',
    fields: ['presenceValue', 'presenceLabel'],
  },
  {
    title: 'Founders (hero)',
    description: 'Shown in the hero sidebar on large screens',
    fields: ['foundersCount', 'foundersLabel'],
  },
];

export function KeyFiguresSectionForm({ doc, onEdit, errors }: Props) {
  const docRef = useRef(doc);
  docRef.current = doc;

  const { register, watch } = useForm<KeyFiguresFields>({ defaultValues: doc.keyFigures });
  const values = watch();

  useFormEditSync(watch, (formValues) => {
    onEdit?.({ ...docRef.current, keyFigures: formValues });
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="DatosClave" description="Stat cards and hero counters" />

      {GROUPS.map((group) => (
        <div key={group.title} className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-editor-text">{group.title}</h3>
            <p className="text-xs text-editor-muted">{group.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <FieldCard
                key={field}
                label={FIELD_LABELS[field]}
                counter={
                  COUNTERS[field]
                    ? { current: (values[field] ?? '').length, max: COUNTERS[field]! }
                    : undefined
                }
                error={getLocaleFieldError(errors, 'keyFigures', field)}
              >
                <input className="editor-input" {...register(field)} />
              </FieldCard>
            ))}
          </div>
        </div>
      ))}

      <details className="editor-card">
        <summary className="cursor-pointer text-xs font-semibold text-editor-muted">
          Advanced: presence short label
        </summary>
        <input className="editor-input mt-2" {...register('presence')} />
        {getLocaleFieldError(errors, 'keyFigures', 'presence') && (
          <p className="mt-1 text-xs text-editor-error">
            {getLocaleFieldError(errors, 'keyFigures', 'presence')}
          </p>
        )}
      </details>
    </div>
  );
}
