import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ContentDocument, Locale, SiteSettings } from '@bonae/content';
import { fetchDraft, publishContent, saveDraft } from '../infrastructure/contentApi.js';
import { HeroSectionForm } from './sections/HeroSectionForm.js';
import { ValuePropSectionForm } from './sections/ValuePropSectionForm.js';
import { AboutSectionForm } from './sections/AboutSectionForm.js';
import { ContactSectionForm } from './sections/ContactSectionForm.js';
import { SettingsSectionForm } from './sections/SettingsSectionForm.js';
import { JsonSectionEditor } from './components/JsonSectionEditor.js';

type SectionId = 'hero' | 'valueProp' | 'about' | 'contact' | 'settings' | 'advanced';

interface Props {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: Props) {
  const [locale, setLocale] = useState<Locale>('es');
  const [section, setSection] = useState<SectionId>('hero');
  const [status, setStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const contentQuery = useQuery({
    queryKey: ['draft', locale],
    queryFn: async () => {
      const res = await fetchDraft(locale);
      return res.content as ContentDocument;
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['draft', 'settings'],
    queryFn: async () => {
      const res = await fetchDraft('settings');
      return res.content as SiteSettings;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (doc: ContentDocument) => saveDraft(locale, doc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft', locale] });
      setStatus('Draft saved.');
    },
    onError: (err: Error) => setStatus(err.message),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: SiteSettings) => saveDraft('settings', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft', 'settings'] });
      setStatus('Settings saved.');
    },
    onError: (err: Error) => setStatus(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: publishContent,
    onSuccess: (res) => setStatus(`Published. Commit ${res.commitSha}`),
    onError: (err: Error) => setStatus(err.message),
  });

  const doc = contentQuery.data;
  const navItems: [SectionId, string][] = [
    ['hero', 'Hero'],
    ['valueProp', 'Services / value prop'],
    ['about', 'About / team'],
    ['contact', 'Contact'],
    ['settings', 'Site settings'],
    ['advanced', 'Advanced JSON'],
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">BONAE Content Admin</h1>
            <p className="text-xs text-slate-500">Draft → Publish workflow (git-backed)</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? 'Publishing…' : 'Publish site'}
            </button>
            <button type="button" className="btn-secondary" onClick={onLogout}>Sign out</button>
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
          {status && <p className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">{status}</p>}
          {contentQuery.isLoading && section !== 'settings' && <div className="card">Loading content…</div>}
          {contentQuery.error && section !== 'settings' && <div className="card text-red-700">{String(contentQuery.error)}</div>}

          {doc && section === 'hero' && (
            <HeroSectionForm doc={doc} onSave={(next) => saveMutation.mutate(next)} saving={saveMutation.isPending} />
          )}
          {doc && section === 'valueProp' && (
            <ValuePropSectionForm doc={doc} onSave={(next) => saveMutation.mutate(next)} saving={saveMutation.isPending} />
          )}
          {doc && section === 'about' && (
            <AboutSectionForm doc={doc} onSave={(next) => saveMutation.mutate(next)} saving={saveMutation.isPending} />
          )}
          {doc && section === 'contact' && (
            <ContactSectionForm doc={doc} onSave={(next) => saveMutation.mutate(next)} saving={saveMutation.isPending} />
          )}
          {doc && section === 'advanced' && (
            <JsonSectionEditor
              title={`Full document (${locale})`}
              value={doc}
              onSave={(next) => saveMutation.mutate(next as ContentDocument)}
              saving={saveMutation.isPending}
            />
          )}
          {section === 'settings' && settingsQuery.data && (
            <SettingsSectionForm
              settings={settingsQuery.data}
              onSave={(next) => saveSettingsMutation.mutate(next)}
              saving={saveSettingsMutation.isPending}
            />
          )}
        </main>
      </div>
    </div>
  );
}
