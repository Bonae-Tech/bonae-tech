import { useForm } from 'react-hook-form';
import type { SiteSettings } from '@bonae/content';

interface Props {
  settings: SiteSettings;
  onSave: (settings: SiteSettings) => void;
  saving?: boolean;
}

export function SettingsSectionForm({ settings, onSave, saving }: Props) {
  const { register, handleSubmit } = useForm({ defaultValues: settings });

  return (
    <form className="card space-y-4" onSubmit={handleSubmit(onSave)}>
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
