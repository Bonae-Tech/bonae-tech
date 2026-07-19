import { useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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

type TemplatesFormValues = ContentDocument['templates'];

const defaultItem = (): TemplatesFormValues['items'][number] => ({
  category: '',
  title: '',
  description: '',
  imageSrc: '',
  href: '',
  comingSoon: false,
});

export function TemplatesSectionForm({ doc, onEdit, errors }: Props) {
  const docRef = useRef(doc);
  docRef.current = doc;

  const { register, control, watch } = useForm<TemplatesFormValues>({
    defaultValues: doc.templates,
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' });
  const values = watch();

  useFormEditSync(watch, (formValues) => {
    onEdit?.({ ...docRef.current, templates: formValues });
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Plantillas" description="Catálogo de plantillas en el sitio" />

      <FieldCard label="Etiqueta superior" error={getLocaleFieldError(errors, 'templates', 'sectionBadge')}>
        <input className="editor-input" {...register('sectionBadge')} />
      </FieldCard>

      <FieldCard
        label="Título de sección"
        counter={{ current: (values.title ?? '').length, max: 90 }}
        error={getLocaleFieldError(errors, 'templates', 'title')}
      >
        <input className="editor-input" {...register('title')} />
      </FieldCard>

      <FieldCard
        label="Subtítulo"
        counter={{ current: (values.subheadline ?? '').length, max: 280 }}
        error={getLocaleFieldError(errors, 'templates', 'subheadline')}
      >
        <textarea className="editor-textarea" {...register('subheadline')} />
      </FieldCard>

      <FieldCard label="Texto del botón" error={getLocaleFieldError(errors, 'templates', 'viewAllLabel')}>
        <input className="editor-input" {...register('viewAllLabel')} />
      </FieldCard>

      <FieldCard label="Enlace del botón" error={getLocaleFieldError(errors, 'templates', 'viewAllHref')}>
        <input className="editor-input" {...register('viewAllHref')} placeholder="#plantillas" />
      </FieldCard>

      <InlineCallout tone="warning">
        ES y EN deben tener la misma cantidad de plantillas. Agrega o quita tarjetas en ambos idiomas antes
        de publicar.
      </InlineCallout>

      <div className="flex items-center justify-between">
        <span className="editor-label">Tarjetas de plantilla</span>
        <button
          type="button"
          className="btn-editor-add"
          disabled={fields.length >= 6}
          onClick={() => append(defaultItem())}
        >
          + Agregar plantilla
        </button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="editor-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-editor-faint">Plantilla {index + 1}</span>
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
                disabled={fields.length <= 2}
                onClick={() => remove(index)}
              >
                Eliminar
              </button>
            </div>
          </div>
          <input className="editor-input" placeholder="Categoría" {...register(`items.${index}.category` as const)} />
          {getLocaleFieldError(errors, 'templates', 'items', index, 'category') && (
            <p className="editor-error-text">{getLocaleFieldError(errors, 'templates', 'items', index, 'category')}</p>
          )}
          <input className="editor-input" placeholder="Título" {...register(`items.${index}.title` as const)} />
          {getLocaleFieldError(errors, 'templates', 'items', index, 'title') && (
            <p className="editor-error-text">{getLocaleFieldError(errors, 'templates', 'items', index, 'title')}</p>
          )}
          <textarea
            className="editor-textarea-sm"
            placeholder="Descripción"
            {...register(`items.${index}.description` as const)}
          />
          {getLocaleFieldError(errors, 'templates', 'items', index, 'description') && (
            <p className="editor-error-text">
              {getLocaleFieldError(errors, 'templates', 'items', index, 'description')}
            </p>
          )}
          <input
            className="editor-input"
            placeholder="Ruta de imagen (/images/templates/...)"
            {...register(`items.${index}.imageSrc` as const)}
          />
          <input
            className="editor-input"
            placeholder="Enlace (opcional)"
            {...register(`items.${index}.href` as const)}
          />
          <label className="flex items-center gap-2 text-sm text-editor-muted">
            <input type="checkbox" {...register(`items.${index}.comingSoon` as const)} />
            Próximamente (sin imagen)
          </label>
        </div>
      ))}
    </div>
  );
}
