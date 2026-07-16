export const socialLinkPlatforms = ['instagram', 'facebook', 'linkedin'];

export function normalizeSocialLinks(socialLinks) {
  return socialLinkPlatforms.reduce((links, platform) => {
    links[platform] = socialLinks[platform].trim();
    return links;
  }, {});
}

export function hasVisibleSocialLinks(socialLinks) {
  return socialLinkPlatforms.some((platform) => Boolean(socialLinks[platform]));
}
