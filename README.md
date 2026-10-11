# MiniGames

A single-page web application for playing casual mini-games right in the browser.
Built for the [RS School Qualifying Stage](https://github.com/rolling-scopes-school/qualifying-stage) — MiniGames project.

## Tech Stack

- **TypeScript** (strict mode)
- **Vite** — dev server and production bundler
- **Sass** — design tokens, breakpoints and mixins
- **ESLint** + **Prettier** — code quality and formatting
- **Husky** + **lint-staged** — Git hooks (lint on commit, commit message check, lint & format check on push)
- **Firebase Authentication** — email/password and Google sign-in
- **Vitest** + **happy-dom** + **@vitest/coverage-v8** — unit tests and coverage

## Getting Started

```bash
git clone git@github.com:MtchedlishviliLevani/minigames.git
cd minigames
npm install
npm run dev
```

The dev server starts at `http://localhost:8080`.

### Firebase

Sign-in needs a Firebase project with the **Email/Password** and **Google** providers enabled.
Copy `.env.example` to `.env.local` and fill in the web app config from
_Project settings → Your apps_:

```bash
cp .env.example .env.local
```

| Variable                    | Value        |
| --------------------------- | ------------ |
| `VITE_FIREBASE_API_KEY`     | `apiKey`     |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID`  | `projectId`  |
| `VITE_FIREBASE_APP_ID`      | `appId`      |

Add the deployment domain to _Authentication → Settings → Authorized domains_ and set the same
variables in the hosting environment.

## Authentication & App Session

Firebase confirms who the user is; the app session decides whether the UI treats them as signed in.

- **Storage key:** `minigames:mtchedlishvili-levani:app-session` in `localStorage`
- **Stored fields:** `displayName`, `email`, `authenticatedAt` (`Date.now()` at sign-in) and
  `avatarUrl` when the profile has a photo. No passwords or Firebase tokens are stored.
- **Lifetime:** 5 minutes from `authenticatedAt`. Reloading or using the app does not extend it.
- **Checks:** on startup, when the tab becomes visible, before every page or dialog navigation,
  before every favorite / comment / like request, and by a timer at the expiry moment.
- **Expired or invalid data:** only this key is removed, Firebase `signOut` is called and the app
  returns to Guest Mode.

To check expiry by hand: open DevTools → Application → Local Storage, set `authenticatedAt` to a
timestamp more than 5 minutes old, then reload or try to like a comment.

## Scripts

| Script                  | Description                                   |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Start the development server                  |
| `npm run build`         | Type-check and build for production (`dist/`) |
| `npm run preview`       | Preview the production build locally          |
| `npm run lint`          | Run ESLint                                    |
| `npm run lint:fix`      | Run ESLint and auto-fix problems              |
| `npm run format`        | Format all files with Prettier                |
| `npm run format:check`  | Check formatting without writing changes      |
| `npm run typecheck`     | Run the TypeScript compiler in check mode     |
| `npm test`              | Run all unit tests once                       |
| `npm run test:watch`    | Run unit tests in watch mode                  |
| `npm run test:coverage` | Run unit tests with a coverage summary        |

## Testing

Tests live next to the code they cover (`*.test.ts`) and run in a happy-dom environment.
Firebase and the backend API are mocked, so no credentials or network access are needed.

Coverage includes every file in `src/`. The only exclusions, each explained in
`vite.config.ts`, are the tests themselves, shared test helpers, the `main.ts` bootstrap and
type-only files.

## Project Structure

```text
minigames/
├── .github/            # Pull request template
├── .husky/             # Git hooks
├── public/
│   └── assets/         # Game card and hero images
├── scripts/            # Node helper scripts (commit message check)
├── src/
│   ├── main.ts         # Entry point
│   ├── app.ts          # App bootstrap — builds the page from components
│   ├── api/            # REST client and endpoint wrappers for the backend API
│   ├── auth/           # Firebase wrapper, app session, auth guard, profile helpers
│   ├── components/     # UI components (Header, Carousel, Library*, GameDetailsDialog, Footer…)
│   ├── pages/          # Page compositions (HomePage, LibraryPage, NotFoundPage)
│   ├── router/         # History API router — pages, Library query and dialogs
│   ├── data/           # Navigation content, sort options, category cache
│   ├── styles/         # Sass tokens, breakpoints, mixins, reset, layout
│   ├── types/          # Shared TypeScript types
│   ├── utils/          # Helpers (DOM builder, async sections, formatting, validation)
│   ├── test/           # Shared test helpers (fetch mock, fixtures)
│   └── assets/         # Icons and images imported by the app
├── index.html          # Empty body — everything is rendered by JavaScript
├── vercel.json         # SPA rewrite so deep links resolve on the deployment
├── .env.example        # Firebase web config template
├── vite.config.ts      # Vite and Vitest config (coverage scope and exclusions)
├── tsconfig.json
├── eslint.config.js
└── .prettierrc
```

## Git Workflow

- `main` — release branch
- `story-N` — base branch for each story; task branches are merged here
- `<type>/<short-description>` — task branches (e.g. `feat/header`, `chore/project-setup`)

Commit messages follow the [RS School git convention](https://rs.school/docs/git-convention):
`<type>: <subject>` where type is one of `init`, `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`.

## Design

[Figma — MiniGames](https://www.figma.com/design/4MnLizE59gZI2DDxaSgZqi/MiniGames?node-id=0-1&m=dev)
