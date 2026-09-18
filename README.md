# MiniGames

A single-page web application for playing casual mini-games right in the browser.
Built for the [RS School Qualifying Stage](https://github.com/rolling-scopes-school/qualifying-stage) — MiniGames project.

## Tech Stack

- **TypeScript** (strict mode)
- **Vite** — dev server and production bundler
- **Sass** — design tokens, breakpoints and mixins
- **ESLint** + **Prettier** — code quality and formatting
- **Husky** + **lint-staged** — Git hooks (lint on commit, commit message check, lint & format check on push)

## Getting Started

```bash
git clone git@github.com:MtchedlishviliLevani/minigames.git
cd minigames
npm install
npm run dev
```

The dev server starts at `http://localhost:8080`.

## Scripts

| Script                 | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the development server                  |
| `npm run build`        | Type-check and build for production (`dist/`) |
| `npm run preview`      | Preview the production build locally          |
| `npm run lint`         | Run ESLint                                    |
| `npm run lint:fix`     | Run ESLint and auto-fix problems              |
| `npm run format`       | Format all files with Prettier                |
| `npm run format:check` | Check formatting without writing changes      |
| `npm run typecheck`    | Run the TypeScript compiler in check mode     |

## Project Structure

```text
minigames/
├── .github/            # Pull request template
├── .husky/             # Git hooks
├── public/
│   ├── assets/         # Game card images
│   └── mock/           # Mock JSON data (games, leaderboard)
├── scripts/            # Node helper scripts (commit message check)
├── src/
│   ├── main.ts         # Entry point
│   ├── app.ts          # App bootstrap — builds the page from components
│   ├── api/            # Mock API (fetches JSON from public/mock)
│   ├── components/     # UI components (Header, Hero, Carousel, Leaderboard, Footer, AuthDialog…)
│   ├── data/           # Static content (navigation links, brand text)
│   ├── styles/         # Sass tokens, breakpoints, mixins, reset, layout
│   ├── types/          # Shared TypeScript types
│   ├── utils/          # Helpers (DOM builder, formatting, validation)
│   └── assets/         # Icons and images imported by the app
├── index.html          # Empty body — everything is rendered by JavaScript
├── vite.config.ts
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
