import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContentDocument, ContentStateResponse, Locale, SiteSettings } from '@bonae/content';
import {
  discardAllDrafts,
  fetchContentState,
  saveDraft,
} from '../infrastructure/contentApi.js';

const AUTOSAVE_MS = 2500;

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export interface ContentWorkspace {
  loading: boolean;
  error: string | null;
  lastPublishedAt: number | null;
  lastCommitSha: string | null;
  publishState: ContentStateResponse['publishState'];
  draftEs: ContentDocument | null;
  draftEn: ContentDocument | null;
  draftSettings: SiteSettings | null;
  publishedEs: ContentDocument | null;
  publishedEn: ContentDocument | null;
  publishedSettings: SiteSettings | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  updateDraftEs: (doc: ContentDocument) => void;
  updateDraftEn: (doc: ContentDocument) => void;
  updateSettings: (settings: SiteSettings) => void;
  saveDraftManual: (resource: Locale | 'settings') => Promise<void>;
  flushPendingSaves: () => Promise<void>;
  discardAll: () => Promise<void>;
  reload: () => Promise<void>;
  /** Bumped on each load/discard so section forms remount with fresh values. */
  contentEpoch: number;
}

export function useContentWorkspace(): ContentWorkspace {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ContentStateResponse | null>(null);
  const [draftEs, setDraftEs] = useState<ContentDocument | null>(null);
  const [draftEn, setDraftEn] = useState<ContentDocument | null>(null);
  const [draftSettings, setDraftSettings] = useState<SiteSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [contentEpoch, setContentEpoch] = useState(0);

  const pendingRef = useRef<Set<Locale | 'settings'>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftEsRef = useRef(draftEs);
  const draftEnRef = useRef(draftEn);
  const draftSettingsRef = useRef(draftSettings);

  draftEsRef.current = draftEs;
  draftEnRef.current = draftEn;
  draftSettingsRef.current = draftSettings;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchContentState();
      // #region agent log
      {
        const dHours = (next.draft.es as { contact?: { hours?: unknown } })?.contact?.hours;
        const pHours = (next.published.es as { contact?: { hours?: unknown } })?.contact?.hours;
        fetch('http://127.0.0.1:7768/ingest/36033ee5-db8c-4429-bd42-cc7f53ef3b11',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'634e86'},body:JSON.stringify({sessionId:'634e86',runId:'rehydrate-debug',hypothesisId:'H1',location:'useContentWorkspace.ts:load',message:'content state loaded',data:{lastCommitSha:next.lastCommitSha,publishState:next.publishState?.state,draftHoursType:typeof dHours,draftHoursIsArrayDays:Boolean(dHours&&typeof dHours==='object'&&Array.isArray((dHours as {days?:unknown}).days)),draftHoursDaysLen:dHours&&typeof dHours==='object'&&Array.isArray((dHours as {days?:unknown}).days)?(dHours as {days:unknown[]}).days.length:null,draftHoursTitle:dHours&&typeof dHours==='object'?(dHours as {title?:string}).title??null:typeof dHours==='string'?dHours:null,publishedHoursType:typeof pHours,publishedHoursDaysLen:pHours&&typeof pHours==='object'&&Array.isArray((pHours as {days?:unknown}).days)?(pHours as {days:unknown[]}).days.length:null,publishedHoursTitle:pHours&&typeof pHours==='object'?(pHours as {title?:string}).title??null:typeof pHours==='string'?pHours:null},timestamp:Date.now()})}).catch(()=>{});
      }
      // #endregion
      setState(next);
      setDraftEs(next.draft.es as ContentDocument);
      setDraftEn(next.draft.en as ContentDocument);
      setDraftSettings(next.draft.settings as SiteSettings);
      setContentEpoch((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el contenido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persistResource = useCallback(async (resource: Locale | 'settings') => {
    const content =
      resource === 'es'
        ? draftEsRef.current
        : resource === 'en'
          ? draftEnRef.current
          : draftSettingsRef.current;
    if (!content) {
      return;
    }
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await saveDraft(resource, content);
      pendingRef.current.delete(resource);
      setSaveStatus(pendingRef.current.size > 0 ? 'pending' : 'saved');
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
      throw err;
    }
  }, []);

  const scheduleAutosave = useCallback(
    (resource: Locale | 'settings') => {
      pendingRef.current.add(resource);
      setSaveStatus('pending');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        void persistResource(resource);
      }, AUTOSAVE_MS);
    },
    [persistResource],
  );

  const flushPendingSaves = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = [...pendingRef.current];
    for (const resource of pending) {
      await persistResource(resource);
    }
  }, [persistResource]);

  const updateDraftEs = useCallback(
    (doc: ContentDocument) => {
      setDraftEs(doc);
      scheduleAutosave('es');
    },
    [scheduleAutosave],
  );

  const updateDraftEn = useCallback(
    (doc: ContentDocument) => {
      setDraftEn(doc);
      scheduleAutosave('en');
    },
    [scheduleAutosave],
  );

  const updateSettings = useCallback(
    (settings: SiteSettings) => {
      setDraftSettings(settings);
      scheduleAutosave('settings');
    },
    [scheduleAutosave],
  );

  const saveDraftManual = useCallback(
    async (resource: Locale | 'settings') => {
      pendingRef.current.add(resource);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      await persistResource(resource);
    },
    [persistResource],
  );

  const discardAll = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current.clear();
    await discardAllDrafts();
    await load();
    setSaveStatus('idle');
    setSaveError(null);
  }, [load]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return {
    loading,
    error,
    lastPublishedAt: state?.lastPublishedAt ?? null,
    lastCommitSha: state?.lastCommitSha ?? null,
    publishState: state?.publishState ?? {
      state: 'idle',
      commitSha: null,
      runUrl: null,
      startedAt: null,
      finishedAt: null,
      error: null,
    },
    draftEs,
    draftEn,
    draftSettings,
    publishedEs: (state?.published.es as ContentDocument) ?? null,
    publishedEn: (state?.published.en as ContentDocument) ?? null,
    publishedSettings: (state?.published.settings as SiteSettings) ?? null,
    saveStatus,
    saveError,
    updateDraftEs,
    updateDraftEn,
    updateSettings,
    saveDraftManual,
    flushPendingSaves,
    discardAll,
    reload: load,
    contentEpoch,
  };
}
