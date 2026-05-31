# WatchLog

WatchLog is a mobile-first personal diary for tracking watched series and anime episodes. The project is intentionally not a Kinopoisk-like catalog: user data is local-first, and external APIs are used only to speed up adding titles.

## Goals

- Track the current season and episode without an account.
- Work as a regular SPA, installable PWA, and Capacitor WebView app.
- Keep the core diary usable offline through IndexedDB.
- Practice architecture decisions around routing, state, API integration, PWA, and native bridge boundaries.

## Stack

- Vite, React, TypeScript
- React Router
- TanStack Query for external APIs
- Zustand for lightweight UI state
- Dexie and IndexedDB for local diary data
- i18next and react-i18next for `ru/en`
- Ant Design Mobile for mobile UI
- vite-plugin-pwa for manifest and service worker
- Capacitor for Android/iOS WebView shell
- Vitest and Testing Library for checks

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run type-check
npm run test:run
```

## Architecture

```text
src/
  app/              app providers, router, global state
  pages/            route-level screens
  features/         user-facing flows
  entities/         domain types
  shared/           api, db, native bridge, i18n, ui, config
```

The app keeps native integration behind `NativeBridge`. React screens call a small interface instead of using Capacitor directly, so web/PWA and native runtime stay interchangeable.

## Data Model

- `Show`: title in the personal library with type, status, provider metadata, and current progress.
- `Episode`: generated local episode rows for fast marking.
- `WatchEvent`: local history entries for episode/range/season marks and status changes.

## External APIs

- TVMaze: series search.
- Jikan: anime search through the public MyAnimeList wrapper.

Both providers are normalized into a shared `ShowSearchResult`, so the app can add more sources later without changing UI flows.

## PWA And WebView Notes

- PWA manifest and service worker are configured through `vite-plugin-pwa`.
- Static assets and images use offline-friendly caching strategies.
- Capacitor is prepared for Android/iOS with `App`, `Network`, `StatusBar`, and `SplashScreen`.
- Android back button and network status are accessed through `NativeBridge`.

## Git

The project is ready for a local Git workflow. Remote repository configuration is intentionally left to the project owner.

## Roadmap

- Better episode metadata sync from providers.
- Push or local reminders for new seasons.
- Optional cloud sync while keeping account-free local mode.
- Import/export library backup.
- CI pipeline for lint, type-check, tests, and build.
