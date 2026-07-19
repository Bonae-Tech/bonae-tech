import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Locale } from '@bonae/content/schema';
import { buildPublishReview, reviewHasNoChanges } from '../infrastructure/contentReview.js';
import { applySettingsForm } from '../infrastructure/settingsEditorAdapter.js';
import { useContentWorkspace } from '../hooks/useContentWorkspace.js';
import { useFieldValidation } from '../hooks/useFieldValidation.js';
import { usePublishFlow } from '../hooks/usePublishFlow.js';
import { EditorShell } from './editor/EditorShell.js';
import { EditorTopBar } from './editor/EditorTopBar.js';
import { EditorSidebar } from './editor/EditorSidebar.js';
import { EditorRail } from './editor/EditorRail.js';
import type { SectionId } from './editor/types.js';
import { HeroSectionForm } from './sections/HeroSectionForm.js';
import { ValuePropSectionForm } from './sections/ValuePropSectionForm.js';
import { KeyFiguresSectionForm } from './sections/KeyFiguresSectionForm.js';
import { AboutSectionForm } from './sections/AboutSectionForm.js';
import { TemplatesSectionForm } from './sections/TemplatesSectionForm.js';
import { PlansSectionForm } from './sections/PlansSectionForm.js';
import { ContactSectionForm } from './sections/ContactSectionForm.js';
import { SettingsSectionForm } from './sections/SettingsSectionForm.js';
import { AdvancedJsonSection } from './sections/AdvancedJsonSection.js';

interface Props {
  onLogout: () => void;
  sessionMessage?: string | null;
  onDismissSessionMessage?: () => void;
}

function formatSavedTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function Dashboard({ onLogout, sessionMessage, onDismissSessionMessage }: Props) {
  const [locale, setLocale] = useState<Locale>('es');
  const [section, setSection] = useState<SectionId>('hero');
  const [railOpen, setRailOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const workspace = useContentWorkspace();
  const validation = useFieldValidation(workspace.draftEs, workspace.draftEn, workspace.draftSettings);

  const publishFlow = usePublishFlow(
    () => {
      void workspace.reload();
      void queryClient.invalidateQueries();
    },
    workspace.publishState.state,
  );

  const { startPublish, statusLabel, isPublishing, isFailed, isTracking, runUrl, dismissPublishTracking } =
    publishFlow;

  useEffect(() => {
    if (workspace.saveStatus === 'saved') {
      setSavedAt(new Date());
    }
  }, [workspace.saveStatus]);

  const saveMutation = useMutation({
    mutationFn: () => workspace.flushPendingSaves(),
  });

  const discardMutation = useMutation({
    mutationFn: workspace.discardAll,
  });

  const doc = locale === 'es' ? workspace.draftEs : workspace.draftEn;
  const localeErrors = locale === 'es' ? validation.errorsEs : validation.errorsEn;
  const updateDoc = locale === 'es' ? workspace.updateDraftEs : workspace.updateDraftEn;

  const canReview =
    workspace.draftEs &&
    workspace.draftEn &&
    workspace.draftSettings &&
    workspace.publishedEs &&
    workspace.publishedEn &&
    workspace.publishedSettings;

  const review = canReview
    ? buildPublishReview({
        draft: {
          es: workspace.draftEs!,
          en: workspace.draftEn!,
          settings: workspace.draftSettings!,
        },
        published: {
          es: workspace.publishedEs!,
          en: workspace.publishedEn!,
          settings: workspace.publishedSettings!,
        },
      })
    : null;

  const hasPendingChanges = review ? !reviewHasNoChanges(review) : false;
  const pendingCount = review?.changeCount ?? 0;

  const saveStatusText = useMemo(() => {
    switch (workspace.saveStatus) {
      case 'pending':
        return 'Cambios sin guardar';
      case 'saving':
        return 'Guardando borrador…';
      case 'saved':
        return savedAt ? `Borrador guardado ${formatSavedTime(savedAt)}` : 'Borrador guardado';
      case 'error':
        return workspace.saveError ?? 'Error al guardar';
      default:
        return 'Borrador actualizado';
    }
  }, [workspace.saveStatus, workspace.saveError, savedAt]);

  const saveStatusTone =
    workspace.saveStatus === 'pending' || workspace.saveStatus === 'saving'
      ? 'warning'
      : workspace.saveStatus === 'error'
        ? 'error'
        : 'muted';

  const saveDraftDisabled = workspace.saveStatus !== 'pending';

  const handleApplySettings = useCallback(
    (values: Parameters<typeof applySettingsForm>[0]) => {
      if (!workspace.draftEs || !workspace.draftEn || !workspace.draftSettings) {
        return;
      }
      const next = applySettingsForm(values, workspace.draftEs, workspace.draftEn, workspace.draftSettings);
      workspace.updateDraftEs(next.es);
      workspace.updateDraftEn(next.en);
      workspace.updateSettings(next.settings);
    },
    [workspace],
  );

  const lastPublishedLabel = workspace.lastPublishedAt
    ? new Date(workspace.lastPublishedAt).toLocaleString()
    : 'Aún no publicado';

  const jsonTree =
    workspace.draftEs && workspace.draftEn && workspace.draftSettings
      ? { es: workspace.draftEs, en: workspace.draftEn, settings: workspace.draftSettings }
      : null;

  return (
    <EditorShell
      showRailToggle={!!canReview}
      onOpenRail={() => setRailOpen(true)}
      topBar={
        <EditorTopBar
          saveStatusText={saveStatusText}
          saveStatusTone={saveStatusTone}
          saveDraftDisabled={saveDraftDisabled}
          saving={workspace.saveStatus === 'saving' || saveMutation.isPending}
          onSaveDraft={() => saveMutation.mutate()}
          lastPublishedLabel={lastPublishedLabel}
          userInitials="BT"
          onLogout={onLogout}
          hasPendingChanges={hasPendingChanges}
          isPublishing={isPublishing}
          publishStatusLabel={statusLabel}
          publishFailed={isFailed}
          publishRunUrl={runUrl}
          publishTracking={isTracking}
          onStopPublishTracking={dismissPublishTracking}
        />
      }
      sidebar={
        <EditorSidebar
          locale={locale}
          section={section}
          showLocale={section !== 'settings' && section !== 'advanced'}
          onLocaleChange={setLocale}
          onSectionChange={setSection}
          onDiscard={() => discardMutation.mutate()}
          discardPending={discardMutation.isPending}
          navErrorCount={validation.navErrorCount}
        />
      }
      main={
        <>
          {sessionMessage && (
            <div className="flex items-start justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
              <p>{sessionMessage}</p>
              {onDismissSessionMessage && (
                <button
                  type="button"
                  className="shrink-0 text-emerald-700 underline"
                  onClick={onDismissSessionMessage}
                >
                  Cerrar
                </button>
              )}
            </div>
          )}

          {workspace.loading && <div className="editor-card">Cargando contenido…</div>}
          {workspace.error && <div className="editor-card text-editor-error">{workspace.error}</div>}

          {doc && section === 'hero' && (
            <HeroSectionForm
              key={`${locale}-${workspace.contentEpoch}`}
              doc={doc}
              onEdit={updateDoc}
              errors={localeErrors}
            />
          )}
          {doc && section === 'valueProp' && (
            <ValuePropSectionForm
              key={`${locale}-${workspace.contentEpoch}`}
              doc={doc}
              onEdit={updateDoc}
              errors={localeErrors}
            />
          )}
          {doc && section === 'keyFigures' && (
            <KeyFiguresSectionForm
              key={`${locale}-${workspace.contentEpoch}`}
              doc={doc}
              onEdit={updateDoc}
              errors={localeErrors}
            />
          )}
          {doc && section === 'about' && (
            <AboutSectionForm
              key={`${locale}-${workspace.contentEpoch}`}
              doc={doc}
              onEdit={updateDoc}
              errors={localeErrors}
            />
          )}
          {doc && section === 'templates' && (
            <TemplatesSectionForm
              key={`${locale}-${workspace.contentEpoch}`}
              doc={doc}
              onEdit={updateDoc}
              errors={localeErrors}
            />
          )}
          {doc && section === 'plans' && (
            <PlansSectionForm
              key={`${locale}-${workspace.contentEpoch}`}
              doc={doc}
              onEdit={updateDoc}
              errors={localeErrors}
            />
          )}
          {doc && section === 'contact' && (
            <ContactSectionForm
              key={`${locale}-${workspace.contentEpoch}`}
              doc={doc}
              onEdit={updateDoc}
              errors={localeErrors}
            />
          )}
          {section === 'settings' && workspace.draftEs && workspace.draftEn && workspace.draftSettings && (
            <SettingsSectionForm
              key={`settings-${workspace.contentEpoch}`}
              draftEs={workspace.draftEs}
              draftEn={workspace.draftEn}
              settings={workspace.draftSettings}
              onApply={handleApplySettings}
              errors={validation.settingsErrors}
            />
          )}
          {section === 'advanced' && jsonTree && (
            <AdvancedJsonSection key={`json-${workspace.contentEpoch}`} value={jsonTree} />
          )}
        </>
      }
      rail={
        canReview ? (
          <EditorRail
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
            saveStatus={workspace.saveStatus}
            publishing={isPublishing}
            hasClientErrors={validation.hasGlobalErrors}
            pendingCount={pendingCount}
            lastPublishedAt={workspace.lastPublishedAt}
            lastCommitSha={workspace.lastCommitSha}
            onPublish={() => {
              setRailOpen(false);
              void startPublish(workspace.flushPendingSaves);
            }}
            mobileOpen={railOpen}
            onMobileClose={() => setRailOpen(false)}
          />
        ) : (
          <aside className="hidden w-[320px] shrink-0 border-l border-editor-border bg-white lg:block" />
        )
      }
    />
  );
}
