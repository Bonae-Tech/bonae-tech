import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  WEEKDAYS,
  defaultBusinessHoursDays,
  parseContentDocument,
  type ContentDocument,
} from '@bonae/content/schema';

const publishedRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../static/content/published',
);

function loadPublishedEs(): ContentDocument {
  return parseContentDocument(JSON.parse(readFileSync(path.join(publishedRoot, 'es.json'), 'utf8')));
}

describe('business hours schema', () => {
  it('provides an ordered full-week default schedule with Sunday closed', () => {
    const defaults = defaultBusinessHoursDays();

    expect(defaults.map((day) => day.day)).toEqual([...WEEKDAYS]);
    expect(defaults).toHaveLength(7);
    expect(defaults[0]).toMatchObject({ day: 'monday', closed: false, open: '09:00', close: '18:00' });
    expect(defaults[5]).toMatchObject({ day: 'saturday', closed: false, open: '09:00', close: '13:00' });
    expect(defaults[6]).toMatchObject({ day: 'sunday', closed: true, open: '', close: '' });
  });

  it('rejects weekly schedules that are not in canonical Monday-to-Sunday order', () => {
    const draft = loadPublishedEs();
    [draft.contact.hours.days[0], draft.contact.hours.days[1]] = [
      draft.contact.hours.days[1],
      draft.contact.hours.days[0],
    ];

    expect(() => parseContentDocument(draft)).toThrow(/Day at index 0 must be monday/);
  });

  it('rejects open days that are missing either time', () => {
    const draft = loadPublishedEs();
    draft.contact.hours.days[2] = {
      ...draft.contact.hours.days[2],
      open: '',
      close: '',
    };

    expect(() => parseContentDocument(draft)).toThrow(/Open time is required when the day is open/);
    expect(() => parseContentDocument(draft)).toThrow(/Close time is required when the day is open/);
  });
});
