import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { SiteSettings } from '@bonae/content';

interface Props {
  settings: SiteSettings;
  onSave: () => void;
  onEdit?: (settings: SiteSettings) => void;
  saving?: boolean;
}

export function SettingsSectionForm({ settings, onSave, onEdit, saving }: Props) {
  const { register, watch } = useForm({ defaultValues: settings });
  const values = watch();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onEdit?.(values);
  }, [values]);

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h2 className="text-lg font-bold">Site settings</h2>
      <input className="field-input" placeholder="Site URL" {...register('siteUrl')} />
      <input className="field-input" placeholder="WhatsApp number (digits only)" {...register('whatsappNumber')} />
      <input className="field-input" placeholder="Instagram URL" {...register('socialLinks.instagram')} />
      <input className="field-input" placeholder="Facebook URL" {...register('socialLinks.facebook')} />
      <input className="field-input" placeholder="LinkedIn URL" {...register('socialLinks.linkedin')} />
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings draft'}</button>
    </form>
  );
}
