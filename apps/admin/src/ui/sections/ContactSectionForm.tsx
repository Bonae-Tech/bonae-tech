import { useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';
import { asBusinessHours, defaultBusinessHoursDays } from '@bonae/content/schema';
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

type ContactFormValues = {
  title: string;
  subtitle: string;
  hoursTitle: string;
  form: {
    name: string;
    email: string;
    phone: string;
    business: string;
    serviceType: string;
    message: string;
    submit: string;
    serviceOptions: Array<{ value: string }>;
  };
};

function readHoursTitle(hours: unknown): string {
  if (hours && typeof hours === 'object' && typeof (hours as { title?: unknown }).title === 'string') {
    return (hours as { title: string }).title;
  }
  if (typeof hours === 'string') {
    return hours;
  }
  return '';
}

export function ContactSectionForm({ doc, onEdit, errors }: Props) {
  const docRef = useRef(doc);
  docRef.current = doc;
  const parsedHours = asBusinessHours(doc.contact.hours);
  const hoursTitleDefault = parsedHours?.title ?? readHoursTitle(doc.contact.hours);

  // #region agent log
  fetch('http://127.0.0.1:7768/ingest/36033ee5-db8c-4429-bd42-cc7f53ef3b11',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'634e86'},body:JSON.stringify({sessionId:'634e86',runId:'rehydrate-debug',hypothesisId:'H2',location:'ContactSectionForm.tsx:mount',message:'contact form hours parse',data:{asBusinessHoursOk:Boolean(parsedHours),hoursTitleDefault,rawHoursType:typeof doc.contact.hours,rawDaysLen:doc.contact.hours&&typeof doc.contact.hours==='object'&&Array.isArray((doc.contact.hours as {days?:unknown}).days)?(doc.contact.hours as {days:unknown[]}).days.length:null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const { register, control, watch } = useForm<ContactFormValues>({
    defaultValues: {
      title: doc.contact.title,
      subtitle: doc.contact.subtitle,
      hoursTitle: hoursTitleDefault,
      form: {
        name: doc.contact.form.name,
        email: doc.contact.form.email,
        phone: doc.contact.form.phone,
        business: doc.contact.form.business,
        serviceType: doc.contact.form.serviceType,
        message: doc.contact.form.message,
        submit: doc.contact.form.submit,
        serviceOptions: doc.contact.form.serviceOptions.map((value) => ({ value })),
      },
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'form.serviceOptions',
  });
  const values = watch();

  useFormEditSync(watch, (formValues) => {
    const current = docRef.current;
    const existingHours = asBusinessHours(current.contact.hours);
    const nextDays = existingHours?.days ?? defaultBusinessHoursDays();
    // #region agent log
    fetch('http://127.0.0.1:7768/ingest/36033ee5-db8c-4429-bd42-cc7f53ef3b11',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'634e86'},body:JSON.stringify({sessionId:'634e86',runId:'rehydrate-debug',hypothesisId:'H3',location:'ContactSectionForm.tsx:sync',message:'contact form sync write hours',data:{formHoursTitle:formValues.hoursTitle??null,existingHoursOk:Boolean(existingHours),nextDaysLen:nextDays.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    onEdit?.({
      ...current,
      contact: {
        ...current.contact,
        title: formValues.title ?? '',
        subtitle: formValues.subtitle ?? '',
        hours: {
          title: formValues.hoursTitle ?? '',
          days: nextDays,
        },
        form: {
          ...current.contact.form,
          name: formValues.form?.name ?? '',
          email: formValues.form?.email ?? '',
          phone: formValues.form?.phone ?? '',
          business: formValues.form?.business ?? '',
          serviceType: formValues.form?.serviceType ?? '',
          message: formValues.form?.message ?? '',
          submit: formValues.form?.submit ?? '',
          serviceOptions: (formValues.form?.serviceOptions ?? []).map((opt) => opt?.value ?? ''),
        },
      },
    });
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Contacto" description="Sección y etiquetas del formulario" />

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

      <FieldCard
        label="Título del horario"
        error={getLocaleFieldError(errors, 'contact', 'hoursTitle')}
      >
        <input className="editor-input" {...register('hoursTitle')} />
      </FieldCard>

      <div className="pt-2">
        <span className="editor-label">Etiquetas del formulario</span>
      </div>

      <FieldCard
        label="Nombre completo"
        error={getLocaleFieldError(errors, 'contact', 'formName')}
      >
        <input className="editor-input" {...register('form.name')} />
      </FieldCard>

      <FieldCard
        label="Correo electrónico"
        error={getLocaleFieldError(errors, 'contact', 'formEmail')}
      >
        <input className="editor-input" {...register('form.email')} />
      </FieldCard>

      <FieldCard
        label="Teléfono / WhatsApp"
        error={getLocaleFieldError(errors, 'contact', 'formPhone')}
      >
        <input className="editor-input" {...register('form.phone')} />
      </FieldCard>

      <FieldCard
        label="Nombre del negocio"
        error={getLocaleFieldError(errors, 'contact', 'formBusiness')}
      >
        <input className="editor-input" {...register('form.business')} />
      </FieldCard>

      <FieldCard
        label="Tipo de servicio"
        error={getLocaleFieldError(errors, 'contact', 'formServiceType')}
      >
        <input className="editor-input" {...register('form.serviceType')} />
      </FieldCard>

      <FieldCard label="Mensaje" error={getLocaleFieldError(errors, 'contact', 'formMessage')}>
        <input className="editor-input" {...register('form.message')} />
      </FieldCard>

      <FieldCard
        label="Texto del botón"
        error={getLocaleFieldError(errors, 'contact', 'formSubmit')}
      >
        <input className="editor-input" {...register('form.submit')} />
      </FieldCard>

      <InlineCallout tone="warning">
        ES y EN deben tener la misma cantidad de opciones de servicio. Agrega o quita opciones en
        ambos idiomas antes de publicar.
      </InlineCallout>

      <div className="flex items-center justify-between">
        <span className="editor-label">Opciones de tipo de servicio</span>
        <button
          type="button"
          className="btn-editor-add"
          disabled={fields.length >= 12}
          onClick={() => append({ value: '' })}
        >
          + Agregar opción
        </button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="editor-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-editor-faint">
              Opción {index + 1}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="btn-editor-mini"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
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
                Eliminar
              </button>
            </div>
          </div>
          <input
            className="editor-input"
            placeholder="Etiqueta de la opción"
            {...register(`form.serviceOptions.${index}.value` as const)}
          />
          {getLocaleFieldError(errors, 'contact', `serviceOption.${index}`) && (
            <p className="editor-error-text">
              {getLocaleFieldError(errors, 'contact', `serviceOption.${index}`)}
            </p>
          )}
        </div>
      ))}

      <InlineCallout>
        Los canales están en <strong className="text-editor-brand">Configuración del sitio</strong>.
      </InlineCallout>
    </div>
  );
}
