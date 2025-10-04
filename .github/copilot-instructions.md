## Quick context

This is an Expo + React Native app using TypeScript and expo-router. The repository contains a minimal `app/` (the app entry) and an `app-example/` folder with example components and patterns you should follow.

Edit the app in `app/`. Use `app-example/` as authoritative examples for theming, navigation, and component patterns.

Key files:
- `package.json` (scripts: `start`, `android`, `ios`, `web`, `lint`, `reset-project`)
- `app/_layout.tsx` (ROOT layout used at runtime)
- `app/index.tsx` (main app screen placeholder)
- `app-example/app/_layout.tsx` (example layout showing ThemeProvider, reanimated import and modal routing)
- `app-example/components/themed-text.tsx` and `themed-view.tsx` (theming conventions)
- `app-example/constants/theme.ts` (Colors and Fonts used across examples)
- `tsconfig.json` (path alias `@/*` -> project root; TypeScript `strict: true`)

## Big-picture architecture

- Expo-managed React Native app. Entrypoint is `expo-router/entry` (see `package.json:main`).
- Uses file-based routing (expo-router). Route files live under `app/` (production) and `app-example/app/` (examples). Parent layout components control navigation stacks (see `app/_layout.tsx` and `app-example/app/_layout.tsx`).
- Theming is centralized via small helpers + themed components in `app-example/components/*`. Typical pattern:
  - `useThemeColor` (hook) resolves `light`/`dark` color tokens from `app-example/constants/theme.ts`.
  - `ThemedText` and `ThemedView` wrap RN primitives and accept optional `lightColor`/`darkColor` props.

Why this matters for edits: prefer changing or creating themed variants using the `useThemeColor` pattern to remain consistent with examples.

## Project-specific conventions

- Absolute imports use the `@/*` alias (see `tsconfig.json`). Examples in `app-example` use `@/components/...` and `@/hooks/...`. Keep imports consistent.
- Keep UI logic in small reusable components (see `app-example/components/ui/collapsible.tsx` for an example of local state + themed styles).
- Reanimated must be imported at the top-level before any worklets: you can see `import 'react-native-reanimated';` in `app-example/app/_layout.tsx`.
- Navigation patterns: modal screens use `Stack.Screen` with `options={{ presentation: 'modal' }}` (see `app-example/app/_layout.tsx` and `app-example/app/modal.tsx`).
- The `app/` folder is the runtime app — `app-example/` is reference material. When in doubt, match patterns from `app-example/` and port to `app/`.

## Developer workflows (commands)

- Install: `npm install`
- Start Metro + Expo dev tools: `npm run start` (a.k.a. `npx expo start`)
- Open on Android/iOS/Web: `npm run android`, `npm run ios`, `npm run web`
- Lint: `npm run lint` (uses `expo lint`)
- Reset project helper: `npm run reset-project` (runs `node ./scripts/reset-project.js`)

Notes:
- TypeScript is strict. Add or update types when adding new modules.
- No test harness present in the repo. Add tests to a new `__tests__` folder if needed and wire up test tooling separately.

## Integration & dependencies

- Core dependencies in `package.json`: `expo`, `expo-router`, `react-native-reanimated`, `@react-navigation/*`, `expo-image`, `expo-font`, and other Expo packages. Expect native behaviour to be validated on simulators or physical devices.
- `expo-router/entry` is the runtime main. Changing router behavior requires editing `app/_layout.tsx` or adding route files.

## Examples to follow (copy/paste-friendly)

- Themed text usage (see `app-example/components/themed-text.tsx`):

  - Wrap Text primitives with `ThemedText` and use the `type` prop (`title`, `link`, `defaultSemiBold`).

- Collapsible pattern (see `app-example/components/ui/collapsible.tsx`):

  - Local state + a `TouchableOpacity` header, icon rotation via inline transform, and conditional rendering for children.

## When editing for PRs

- Update `tsconfig.json` paths if you add new top-level aliases.
- Preserve `import 'react-native-reanimated';` at top-level if you add reanimated-based modules.
- Keep runtime changes inside `app/`. Use `app-example/` to craft and iterate on components before porting.

If anything here is unclear or you want more automation (tests, CI, or a development pre-run script), tell me which area to expand and I will iterate.
