# CLAUDE.md

## Project Overview

MXIS FE is a React Native app using Expo SDK 54, TypeScript, Expo Router, and NativeWind.

## Commands

Use Git Bash on Windows.

```bash
npm install
npm run typecheck
npm run start
npm run android
```

## Architecture

- `app/` is the Expo Router route layer.
- `src/features/` contains feature-specific code.
- `src/shared/` contains reusable UI, hooks, utilities, API setup, storage, types, constants, and styles.
- `src/providers/` contains global app providers.
- `src/routes/` contains route constants and navigation-related helpers.

## Conventions

- Use TypeScript.
- Use `.tsx` for React Native screens/components that render JSX.
- Use `.ts` for types, constants, utilities, stores, API clients, and non-JSX modules.
- Prefer feature-local code inside each `src/features/*` module.
- Put cross-feature reusable code in `src/shared`.
- Keep Expo SDK 54 compatibility when adding packages. Prefer `npx expo install <package>` for Expo-managed/native packages.
- Do not use Expo Go for BLE validation. BLE requires a development build because the app uses `react-native-ble-plx`.

## Styling

- Use NativeWind utility classes for screen and component styling.
- Shared Tailwind input CSS lives at `src/shared/styles/global.css`.
- Tailwind content paths should include both `app/**/*.{ts,tsx}` and `src/**/*.{ts,tsx}`.

## Validation

Before pushing changes, run:

```bash
npm run typecheck
npx expo install --check
```
