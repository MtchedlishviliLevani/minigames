export const COMMENT_MAX_LENGTH = 500;
export const AVATAR_COLOR_COUNT = 5;

export type CommentTextResult = { ok: true; text: string } | { ok: false; error: string };

export function checkCommentText(value: string): CommentTextResult {
  const text = value.trim();
  if (text === '') return { ok: false, error: 'Write something before sending.' };
  if (text.length > COMMENT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Comments can be up to ${String(COMMENT_MAX_LENGTH)} characters long.`,
    };
  }
  return { ok: true, text };
}

const segmenter = new Intl.Segmenter();

export function commenterInitial(name: string): string {
  const first = segmenter.segment(name.trim())[Symbol.iterator]().next();
  return first.done === true ? '?' : first.value.segment.toUpperCase();
}

export interface AvatarPalette {
  colorFor: (commenter: string) => number;
  clear: () => void;
}

export function createAvatarPalette(random: () => number = Math.random): AvatarPalette {
  const assigned = new Map<string, number>();
  return {
    colorFor: (commenter) => {
      const key = commenter.trim();
      let color = assigned.get(key);
      if (color === undefined) {
        color = Math.floor(random() * AVATAR_COLOR_COUNT) + 1;
        assigned.set(key, color);
      }
      return color;
    },
    clear: () => {
      assigned.clear();
    },
  };
}
