/**
 * Normalize optional social URLs from published settings before rendering.
 *
 * @param {{ instagram: string; facebook: string; linkedin: string }} socialLinks
 */
export function normalizeSocialLinks(socialLinks) {
  const instagramUrl = socialLinks.instagram.trim();
  const facebookUrl = socialLinks.facebook.trim();
  const linkedinUrl = socialLinks.linkedin.trim();

  return {
    instagramUrl,
    facebookUrl,
    linkedinUrl,
    hasSocialLinks: Boolean(instagramUrl || facebookUrl || linkedinUrl),
  };
}
