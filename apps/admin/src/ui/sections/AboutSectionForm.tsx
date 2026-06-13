import { useForm } from 'react-hook-form';
import type { ContentDocument } from '@bonae/content';

interface Props {
  doc: ContentDocument;
  onSave: (doc: ContentDocument) => void;
  saving?: boolean;
}

export function AboutSectionForm({ doc, onSave, saving }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      sectionBadge: doc.about.sectionBadge,
      title: doc.about.title,
      foundersTitle: doc.about.foundersTitle,
      historyContent: doc.about.history.content,
      missionContent: doc.about.mission.content,
      visionContent: doc.about.vision.content,
      values: doc.about.values.items.join('\n'),
    },
  });

  return (
    <form
      className="card space-y-4"
      onSubmit={handleSubmit((values) =>
        onSave({
          ...doc,
          about: {
            ...doc.about,
            sectionBadge: values.sectionBadge,
            title: values.title,
            foundersTitle: values.foundersTitle,
            history: { ...doc.about.history, content: values.historyContent },
            mission: { ...doc.about.mission, content: values.missionContent },
            vision: { ...doc.about.vision, content: values.visionContent },
            values: {
              ...doc.about.values,
              items: values.values.split('\n').map((v) => v.trim()).filter(Boolean),
            },
          },
        }),
      )}
    >
      <h2 className="text-lg font-bold">About / team</h2>
      <input className="field-input" placeholder="Section badge" {...register('sectionBadge')} />
      <input className="field-input" placeholder="Title" {...register('title')} />
      <input className="field-input" placeholder="Founders title" {...register('foundersTitle')} />
      <div>
        <label className="field-label">History</label>
        <textarea className="field-input min-h-[120px]" {...register('historyContent')} />
      </div>
      <div>
        <label className="field-label">Mission</label>
        <textarea className="field-input min-h-[80px]" {...register('missionContent')} />
      </div>
      <div>
        <label className="field-label">Vision</label>
        <textarea className="field-input min-h-[80px]" {...register('visionContent')} />
      </div>
      <div>
        <label className="field-label">Values (one per line)</label>
        <textarea className="field-input min-h-[120px]" {...register('values')} />
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
    </form>
  );
}
