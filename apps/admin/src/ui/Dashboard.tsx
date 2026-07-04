import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { isPublishInFlight } from '@bonae/content/content-store';
import type { Locale } from '@bonae/content/schema';
import { useContentWorkspace } from '../hooks/useContentWorkspace.js';
import { usePublishFlow } from '../hooks/usePublishFlow.js';
import { HeroSectionForm } from './sections/HeroSectionForm.js';
import { ValuePropSectionForm } from './sections/ValuePropSectionForm.js';
import { AboutSectionForm } from './sections/AboutSectionForm.js';
import { ContactSectionForm } from './sections/ContactSectionForm.js';
import { SettingsSectionForm } from './sections/SettingsSectionForm.js';
import { JsonSectionEditor } from './components/JsonSectionEditor.js';
import { PublishingOverlay } from './components/PublishingOverlay.js';
import { ReviewPublishModal } from './components/ReviewPublishModal.js';

type SectionId = 'hero' | 'valueProp' | 'about' | 'contact' | 'settings' | 'advanced';

interface Props {
  onLogout: () => void;
  sessionMessage?: string | null;
  onDismissSessionMessage?: () => void;
}

function saveStatusLabel(status: string, error: string | null): string | null {
  switch (status) {
    case 'pending':
      return 'Unsaved changes…';
    case 'saving':
      return 'Saving draft…';
    case 'saved':
      return 'Draft saved.';
    case 'error':
      return error ?? 'Save failed.';
    default:
      return null;
  }
}

export function Dashboard({ onLogout, sessionMessage, onDismissSessionMessage }: Props) {
  const [locale, setLocale] = useState<Locale>('es');
  const [section, setSection] = useState<SectionId>('hero');
  const [reviewOpen, setReviewOpen] = useState(false);
  const queryClient = useQueryClient();

  const workspace = useContentWorkspace();
  const publishFlow = usePublishFlow(() => {
    void workspace.reload();
    void queryClient.invalidateQueries();
  });

  useEffect(() => {
    if (isPublishInFlight(workspace.publishState.state)) {
      publishFlow.resumeIfInFlight(workspace.publishState.state);
    }
  }, [workspace.publishState.state, publishFlow]);

  const manualSaveMutation = useMutation({
    mutationFn: async () => {
      if (section === 'settings') {
        await workspace.saveDraftManual('settings');
      } else {
        await workspace.saveDraftManual(locale);
      }
    },
  });

  const discardMutation = useMutation({
    mutationFn: workspace.discardAll,
  });

  const navItems: [SectionId, string][] = [
    ['hero', 'Hero'],
    ['valueProp', 'Services / value prop'],
    ['about', 'About / team'],
    ['contact', 'Contact'],
    ['settings', 'Site settings'],
    ['advanced', 'Advanced JSON'],
  ];

  const statusMessage = saveStatusLabel(workspace.saveStatus, workspace.saveError);
  const doc = locale === 'es' ? workspace.draftEs : workspace.draftEn;
  const updateDoc = locale === 'es' ? workspace.updateDraftEs : workspace.updateDraftEn;
  const canReview =
    workspace.draftEs &&
    workspace.draftEn &&
    workspace.draftSettings &&
    workspace.publishedEs &&
    workspace.publishedEn &&
    workspace.publishedSettings;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">BONAE Content Admin</h1>
            <p className="text-xs text-slate-500">Draft → review → publish</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setReviewOpen(true)}
              disabled={!canReview || publishFlow.overlayOpen}
            >
              Review &amp; publish
            </button>
            <button type="button" className="btn-secondary" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-slate-600">
            <span>
              {workspace.lastPublishedAt
                ? `Last published ${new Date(workspace.lastPublishedAt).toLocaleString()}`
                : 'Not published yet'}
            </span>
            <div className="flex items-center gap-2">
              {statusMessage && <span>{statusMessage}</span>}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => discardMutation.mutate()}
                disabled={discardMutation.isPending}
              >
                Discard all drafts
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="card h-fit space-y-4">
          {section !== 'settings' && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Locale</p>
              <div className="flex gap-2">
                {(['es', 'en'] as Locale[]).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className={`rounded-lg px-3 py-1 text-sm font-medium ${locale === loc ? 'bg-dark-blue text-white' : 'bg-slate-100 text-slate-700'}`}
                    onClick={() => setLocale(loc)}
                  >
                    {loc.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {navItems.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`rounded-lg px-3 py-2 text-left text-sm ${section === id ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}
                onClick={() => setSection(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="space-y-4">
          {sessionMessage && (
            <div className="flex items-start justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
              <p>{sessionMessage}</p>
              {onDismissSessionMessage && (
                <button type="button" className="shrink-0 text-emerald-700 underline" onClick={onDismissSessionMessage}>
                  Dismiss
                </button>
              )}
            </div>
          )}

          {workspace.loading && <div className="card">Loading content…</div>}
          {workspace.error && <div className="card text-red-700">{workspace.error}</div>}

          {doc && section === 'hero' && (
            <HeroSectionForm
              key={locale}
              doc={doc}
              onEdit={updateDoc}
              onSave={() => manualSaveMutation.mutate()}
              saving={manualSaveMutation.isPending || workspace.saveStatus === 'saving'}
            />
          )}
          {doc && section === 'valueProp' && (
            <ValuePropSectionForm
              key={locale}
              doc={doc}
              onEdit={updateDoc}
              onSave={() => manualSaveMutation.mutate()}
              saving={manualSaveMutation.isPending || workspace.saveStatus === 'saving'}
            />
          )}
          {doc && section === 'about' && (
            <AboutSectionForm
              key={locale}
              doc={doc}
              onEdit={updateDoc}
              onSave={() => manualSaveMutation.mutate()}
              saving={manualSaveMutation.isPending || workspace.saveStatus === 'saving'}
            />
          )}
          {doc && section === 'contact' && (
            <ContactSectionForm
              key={locale}
              doc={doc}
              onEdit={updateDoc}
              onSave={() => manualSaveMutation.mutate()}
              saving={manualSaveMutation.isPending || workspace.saveStatus === 'saving'}
            />
          )}
          {doc && section === 'advanced' && (
            <JsonSectionEditor
              key={locale}
              title={`Full document (${locale})`}
              value={doc}
              onSave={(next) => {
                updateDoc(next);
                void workspace.saveDraftManual(locale);
              }}
              saving={manualSaveMutation.isPending || workspace.saveStatus === 'saving'}
            />
          )}
          {section === 'settings' && workspace.draftSettings && (
            <SettingsSectionForm
              settings={workspace.draftSettings}
              onEdit={workspace.updateSettings}
              onSave={() => manualSaveMutation.mutate()}
              saving={manualSaveMutation.isPending || workspace.saveStatus === 'saving'}
            />
          )}
        </main>
      </div>

      {canReview && (
        <ReviewPublishModal
          open={reviewOpen}
          draft={{
            es: workspace.draftEs!,
            en: workspace.draftEn!,
            settings: workspace.draftSettings!,
          }}
          published={{
            es: workspace.publishedEs!,
            en: workspace.publishedEn!,
            settings: workspace.publishedSettings!,
          }}
          publishing={false}
          onClose={() => setReviewOpen(false)}
          onConfirm={() => {
            setReviewOpen(false);
            void publishFlow.startPublish(workspace.flushPendingSaves);
          }}
        />
      )}

      <PublishingOverlay
        open={publishFlow.overlayOpen}
        stage={publishFlow.stage}
        runUrl={publishFlow.status?.runUrl}
        error={publishFlow.error ?? publishFlow.status?.error}
        onDismiss={publishFlow.dismissOverlay}
      />
    </div>
  );
}
