import './Icon.scss';
import arrowBack from '../../assets/icons/arrow-back.svg?raw';
import arrowForward from '../../assets/icons/arrow-forward.svg?raw';
import close from '../../assets/icons/close.svg?raw';
import heart from '../../assets/icons/heart.svg?raw';
import menu from '../../assets/icons/menu.svg?raw';
import puzzle from '../../assets/icons/puzzle.svg?raw';
import star from '../../assets/icons/star.svg?raw';
import upload from '../../assets/icons/upload.svg?raw';

const ICONS = {
  menu,
  close,
  puzzle,
  star,
  heart,
  upload,
  'arrow-back': arrowBack,
  'arrow-forward': arrowForward,
};

export type IconName = keyof typeof ICONS;

export function Icon(name: IconName, className = ''): SVGSVGElement {
  const template = document.createElement('template');
  template.innerHTML = ICONS[name];
  const svg = template.content.firstElementChild as SVGSVGElement;
  svg.setAttribute('class', `icon${className ? ` ${className}` : ''}`);
  return svg;
}
