import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AuthStateModule from '../../auth/authState';
import { SESSION_LIFETIME_MS, SESSION_STORAGE_KEY } from '../../auth/session';
import type * as RouterModule from '../../router/router';
import type { GameComment } from '../../types';
import { comment, DETAILS } from '../../test/fixtures';
import { flush, mockFetch, path, requestUrl } from '../../test/http';
import type { MockRoute } from '../../test/http';

const mocks = vi.hoisted(() => ({
  signOutUser: vi.fn(() => Promise.resolve()),
  showSnackbar: vi.fn(),
}));

vi.mock('../../auth/firebase', () => ({ signOutUser: mocks.signOutUser }));
vi.mock('../Snackbar/Snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

const EMAIL = 'alex@minigames.com';
const SLUG = DETAILS.slug;

interface Context {
  dialog: HTMLDialogElement;
  router: typeof RouterModule;
  authState: typeof AuthStateModule;
  fetchMock: ReturnType<typeof mockFetch>;
  q: (selector: string) => HTMLElement;
  qa: (selector: string) => HTMLElement[];
}

const detailsRoute = (overrides = {}): MockRoute => ({
  match: path(`/games/${SLUG}`),
  body: { data: { ...DETAILS, ...overrides } },
});

const commentsRoute = (
  comments: GameComment[] = [comment()],
  total = comments.length
): MockRoute => ({
  match: path(`/games/${SLUG}/comments`),
  body: { data: comments, meta: { totalComments: total, returnedCount: comments.length } },
});

async function setup(
  options: { signedIn?: boolean; routes?: MockRoute[]; url?: string } = {}
): Promise<Context> {
  localStorage.clear();
  if (options.signedIn === true) {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ displayName: 'AlexPro', email: EMAIL, authenticatedAt: Date.now() })
    );
  }
  const fetchMock = mockFetch(options.routes ?? [detailsRoute(), commentsRoute()]);
  window.history.replaceState(null, '', options.url ?? `/?game=${SLUG}`);
  vi.resetModules();
  const authState = await import('../../auth/authState');
  const { installAuthGuard } = await import('../../auth/authGuard');
  const router = await import('../../router/router');
  authState.initSession();
  installAuthGuard();
  router.startRouter();
  const { GameDetailsDialog } = await import('./GameDetailsDialog');
  const dialog = GameDetailsDialog();
  document.body.replaceChildren(dialog);
  await flush();
  await flush();

  const qa = (selector: string): HTMLElement[] => [
    ...dialog.querySelectorAll<HTMLElement>(selector),
  ];
  const q = (selector: string): HTMLElement => {
    const found = qa(selector)[0];
    if (found === undefined) throw new Error(`Missing ${selector}`);
    return found;
  };
  return { dialog, router, authState, fetchMock, q, qa };
}

const calls = (ctx: Context, method: string, suffix: string): [string, RequestInit][] =>
  ctx.fetchMock.mock.calls
    .map(([input, init]): [string, RequestInit] => [requestUrl(input), init ?? {}])
    .filter(
      ([url, init]) => (init.method ?? 'GET') === method && url.split('?')[0]?.endsWith(suffix)
    );

const textarea = (ctx: Context): HTMLTextAreaElement =>
  ctx.q('.game-dialog__textarea') as HTMLTextAreaElement;

const typeComment = (ctx: Context, value: string): void => {
  textarea(ctx).value = value;
  textarea(ctx).dispatchEvent(new Event('input', { bubbles: true }));
};

const pressEnter = (ctx: Context, shiftKey = false): void => {
  textarea(ctx).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', shiftKey, bubbles: true, cancelable: true })
  );
};

describe('GameDetailsDialog', () => {
  beforeEach(() => {
    mocks.showSnackbar.mockClear();
    mocks.signOutUser.mockClear();
  });

  it('loads details and comments as a guest without an email', async () => {
    const ctx = await setup();
    expect(ctx.dialog.open).toBe(true);
    expect(ctx.q('.game-dialog__title').textContent).toBe(DETAILS.name);
    expect(ctx.q('.game-dialog__comments').textContent).toContain('Such a calming little game!');
    expect(ctx.dialog.textContent).toContain('Comments (1)');
    for (const [url] of calls(ctx, 'GET', SLUG)) expect(url).not.toContain('userEmail');
  });

  it('locks the comment form for guests', async () => {
    const ctx = await setup();
    expect(textarea(ctx).disabled).toBe(true);
    expect((ctx.q('.game-dialog__send') as HTMLButtonElement).disabled).toBe(true);
    expect(ctx.q('.game-dialog__avatar--me').querySelector('svg')).not.toBeNull();

    ctx.q('.game-dialog__login').click();
    expect(ctx.router.getState()).toMatchObject({ game: SLUG, auth: 'login' });
  });

  it('personalises the requests and avatar for a signed in user', async () => {
    const ctx = await setup({
      signedIn: true,
      routes: [detailsRoute({ isLikedByCurrentUser: true }), commentsRoute()],
    });
    const urls = calls(ctx, 'GET', SLUG).concat(calls(ctx, 'GET', '/comments'));
    for (const [url] of urls) expect(url).toContain('userEmail=alex%40minigames.com');
    expect(ctx.q('.game-dialog__favorite').getAttribute('aria-pressed')).toBe('true');
    expect(ctx.q('.game-dialog__favorite').textContent).toBe('Remove from Favorites');
    expect(ctx.q('.game-dialog__avatar--me').textContent).toBe('A');
    expect(textarea(ctx).disabled).toBe(false);
  });

  it('renders comment text safely with a stable token avatar', async () => {
    const ctx = await setup({
      routes: [
        detailsRoute(),
        commentsRoute([
          comment({ commentId: 'a', authorName: ' zed', text: '<img src=x onerror=alert(1)>' }),
          comment({ commentId: 'b', authorName: 'zed' }),
        ]),
      ],
    });
    expect(ctx.qa('.game-dialog__comments img')).toHaveLength(0);
    expect(ctx.q('.game-dialog__comment-body').textContent).toBe('<img src=x onerror=alert(1)>');

    const avatars = ctx.qa('.game-dialog__comment .game-dialog__avatar');
    expect(avatars.map((avatar) => avatar.textContent)).toEqual(['Z', 'Z']);
    const colorClass = (avatar: HTMLElement | undefined): string | undefined =>
      [...(avatar?.classList ?? [])].find((name) => name.startsWith('game-dialog__avatar--color-'));
    expect(colorClass(avatars[0])).toMatch(/--color-[1-5]$/);
    expect(colorClass(avatars[0])).toBe(colorClass(avatars[1]));
  });

  describe('favorites', () => {
    it('sends guests to auth with a warning and no request', async () => {
      const ctx = await setup();
      ctx.q('.game-dialog__favorite').click();
      expect(calls(ctx, 'POST', '/favorite')).toHaveLength(0);
      expect(mocks.showSnackbar).toHaveBeenCalledWith(expect.stringMatching(/Log in/), 'warning');
      expect(ctx.router.getState()).toMatchObject({ game: SLUG, auth: 'login' });
    });

    it('toggles from the server response and locks while pending', async () => {
      let release: () => void = () => undefined;
      const ctx = await setup({ signedIn: true });
      const response = new Promise<Response>((resolve) => {
        release = () => {
          resolve(
            new Response(
              JSON.stringify({ data: { gameSlug: SLUG, isFavorited: true, likesCount: 31201 } })
            )
          );
        };
      });
      ctx.fetchMock.mockImplementationOnce(() => response);

      const button = ctx.q('.game-dialog__favorite') as HTMLButtonElement;
      button.click();
      button.click();
      expect(button.disabled).toBe(true);
      expect(button.querySelector('.spinner')).not.toBeNull();
      expect(ctx.fetchMock.mock.calls.at(-1)?.[1]).toMatchObject({
        method: 'POST',
        body: JSON.stringify({ userEmail: EMAIL }),
      });

      release();
      await flush();
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(ctx.q('.game-dialog__stats').textContent).toContain('31.2K');
      expect(calls(ctx, 'POST', '/favorite')).toHaveLength(1);
    });

    it('does not retry or flip the state when the outcome is unknown', async () => {
      const ctx = await setup({
        signedIn: true,
        routes: [
          detailsRoute(),
          commentsRoute(),
          { match: path('/favorite', 'POST'), error: new TypeError('Failed to fetch') },
        ],
      });
      const button = ctx.q('.game-dialog__favorite') as HTMLButtonElement;
      button.click();
      await flush();

      expect(calls(ctx, 'POST', '/favorite')).toHaveLength(1);
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.disabled).toBe(false);
      expect(mocks.showSnackbar).toHaveBeenCalledWith(
        expect.stringMatching(/could not confirm/),
        'error'
      );
    });

    it('blocks the request after expiry and restores the game after auth closes', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const ctx = await setup({ signedIn: true });
      vi.setSystemTime(Date.now() + SESSION_LIFETIME_MS);

      ctx.q('.game-dialog__favorite').click();

      expect(calls(ctx, 'POST', '/favorite')).toHaveLength(0);
      expect(ctx.authState.getSession()).toBeNull();
      expect(mocks.showSnackbar).toHaveBeenCalledTimes(1);
      expect(ctx.router.getState()).toMatchObject({ game: SLUG, auth: 'login' });
      vi.useRealTimers();

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(ctx.dialog.open).toBe(false);

      ctx.router.navigate({ auth: null });
      await flush();
      expect(ctx.dialog.open).toBe(true);
      expect(textarea(ctx).disabled).toBe(true);
    });

    it('reloads in signed in mode after authentication', async () => {
      const ctx = await setup();
      ctx.router.navigate({ auth: 'login' });
      ctx.authState.startSession({ displayName: 'AlexPro', email: EMAIL });
      ctx.router.navigate({ auth: null });
      await flush();
      await flush();

      expect(ctx.dialog.open).toBe(true);
      expect(calls(ctx, 'GET', SLUG).at(-1)?.[0]).toContain('userEmail=');
      expect(textarea(ctx).disabled).toBe(false);
    });

    it('switches to guest mode on logout', async () => {
      const ctx = await setup({ signedIn: true });
      await ctx.authState.logout();
      await flush();
      expect(textarea(ctx).disabled).toBe(true);
      expect(calls(ctx, 'GET', SLUG).at(-1)?.[0]).not.toContain('userEmail=');
    });
  });

  describe('comment form', () => {
    it('grows with its content', async () => {
      const ctx = await setup({ signedIn: true });
      Object.defineProperty(textarea(ctx), 'scrollHeight', { value: 72, configurable: true });
      typeComment(ctx, 'line\nline\nline');
      expect(textarea(ctx).style.height).toBe('72px');
    });

    it('rejects empty and too long text inline', async () => {
      const ctx = await setup({ signedIn: true });
      typeComment(ctx, '   ');
      pressEnter(ctx);
      expect(ctx.q('.game-dialog__comment-error').textContent).toMatch(/Write something/);

      typeComment(ctx, 'a'.repeat(501));
      pressEnter(ctx);
      expect(ctx.q('.game-dialog__comment-error').textContent).toMatch(/500/);
      expect(calls(ctx, 'POST', '/comments')).toHaveLength(0);
    });

    it('keeps Shift+Enter for new lines', async () => {
      const ctx = await setup({ signedIn: true });
      typeComment(ctx, 'Hello');
      pressEnter(ctx, true);
      expect(calls(ctx, 'POST', '/comments')).toHaveLength(0);
    });

    it('posts on Enter, clears the field and reloads the latest comments', async () => {
      const ctx = await setup({
        signedIn: true,
        routes: [
          detailsRoute(),
          {
            match: path(`/games/${SLUG}/comments`, 'POST'),
            status: 201,
            body: { data: comment({ commentId: 'new', text: 'Lovely' }) },
          },
          commentsRoute([comment({ commentId: 'new', text: 'Lovely' })], 7),
        ],
      });
      typeComment(ctx, '  Lovely  ');
      pressEnter(ctx);

      expect(textarea(ctx).disabled).toBe(true);
      expect((ctx.q('.game-dialog__send') as HTMLButtonElement).disabled).toBe(true);
      const [, init] = calls(ctx, 'POST', '/comments')[0] ?? [];
      expect(JSON.parse(init?.body as string)).toEqual({
        userEmail: EMAIL,
        authorName: 'AlexPro',
        text: 'Lovely',
      });

      await flush();
      await flush();
      expect(textarea(ctx).value).toBe('');
      expect(textarea(ctx).disabled).toBe(false);
      const reload = calls(ctx, 'GET', '/comments').at(-1)?.[0] ?? '';
      expect(reload).toContain('limit=3');
      expect(reload).toContain('sort=newest');
      expect(reload).toContain('userEmail=');
      expect(ctx.dialog.textContent).toContain('Comments (7)');
    });

    it('keeps the text and unlocks after a definitive rejection', async () => {
      const ctx = await setup({
        signedIn: true,
        routes: [
          detailsRoute(),
          commentsRoute(),
          {
            match: path('/comments', 'POST'),
            status: 400,
            body: { error: 'authorName must be 2-30 characters' },
          },
        ],
      });
      typeComment(ctx, 'Hello');
      (ctx.q('.game-dialog__send') as HTMLButtonElement).click();
      await flush();

      expect(textarea(ctx).value).toBe('Hello');
      expect(textarea(ctx).disabled).toBe(false);
      expect(ctx.q('.game-dialog__comment-error').textContent).toBe(
        'authorName must be 2-30 characters'
      );
    });

    it('keeps the text and reports an unknown outcome without resending', async () => {
      const ctx = await setup({
        signedIn: true,
        routes: [
          detailsRoute(),
          commentsRoute(),
          { match: path('/comments', 'POST'), error: new TypeError('Failed to fetch') },
        ],
      });
      typeComment(ctx, 'Hello');
      pressEnter(ctx);
      await flush();

      expect(textarea(ctx).value).toBe('Hello');
      expect(calls(ctx, 'POST', '/comments')).toHaveLength(1);
      expect(mocks.showSnackbar).toHaveBeenCalledWith(
        expect.stringMatching(/could not confirm/),
        'error'
      );
    });

    it('clears the field when the dialog is opened again', async () => {
      const ctx = await setup({ signedIn: true });
      typeComment(ctx, 'Draft');
      ctx.router.navigate({ game: null });
      ctx.router.navigate({ game: SLUG });
      await flush();
      await flush();
      expect(textarea(ctx).value).toBe('');
    });
  });

  describe('comment likes', () => {
    it('sends guests to auth without a request', async () => {
      const ctx = await setup();
      ctx.q('.game-dialog__like').click();
      expect(calls(ctx, 'POST', '/like')).toHaveLength(0);
      expect(ctx.router.getState().auth).toBe('login');
    });

    it('initialises from the personalised list and updates from the response', async () => {
      const ctx = await setup({
        signedIn: true,
        routes: [
          detailsRoute(),
          commentsRoute([comment({ isLikedByCurrentUser: true, likesCount: 5 })]),
          {
            match: path('/comments/c1/like', 'POST'),
            body: { data: { isLikedByCurrentUser: false, likesCount: 4 } },
          },
        ],
      });
      const like = ctx.q('.game-dialog__like') as HTMLButtonElement;
      expect(like.getAttribute('aria-pressed')).toBe('true');

      like.click();
      like.click();
      expect(like.disabled).toBe(true);
      expect(like.querySelector('.spinner')).not.toBeNull();
      await flush();

      expect(calls(ctx, 'POST', '/like')).toHaveLength(1);
      expect(like.getAttribute('aria-pressed')).toBe('false');
      expect(like.textContent).toBe('4');
      expect(like.disabled).toBe(false);
    });

    it('keeps the state and reports a failure', async () => {
      const ctx = await setup({
        signedIn: true,
        routes: [
          detailsRoute(),
          commentsRoute(),
          { match: path('/like', 'POST'), status: 429, body: { error: 'Rate limit exceeded' } },
        ],
      });
      const like = ctx.q('.game-dialog__like') as HTMLButtonElement;
      like.click();
      await flush();
      expect(like.textContent).toBe('3');
      expect(mocks.showSnackbar).toHaveBeenCalledWith('Rate limit exceeded', 'error');
    });
  });

  it('closes with the button, the backdrop and Escape', async () => {
    const ctx = await setup();
    ctx.q('.game-dialog__close').click();
    expect(ctx.router.getState().game).toBeNull();

    ctx.router.navigate({ game: SLUG });
    ctx.dialog.dispatchEvent(new MouseEvent('click'));
    expect(ctx.router.getState().game).toBeNull();

    ctx.router.navigate({ game: SLUG });
    ctx.dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(ctx.router.getState().game).toBeNull();
  });

  it('falls back to the card image when the hero fails', async () => {
    const ctx = await setup();
    const cover = ctx.q('.game-dialog__cover') as HTMLImageElement;
    cover.dispatchEvent(new Event('error'));
    expect(cover.src).toContain(`${SLUG}-card.jpg`);
    cover.dispatchEvent(new Event('error'));
    expect(cover.src).toContain(`${SLUG}-card.jpg`);
  });

  it('shows the not found state for a missing game', async () => {
    const ctx = await setup({
      routes: [{ match: path(`/games/${SLUG}`), status: 404, body: { error: 'Game not found' } }],
    });
    expect(ctx.dialog.textContent).toContain('Game not found');
  });
});
