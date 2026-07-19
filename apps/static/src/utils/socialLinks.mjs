export const socialLinkKeys = ['instagram', 'facebook', 'linkedin'];

/**
 * Normalize optional social URLs before rendering. Empty or whitespace-only values
 * are intentionally hidden so the public site does not emit dead social icons.
 */
export function getVisibleSocialLinks(socialLinks) {
  return Object.fromEntries(
    socialLinkKeys.map((key) => [key, (socialLinks[key] ?? '').trim()])
  );
}

export function hasVisibleSocialLinks(socialLinks) {
  const visibleLinks = getVisibleSocialLinks(socialLinks);
  return socialLinkKeys.some((key) => Boolean(visibleLinks[key]));
}
