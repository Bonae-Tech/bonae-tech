import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getVisibleSocialLinks, hasVisibleSocialLinks } from '../src/utils/socialLinks.mjs';

test('whitespace-only social URLs are normalized as hidden', () => {
  const visibleLinks = getVisibleSocialLinks({
    instagram: '   ',
    facebook: '\n\t',
    linkedin: '',
  });

  assert.deepEqual(visibleLinks, {
    instagram: '',
    facebook: '',
    linkedin: '',
  });
  assert.equal(hasVisibleSocialLinks(visibleLinks), false);
});

test('configured social URLs are trimmed and remain visible', () => {
  const visibleLinks = getVisibleSocialLinks({
    instagram: ' https://instagram.example/bonae ',
    facebook: '\thttps://facebook.example/bonae',
    linkedin: 'https://linkedin.example/company/bonae\n',
  });

  assert.deepEqual(visibleLinks, {
    instagram: 'https://instagram.example/bonae',
    facebook: 'https://facebook.example/bonae',
    linkedin: 'https://linkedin.example/company/bonae',
  });
  assert.equal(hasVisibleSocialLinks(visibleLinks), true);
});

test('contact and footer components render optional icons through the shared visibility helper', async () => {
  const [contactSource, footerSource] = await Promise.all([
    readFile(new URL('../src/components/Contact.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/Footer.astro', import.meta.url), 'utf8'),
  ]);

  assert.match(contactSource, /getVisibleSocialLinks\(settings\.socialLinks\)/);
  assert.match(footerSource, /getVisibleSocialLinks\(settings\.socialLinks\)/);
  assert.match(footerSource, /hasVisibleSocialLinks\(settings\.socialLinks\)/);
});
