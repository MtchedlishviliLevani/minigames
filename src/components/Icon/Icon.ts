import './Icon.scss';
import close from '../../assets/icons/close.svg?raw';
import menu from '../../assets/icons/menu.svg?raw';
import puzzle from '../../assets/icons/puzzle.svg?raw';

const ICONS = { menu, close, puzzle };

export type IconName = keyof typeof ICONS;

export function Icon(name: IconName, className = ''): SVGSVGElement {
  const template = document.createElement('template');
  template.innerHTML = ICONS[name];
  const svg = template.content.firstElementChild as SVGSVGElement;
  svg.setAttribute('class', `icon${className ? ` ${className}` : ''}`);
  return svg;
}
