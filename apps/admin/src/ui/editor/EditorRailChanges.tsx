import type { ContentDocument, SiteSettings } from '@bonae/content';
import {
  buildPublishReview,
  reviewBlocksPublish,
  reviewHasNoChanges,
} from '../../infrastructure/contentReview.js';
import type { SaveStatus } from '../../hooks/useContentWorkspace.js';
import { ChangeRow } from '../components/ChangeRow.js';

interface Props {
  draft: { es: ContentDocument; en: ContentDocument; settings: SiteSettings };
  published: { es: ContentDocument; en: ContentDocument; settings: SiteSettings };
  saveStatus: SaveStatus;
  publishing: boolean;
  hasClientErrors: boolean;
  onPublish: () => void;
}

export function EditorRailChanges({
  draft,
  published,
  saveStatus,
  publishing,
  hasClientErrors,
  onPublish,
}: Props) {
  const review = buildPublishReview({ draft, published });
  const blocked = reviewBlocksPublish(review) || hasClientErrors;
  const noChanges = reviewHasNoChanges(review);
  const isUnsaved = saveStatus === 'pending' || saveStatus === 'saving';

  const publishDisabled = publishing || blocked || noChanges;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
        {isUnsaved && (
          <div className="editor-banner-warning mb-3">
            Hay cambios sin guardar — haz clic en <strong>Guardar borrador</strong> para incluirlos aquí
            en la revisión.
          </div>
        )}
        {(review.validationErrors.length > 0 || hasClientErrors) && (
          <div className="editor-banner-error mb-3">
            Los errores de validación bloquean la publicación. Corrige los campos resaltados.
          </div>
        )}
        {review.warnings.length > 0 && (
          <div className="editor-banner-warning mb-3 font-normal">
            {review.warnings.length} advertencia(s) — no bloquean la publicación
          </div>
        )}
        {!isUnsaved && noChanges && !hasClientErrors && (
          <p className="py-8 text-center text-[12.5px] text-editor-faint">
            Nada pendiente. Todo está en vivo.
          </p>
        )}
        {review.changes.map((change) => (
          <ChangeRow key={`${change.locale}-${change.label}-${change.kind}-${change.after}`} change={change} />
        ))}
      </div>
      <div className="shrink-0 border-t border-editor-border px-4 py-3.5">
        <p className="mb-2 text-[11px] text-editor-faint">
          Revisa cada cambio aquí antes de publicarlo.
        </p>
        <button
          type="button"
          className={`btn-editor-publish ${publishDisabled ? '' : 'btn-editor-publish-active'}`}
          disabled={publishDisabled}
          onClick={onPublish}
        >
          {publishing ? 'Iniciando…' : 'Aprobar y publicar'}
        </button>
      </div>
    </div>
  );
}
