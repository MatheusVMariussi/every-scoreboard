# Every Scoreboard - TODO

## High Impact

- [x] **Verify hardcoded sizes** — Replaced all hardcoded pixel values across 17 files with responsive equivalents using `react-native-responsive-screen` + a custom `ms()` (moderate scale) utility. Modals now use `wp()` with `maxWidth` to prevent overflow on zoomed/small screens.
- [x] **Add tests for game logic** — 52 unit tests across Truco, Cacheta, and Fodinha pure functions (Jest + jest-expo).
- [x] **Fix silent storage failures** — `storage.ts` only `console.error`s on failure. Add user-facing feedback (toast/alert) when reads/writes fail.
- [x] **Add error boundary** — `ErrorBoundary` component wraps navigator; shows recovery screen with "Try Again" and "Reset Data" options.
- [x] **Finish or hide Canastra** — `CanastraScreen.tsx` is a stub ("Em construção") but still navigable. Either implement it or hide behind a "coming soon" badge that doesn't navigate.
- [x] **Stop saves from overwriting the stored game** — Cacheta wrote its default table over the saved game on every open, and all three games wrote defaults over the save after a failed read. The game hooks now persist through `useAutoSave`, which skips writes until the save has loaded and skips writing back the loaded state.

## Medium Impact

- [x] **Extract base modal components** — The three game settings modals share `SettingsModalShell` + `OptionButton`. The three "how to play" guides share `HelpModalShell` + `PlayingCard`; Truco's guide now uses the dark theme like the others, and guides restart at step 1 when reopened.
- [x] **Extract shared game screen logic** — Rescoped from a screen wrapper: the tutorial logic copied into all three screens is now `useGameTutorial`, and Cacheta/Fodinha share `EditRoundOverlay` for editing past rounds.
- [x] **Add ESLint + Prettier** — Strict TypeScript-aware ESLint (flat config) + Prettier. All errors resolved across the codebase.

## Nice to Have

- [x] **Add accessibility labels** — Icon-only buttons have labels, Cacheta's letter buttons announce the full action, and the Truco score is an adjustable control (increment/decrement, plus a "truco" action) since screen readers can't do its tap/swipe gestures.
- [x] **Add loading state to game screens** — Truco and Cacheta wait for the save before rendering scores, like Fodinha already did.
- [x] **Validate Truco and Cacheta saves on load** — `parseTrucoSave` and `parseCachetaSave` check every field, like Fodinha's `parseFodinhaSave`, and fall back to defaults instead of letting a missing field from an old or corrupt save crash the screen. The shared checks live in `utils/parse.ts`.
