import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSocialLinks } from '../src/lib/socialLinks.mjs';

describe('normalizeSocialLinks', () => {
  it('hides optional social links when published settings only contain whitespace', () => {
    assert.deepEqual(
      normalizeSocialLinks({
        instagram: '   ',
        facebook: '\n\t',
        linkedin: '',
      }),
      {
        instagramUrl: '',
        facebookUrl: '',
        linkedinUrl: '',
        hasSocialLinks: false,
      },
    );
  });

  it('trims configured social URLs and marks the social group visible', () => {
    assert.deepEqual(
      normalizeSocialLinks({
        instagram: ' https://instagram.example/bonae ',
        facebook: '',
        linkedin: ' https://linkedin.example/company/bonae\n',
      }),
      {
        instagramUrl: 'https://instagram.example/bonae',
        facebookUrl: '',
        linkedinUrl: 'https://linkedin.example/company/bonae',
        hasSocialLinks: true,
      },
    );
  });
});
