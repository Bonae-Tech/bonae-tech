import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';

interface Props {
  doc: ContentDocument;
  onSave: () => void;
  onEdit?: (doc: ContentDocument) => void;
  saving?: boolean;
}

export function ContactSectionForm({ doc, onSave, onEdit, saving }: Props) {
  const { register, watch } = useForm({
    defaultValues: {
      title: doc.contact.title,
      subtitle: doc.contact.subtitle,
      email: doc.contact.email,
      phone: doc.contact.phone,
      whatsappMessage: doc.contact.whatsappMessage,
      locationNote: doc.contact.locationNote,
    },
  });
  const values = watch();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onEdit?.({
      ...doc,
      contact: {
        ...doc.contact,
        ...values,
      },
    });
  }, [values]);

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h2 className="text-lg font-bold">Contact</h2>
      <input className="field-input" placeholder="Title" {...register('title')} />
      <textarea className="field-input" placeholder="Subtitle" {...register('subtitle')} />
      <input className="field-input" placeholder="Email" {...register('email')} />
      <input className="field-input" placeholder="Phone display" {...register('phone')} />
      <textarea className="field-input" placeholder="WhatsApp prefill message" {...register('whatsappMessage')} />
      <textarea className="field-input" placeholder="Location note" {...register('locationNote')} />
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
    </form>
  );
}
