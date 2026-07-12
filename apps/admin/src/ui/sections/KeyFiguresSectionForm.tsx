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
  years: 'Valor de años',
  yearsLabel: 'Etiqueta de años',
  clientsValue: 'Valor de clientes',
  clients: 'Etiqueta de clientes',
  projectsValue: 'Valor de proyectos',
  projects: 'Etiqueta de proyectos',
  presenceValue: 'Valor de presencia',
  presenceLabel: 'Etiqueta de presencia',
  presence: 'Etiqueta corta de presencia',
  foundersCount: 'Cantidad de fundadoras',
  foundersLabel: 'Etiqueta de fundadoras',
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
    title: 'Experiencia',
    description: 'Primera tarjeta de cifras en el sitio',
    fields: ['years', 'yearsLabel'],
  },
  {
    title: 'Clientes',
    description: 'Segunda tarjeta de cifras',
    fields: ['clientsValue', 'clients'],
  },
  {
    title: 'Proyectos',
    description: 'Tercera tarjeta de cifras',
    fields: ['projectsValue', 'projects'],
  },
  {
    title: 'Presencia regional',
    description: 'Cuarta tarjeta de cifras',
    fields: ['presenceValue', 'presenceLabel'],
  },
  {
    title: 'Fundadoras (hero)',
    description: 'Se muestra en la barra lateral del hero en pantallas grandes',
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
      <SectionHeader title="Datos Clave" description="Tarjetas de cifras y contadores del Hero" />

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
          Avanzado: etiqueta corta de presencia
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
