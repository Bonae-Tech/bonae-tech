import assert from 'node:assert/strict';
import test from 'node:test';

import { hasVisibleSocialLinks, normalizeSocialLinks } from '../src/lib/socialLinks.mjs';

test('normalizeSocialLinks trims configured social URLs', () => {
  const links = normalizeSocialLinks({
    instagram: '  https://instagram.example/bonae  ',
    facebook: '\nhttps://facebook.example/bonae\t',
    linkedin: ' https://linkedin.example/company/bonae ',
  });

  assert.deepEqual(links, {
    instagram: 'https://instagram.example/bonae',
    facebook: 'https://facebook.example/bonae',
    linkedin: 'https://linkedin.example/company/bonae',
  });
  assert.equal(hasVisibleSocialLinks(links), true);
});

test('hasVisibleSocialLinks treats blank and whitespace-only settings as hidden', () => {
  const links = normalizeSocialLinks({
    instagram: ' ',
    facebook: '',
    linkedin: '\n\t',
  });

  assert.deepEqual(links, {
    instagram: '',
    facebook: '',
    linkedin: '',
  });
  assert.equal(hasVisibleSocialLinks(links), false);
});
