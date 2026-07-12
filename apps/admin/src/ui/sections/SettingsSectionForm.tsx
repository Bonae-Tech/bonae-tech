import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ContentDocument, SiteSettings } from '@bonae/content';
import {
  readSettingsForm,
  type SettingsFormValues,
} from '../../infrastructure/settingsEditorAdapter.js';
import type { FieldErrors } from '../../hooks/useFieldValidation.js';
import { useFormEditSync } from '../../hooks/useFormEditSync.js';
import { FieldCard } from '../components/FieldCard.js';
import { SectionHeader } from '../components/SectionHeader.js';

interface Props {
  draftEs: ContentDocument;
  draftEn: ContentDocument;
  settings: SiteSettings;
  onApply: (values: SettingsFormValues) => void;
  errors: FieldErrors;
}

export function SettingsSectionForm({ draftEs, settings, onApply, errors }: Props) {
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  const { register, watch } = useForm<SettingsFormValues>({
    defaultValues: readSettingsForm(draftEs, settings),
  });
  const values = watch();
  const [moreOpen, setMoreOpen] = useState(false);

  useFormEditSync(watch, (formValues) => {
    onApplyRef.current(formValues);
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Configuración" description="Compartido entre idiomas" />

      <FieldCard
        label="Nombre del sitio"
        counter={{ current: (values.siteName ?? '').length, max: 40 }}
        error={errors.siteName}
      >
        <input className="editor-input" {...register('siteName')} />
      </FieldCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldCard label="Número de WhatsApp" error={errors.whatsapp}>
          <input className="editor-input" {...register('whatsapp')} />
        </FieldCard>
        <FieldCard label="Correo de contacto" error={errors.email}>
          <input className="editor-input" type="email" {...register('email')} />
        </FieldCard>
      </div>

      <FieldCard label="Dirección" error={errors.address}>
        <input className="editor-input" {...register('address')} />
      </FieldCard>

      <FieldCard label="Texto del pie de página" error={errors.footerText}>
        <input className="editor-input" {...register('footerText')} />
      </FieldCard>

      <button
        type="button"
        className="text-xs font-semibold text-editor-muted underline"
        onClick={() => setMoreOpen((v) => !v)}
      >
        {moreOpen ? 'Ocultar más configuración' : 'Más configuración (URL y redes)'}
      </button>

      {moreOpen && (
        <div className="space-y-4">
          <FieldCard label="URL del sitio" error={errors.siteUrl}>
            <input className="editor-input" {...register('siteUrl')} />
          </FieldCard>
          <FieldCard label="URL de Instagram">
            <input className="editor-input" {...register('socialInstagram')} />
          </FieldCard>
          <FieldCard label="URL de Facebook">
            <input className="editor-input" {...register('socialFacebook')} />
          </FieldCard>
          <FieldCard label="URL de LinkedIn">
            <input className="editor-input" {...register('socialLinkedin')} />
          </FieldCard>
        </div>
      )}
    </div>
  );
}
