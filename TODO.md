# Every Scoreboard - TODO

## High Impact

- [x] **Verify hardcoded sizes** — Replaced all hardcoded pixel values across 17 files with responsive equivalents using `react-native-responsive-screen` + a custom `ms()` (moderate scale) utility. Modals now use `wp()` with `maxWidth` to prevent overflow on zoomed/small screens.
- [x] **Add tests for game logic** — 52 unit tests across Truco, Cacheta, and Fodinha pure functions (Jest + jest-expo).
- [ ] **Fix silent storage failures** — `storage.ts` only `console.error`s on failure. Add user-facing feedback (toast/alert) when reads/writes fail.
- [x] **Add error boundary** — `ErrorBoundary` component wraps navigator; shows recovery screen with "Try Again" and "Reset Data" options.
- [ ] **Finish or hide Canastra** — `CanastraScreen.tsx` is a stub ("Em construção") but still navigable. Either implement it or hide behind a "coming soon" badge that doesn't navigate.

## Medium Impact

- [ ] **Extract base modal components** — `TrucoSettingsModal`, `CachetaSettingsModal`, `FodinhaSettingsModal` (~120 LOC each) and the 3 HelpModals (~270 LOC each) follow identical patterns. Extract shared base components to cut ~500 LOC.
- [ ] **Extract shared game screen wrapper** — `CachetaScreen` and `FodinhaScreen` share ~50% structure (tutorial management, layout ready state, edit history overlay).
- [ ] **Fix version mismatch** — `app.json` says 1.2.1 but `package.json` says 1.0.0.
- [ ] **Add ESLint + Prettier** — No lint/format config. Prevents style drift as codebase grows.

## Nice to Have

- [ ] **Add accessibility labels** — No `accessibilityLabel` on interactive elements. Icon-only buttons (pencil edit in Truco) are invisible to screen readers.
- [ ] **Replace tutorial polling with layout events** — `useTutorialTarget.ts` uses `setInterval(measure, 500)`. Layout event listeners would be more efficient.
- [ ] **Debounce storage writes** — `useTrucoGame.ts` saves to AsyncStorage on every state update. Debouncing would reduce I/O.
- [ ] **Add loading state to game screens** — Game hooks have `isLoaded` flag but screens don't use it, causing a brief flash of empty state on launch.
