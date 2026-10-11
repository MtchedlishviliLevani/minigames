import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '../utils/validation';

export const FALLBACK_NAME = 'Player';

interface ProfileSource {
  displayName: string;
  email: string;
}

const ALPHANUMERIC = /[\p{L}\p{N}]/u;

function emailLocalPart(email: string): string {
  const at = email.indexOf('@');
  return (at === -1 ? '' : email.slice(0, at)).trim();
}

export function profileName({ displayName, email }: ProfileSource): string {
  return displayName.trim() || emailLocalPart(email) || FALLBACK_NAME;
}

export function profileInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => ALPHANUMERIC.exec(word)?.[0] ?? '')
    .join('')
    .toUpperCase();
}

const fitsAuthorName = (name: string): boolean =>
  name.length >= USERNAME_MIN_LENGTH && name.length <= USERNAME_MAX_LENGTH;

export function commentAuthorName(profile: ProfileSource): string {
  const displayName = profile.displayName.trim();
  if (fitsAuthorName(displayName)) return displayName;
  const local = emailLocalPart(profile.email).slice(0, USERNAME_MAX_LENGTH);
  if (fitsAuthorName(local)) return local;
  return FALLBACK_NAME;
}
