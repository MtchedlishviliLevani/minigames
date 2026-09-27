import type { FooterLinkGroup, NavLink, SocialLink } from '../types';

export const BRAND_NAME = 'MiniGames';

export const HOME_HREF = '/';
export const LIBRARY_HREF = '/library';

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: HOME_HREF, route: 'home' },
  { label: 'Library', href: LIBRARY_HREF, route: 'library' },
  { label: 'Tournaments', href: HOME_HREF },
  { label: 'Community', href: HOME_HREF },
];

export const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: HOME_HREF, route: 'home' },
      { label: 'Library', href: LIBRARY_HREF, route: 'library' },
      { label: 'Categories', href: HOME_HREF },
      { label: 'Tournaments', href: HOME_HREF },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: HOME_HREF },
      { label: 'Contact', href: HOME_HREF },
      { label: 'Privacy Policy', href: HOME_HREF },
      { label: 'Terms of Service', href: HOME_HREF },
    ],
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Share', href: HOME_HREF, icon: 'share' },
  { label: 'Chat', href: HOME_HREF, icon: 'chat' },
  { label: 'RSS feed', href: HOME_HREF, icon: 'rss' },
];

export const BRAND_TAGLINE =
  'Take a short break and have fun. Hundreds of curated casual mini-games right in your web browser. No download required.';

export const RS_SCHOOL_URL = 'https://rs.school/courses/short-track';
export const GITHUB_PROFILE_URL = 'https://github.com/MtchedlishviliLevani';
export const GITHUB_NICKNAME = '@MtchedlishviliLevani';
