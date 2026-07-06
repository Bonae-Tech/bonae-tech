import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ContentDocument, SiteSettings } from '@bonae/content';
import {
  readSettingsForm,
  type SettingsFormValues,
} from '../../infrastructure/settingsEditorAdapter.js';
import type { FieldErrors } from '../../hooks/useFieldValidation.js';
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
  const { register, watch } = useForm<SettingsFormValues>({
    defaultValues: readSettingsForm(draftEs, settings),
  });
  const values = watch();
  const isFirstRender = useRef(true);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onApply(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when form values change
  }, [values]);

  return (
    <div className="space-y-4">
      <SectionHeader title="Settings" description="Shared across languages" />

      <FieldCard
        label="Site name"
        counter={{ current: (values.siteName ?? '').length, max: 40 }}
        error={errors.siteName}
      >
        <input className="editor-input" {...register('siteName')} />
      </FieldCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldCard label="WhatsApp number" error={errors.whatsapp}>
          <input className="editor-input" {...register('whatsapp')} />
        </FieldCard>
        <FieldCard label="Contact email" error={errors.email}>
          <input className="editor-input" type="email" {...register('email')} />
        </FieldCard>
      </div>

      <FieldCard label="Address" error={errors.address}>
        <input className="editor-input" {...register('address')} />
      </FieldCard>

      <FieldCard label="Footer text" error={errors.footerText}>
        <input className="editor-input" {...register('footerText')} />
      </FieldCard>

      <button
        type="button"
        className="text-xs font-semibold text-editor-muted underline"
        onClick={() => setMoreOpen((v) => !v)}
      >
        {moreOpen ? 'Hide more settings' : 'More settings (URL & social)'}
      </button>

      {moreOpen && (
        <div className="space-y-4">
          <FieldCard label="Site URL" error={errors.siteUrl}>
            <input className="editor-input" {...register('siteUrl')} />
          </FieldCard>
          <FieldCard label="Instagram URL">
            <input className="editor-input" {...register('socialInstagram')} />
          </FieldCard>
          <FieldCard label="Facebook URL">
            <input className="editor-input" {...register('socialFacebook')} />
          </FieldCard>
          <FieldCard label="LinkedIn URL">
            <input className="editor-input" {...register('socialLinkedin')} />
          </FieldCard>
        </div>
      )}
    </div>
  );
}
