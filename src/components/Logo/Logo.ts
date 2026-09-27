import './Logo.scss';
import { BRAND_NAME, HOME_HREF } from '../../data/navigation';
import { navigate } from '../../router/router';
import { el } from '../../utils/dom';
import { Icon } from '../Icon/Icon';

export const Logo = (className = ''): HTMLAnchorElement => {
  const logo = el('a', {
    className: `logo${className ? ` ${className}` : ''}`,
    attrs: { href: HOME_HREF, 'aria-label': `${BRAND_NAME} home` },
    children: [
      el('span', { className: 'logo__mark', children: [Icon('puzzle')] }),
      el('span', { className: 'logo__text', text: BRAND_NAME }),
    ],
  });
  logo.addEventListener('click', (event) => {
    event.preventDefault();
    navigate('home');
  });
  return logo;
};
