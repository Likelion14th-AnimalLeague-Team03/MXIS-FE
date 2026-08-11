# MXIS FE

MXIS React Native frontend built with Expo SDK 54.

## Tech Stack

- React Native
- TypeScript
- Expo SDK 54
- Expo Router
- NativeWind
- TanStack Query
- Zustand
- Axios
- React Hook Form + Zod
- AsyncStorage
- react-native-ble-plx

## Getting Started

Install dependencies:

```bash
npm install
```

Run type check:

```bash
npm run typecheck
```

Start the development server for a development build:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

## Development Notes

This project uses Expo Router, so screens are registered through the `app/` directory.

Feature code lives under `src/features`, and shared code lives under `src/shared`.

BLE features use `react-native-ble-plx`, so they require an Expo Development Build. Expo Go is not enough for real BLE testing.

## Project Structure

```text
app/                  Expo Router entry and route files
src/features/         Feature-based app modules
src/shared/           Shared components, hooks, utils, api, storage, styles
src/routes/           Route constants and navigation-related helpers
src/providers/        App-level providers
```
