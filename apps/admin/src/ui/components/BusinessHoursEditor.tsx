import type { BusinessHoursDay, Weekday } from '@bonae/content/schema';
import { WEEKDAY_LABELS } from '@bonae/content/schema';
import { FieldError } from './FieldError.js';

export type HoursDayErrors = Array<{
  open?: string | null;
  close?: string | null;
} | null>;

interface Props {
  days: BusinessHoursDay[];
  onChange: (days: BusinessHoursDay[]) => void;
  errors?: HoursDayErrors;
  error?: string | null;
}

function updateDay(
  days: BusinessHoursDay[],
  index: number,
  patch: Partial<BusinessHoursDay>,
): BusinessHoursDay[] {
  return days.map((day, i) => {
    if (i !== index) {
      return day;
    }
    const next = { ...day, ...patch };
    if (next.closed) {
      return { ...next, open: '', close: '' };
    }
    return next;
  });
}

export function BusinessHoursEditor({ days, onChange, errors, error }: Props) {
  return (
    <div className="editor-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="editor-label">Horario de atención</label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-editor-border">
        <table className="editor-hours-table">
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col" className="text-center">
                Cerrado
              </th>
              <th scope="col">Apertura</th>
              <th scope="col">Cierre</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, index) => {
              const label = WEEKDAY_LABELS.es[day.day as Weekday];
              const dayErrors = errors?.[index];
              return (
                <tr key={day.day} className={day.closed ? 'opacity-70' : undefined}>
                  <td className="font-semibold text-editor-text">{label}</td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="editor-hours-checkbox"
                      checked={day.closed}
                      aria-label={`${label} cerrado`}
                      onChange={(event) =>
                        onChange(updateDay(days, index, { closed: event.target.checked }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="editor-hours-time"
                      value={day.open}
                      disabled={day.closed}
                      aria-label={`${label} apertura`}
                      onChange={(event) =>
                        onChange(updateDay(days, index, { open: event.target.value }))
                      }
                    />
                    {dayErrors?.open && <p className="editor-error-text">{dayErrors.open}</p>}
                  </td>
                  <td>
                    <input
                      type="time"
                      className="editor-hours-time"
                      value={day.close}
                      disabled={day.closed}
                      aria-label={`${label} cierre`}
                      onChange={(event) =>
                        onChange(updateDay(days, index, { close: event.target.value }))
                      }
                    />
                    {dayErrors?.close && <p className="editor-error-text">{dayErrors.close}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <FieldError message={error} />
    </div>
  );
}
