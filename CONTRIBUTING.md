# Contributing to SportsBoard

Thank you for helping improve SportsBoard. Code, comments, public API names, default labels, and documentation must be written in English.

## Fork and clone

1. Fork `JacobDelcroix/sportsboard` on GitHub.
2. Clone your fork.
3. Create a focused branch for the change.

```bash
git clone git@github.com:YOUR_USERNAME/sportsboard.git
cd sportsboard
git switch -c feature/short-description
```

## Install and open the playground

SportsBoard uses npm and Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174). The playground lets you switch sport, language, editor/viewer mode, inspect or load JSON, and generate image previews.

## Project structure

```text
src/
├── core/                 Document, validation, history, and registry
├── viewer/               Read-only canvas, navigation, and image exports
├── editor/               Complete visual editing interface
├── element/              Declarative editor and viewer custom elements
└── sports/
    ├── basketball/       Basketball surfaces, elements, and tools
    └── football/         Football surfaces, elements, and tools
```

The repository publishes one npm package. Internal modules do not have their own `package.json` or `dist`. `npm run build` generates one ignored root `dist` directory.

## Validate a change

Run the complete validation before proposing a pull request:

```bash
npm run check
npm pack --dry-run
```

`npm run check` runs TypeScript validation, Vitest, the library build, public entry-point smoke tests, and the production playground build.

For focused work:

```bash
npm run typecheck
npm test
npm run build
npm run playground:build
```

When changing interactions, test both Basketball and Football, half and full surfaces, editor and viewer modes, English and French, JSON loading, and image generation.

## Add a language

English is the default catalog. A built-in language must cover the generic viewer, the editor interface, and every included sport.

To propose another language:

1. Add a JSON catalog beside `en.json` and `fr.json` in each relevant `locales` directory:
   - `src/viewer/locales`;
   - `src/editor/locales`;
   - `src/sports/basketball/locales`;
   - `src/sports/football/locales`.
2. Keep exactly the same keys as the English files and translate values only.
3. Register the locale in the corresponding `i18n.ts` catalogs and extend `SportsBoardLocale`.
4. Add the locale files to the public `exports` in `package.json`.
5. Add the language to the playground selector.
6. Add tests for generic controls, sport labels, fallback behavior, and application overrides.
7. Update the README and API reference with the new locale code.

Run `npm run check` and test both sports before opening the pull request. If a translation needs a different sentence structure, keep placeholders such as `{label}` and `{count}` intact.

## Propose a pull request

1. Keep the change focused and avoid unrelated formatting.
2. Add or update tests for behavior changes.
3. Update the README or relevant guide when the public API or interface changes.
4. Push your branch to your fork.
5. Open a pull request against the repository's default branch.

The pull request should explain the user-facing problem, the chosen solution, and how it was tested. Screenshots are welcome for visual changes.
