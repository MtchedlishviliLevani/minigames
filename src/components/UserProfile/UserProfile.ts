import './UserProfile.scss';
import { logout } from '../../auth/authState';
import { profileInitials, profileName } from '../../auth/profile';
import type { AppSession } from '../../auth/session';
import { el } from '../../utils/dom';
import { Icon } from '../Icon/Icon';

export type UserProfileVariant = 'header' | 'menu';

function initialsContent(name: string): Node {
  const initials = profileInitials(name);
  return initials === '' ? Icon('user', 'icon--small') : document.createTextNode(initials);
}

export function UserAvatar(session: AppSession, className = ''): HTMLSpanElement {
  const name = profileName(session);
  const avatar = el('span', {
    className: `user-avatar${className === '' ? '' : ` ${className}`}`,
    attrs: { 'aria-hidden': 'true' },
  });

  if (session.avatarUrl === undefined) {
    avatar.append(initialsContent(name));
    return avatar;
  }

  const image = el('img', {
    className: 'user-avatar__image',
    attrs: { src: session.avatarUrl, alt: '', referrerpolicy: 'no-referrer' },
  });
  image.addEventListener('error', () => {
    avatar.replaceChildren(initialsContent(name));
  });
  avatar.append(image);
  return avatar;
}

export function UserProfile(
  session: AppSession,
  variant: UserProfileVariant,
  onLogout?: () => void
): HTMLElement {
  const logoutButton = el('button', {
    className: `btn ${variant === 'menu' ? 'btn--inverse btn--block' : 'btn--outlined'} user-profile__logout`,
    attrs: { type: 'button' },
    text: 'Log Out',
  });
  logoutButton.addEventListener('click', () => {
    onLogout?.();
    void logout();
  });

  return el('div', {
    className: `user-profile user-profile--${variant}`,
    children: [
      el('span', {
        className: 'user-profile__identity',
        children: [
          UserAvatar(session),
          el('span', { className: 'user-profile__name', text: profileName(session) }),
        ],
      }),
      logoutButton,
    ],
  });
}
