import './Icon.scss';
import arrowBack from '../../assets/icons/arrow-back.svg?raw';
import arrowDownward from '../../assets/icons/arrow-downward.svg?raw';
import arrowDropDown from '../../assets/icons/arrow-drop-down.svg?raw';
import arrowForward from '../../assets/icons/arrow-forward.svg?raw';
import arrowUpward from '../../assets/icons/arrow-upward.svg?raw';
import chat from '../../assets/icons/chat.svg?raw';
import chevronLeft from '../../assets/icons/chevron-left.svg?raw';
import chevronRight from '../../assets/icons/chevron-right.svg?raw';
import check from '../../assets/icons/check.svg?raw';
import close from '../../assets/icons/close.svg?raw';
import code from '../../assets/icons/code.svg?raw';
import heart from '../../assets/icons/heart.svg?raw';
import lock from '../../assets/icons/lock.svg?raw';
import mail from '../../assets/icons/mail.svg?raw';
import menu from '../../assets/icons/menu.svg?raw';
import puzzle from '../../assets/icons/puzzle.svg?raw';
import rss from '../../assets/icons/rss.svg?raw';
import send from '../../assets/icons/send.svg?raw';
import share from '../../assets/icons/share.svg?raw';
import star from '../../assets/icons/star.svg?raw';
import upload from '../../assets/icons/upload.svg?raw';
import user from '../../assets/icons/user.svg?raw';

const ICONS = {
  menu,
  close,
  puzzle,
  star,
  heart,
  upload,
  send,
  share,
  chat,
  rss,
  code,
  mail,
  lock,
  user,
  check,
  'arrow-back': arrowBack,
  'arrow-forward': arrowForward,
  'arrow-drop-down': arrowDropDown,
  'chevron-left': chevronLeft,
  'chevron-right': chevronRight,
  'arrow-upward': arrowUpward,
  'arrow-downward': arrowDownward,
};

export type IconName = keyof typeof ICONS;

export function Icon(name: IconName, className = ''): SVGSVGElement {
  const template = document.createElement('template');
  template.innerHTML = ICONS[name];
  const svg = template.content.firstElementChild as SVGSVGElement;
  svg.setAttribute('class', `icon${className ? ` ${className}` : ''}`);
  return svg;
}
