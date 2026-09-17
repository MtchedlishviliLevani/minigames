import './Footer.scss';
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  FOOTER_LINK_GROUPS,
  GITHUB_NICKNAME,
  GITHUB_PROFILE_URL,
  RS_SCHOOL_URL,
  SOCIAL_LINKS,
} from '../../data/navigation';
import type { FooterLinkGroup, SocialLink } from '../../types';
import { el } from '../../utils/dom';
import { Icon } from '../Icon/Icon';
import { Logo } from '../Logo/Logo';

const EXTERNAL = { target: '_blank', rel: 'noopener noreferrer' };

const LinkGroup = (group: FooterLinkGroup): HTMLElement =>
  el('nav', {
    className: 'footer__group',
    attrs: { 'aria-label': group.title },
    children: [
      el('h3', { className: 'footer__heading', text: group.title }),
      el('ul', {
        className: 'footer__list',
        children: group.links.map((link) =>
          el('li', {
            children: [
              el('a', { className: 'footer__link', attrs: { href: link.href }, text: link.label }),
            ],
          })
        ),
      }),
    ],
  });

const SocialItem = (link: SocialLink): HTMLLIElement =>
  el('li', {
    children: [
      el('a', {
        className: 'footer__social-link',
        attrs: { href: link.href, 'aria-label': link.label },
        children: [Icon(link.icon, 'icon--small')],
      }),
    ],
  });

const SocialGroup = (): HTMLElement =>
  el('div', {
    className: 'footer__group footer__group--social',
    children: [
      el('h3', { className: 'footer__heading', text: 'Community' }),
      el('ul', { className: 'footer__social', children: SOCIAL_LINKS.map(SocialItem) }),
    ],
  });

const Bottom = (): HTMLElement =>
  el('div', {
    className: 'footer__bottom',
    children: [
      el('p', {
        className: 'footer__copyright',
        text: `© ${String(new Date().getFullYear())} ${BRAND_NAME}. All rights reserved.`,
      }),
      el('a', {
        className: 'footer__credit',
        attrs: { href: RS_SCHOOL_URL, ...EXTERNAL },
        children: [
          el('div', {
            className: 'footer__credit-badge',
            children: [
              el('span', {
                className: 'footer__credit-mark',
                attrs: { 'aria-hidden': 'true' },
                text: 'RS',
              }),
            ],
          }),
          'RS School',
        ],
      }),
      el('a', {
        className: 'footer__credit',
        attrs: { href: GITHUB_PROFILE_URL, ...EXTERNAL },
        children: [Icon('code', 'icon--medium footer__credit-icon'), GITHUB_NICKNAME],
      }),
      el('p', { className: 'footer__love', text: 'Designed with love' }),
    ],
  });

export const Footer = (): HTMLElement =>
  el('footer', {
    className: 'footer',
    children: [
      el('div', {
        className: 'container',
        children: [
          el('div', {
            className: 'footer__top',
            children: [
              el('div', {
                className: 'footer__brand',
                children: [
                  Logo('logo--inverse'),
                  el('p', { className: 'footer__tagline', text: BRAND_TAGLINE }),
                ],
              }),
              el('div', {
                className: 'footer__columns',
                children: [...FOOTER_LINK_GROUPS.map(LinkGroup), SocialGroup()],
              }),
            ],
          }),
          Bottom(),
        ],
      }),
    ],
  });
