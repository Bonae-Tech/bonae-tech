/**
 * One-time helper: seed content JSON from src/i18n/*.ts defaults.
 * Run: npx tsx scripts/seed-content.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { es } from '../src/i18n/es.js';
import { en } from '../src/i18n/en.js';

const root = join(process.cwd(), 'content');

function extend(doc: typeof es | typeof en, lang: 'es' | 'en') {
  const base = structuredClone(doc) as Record<string, unknown>;
  base.lang = lang;

  base.blog = {
    title: lang === 'es' ? 'Blog y Recursos' : 'Blog & Resources',
    subtitle:
      lang === 'es'
        ? 'Consejos, guías y actualizaciones para PyMEs latinoamericanas.'
        : 'Tips, guides, and updates for Latin American SMEs.',
    comingSoon:
      lang === 'es'
        ? 'Artículos y recursos descargables próximamente.'
        : 'Articles and downloadable resources coming soon.',
  };

  const about = base.about as Record<string, unknown>;
  about.foundersTitle = lang === 'es' ? 'Cofundadoras' : 'Founders';

  const keyFigures = base.keyFigures as Record<string, unknown>;
  keyFigures.clientsValue = '—';
  keyFigures.projectsValue = '—';
  keyFigures.presenceValue = '—';
  keyFigures.foundersCount = '3';
  keyFigures.foundersLabel = lang === 'es' ? 'Fundadoras' : 'Founders';

  const cookieBanner = base.cookieBanner as Record<string, unknown>;
  cookieBanner.ariaLabel = lang === 'es' ? 'Aviso de cookies' : 'Cookie notice';

  return base;
}

const settings = {
  siteUrl: 'https://bonaetech.com',
  whatsappNumber: '584140000000',
  socialLinks: {
    instagram: '',
    facebook: '',
    linkedin: '',
  },
  legalLinks: {
    privacy: '#',
    terms: '#',
    cookies: '#',
  },
};

for (const tier of ['drafts', 'published'] as const) {
  const dir = join(root, tier);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'es.json'), JSON.stringify(extend(es, 'es'), null, 2) + '\n');
  writeFileSync(join(dir, 'en.json'), JSON.stringify(extend(en, 'en'), null, 2) + '\n');
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(settings, null, 2) + '\n');
}

console.log('Seeded content/drafts and content/published');
