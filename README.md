# MXIS FE

MXIS React Native frontend built with Expo SDK 54.

## Orange Smart Charm

Current Orange Board BLE integration and the hardware verification checklist:
[Orange BLE integration](docs/orange-ble-integration.md).

Run the protocol, transport, persistence and upload/ACK tests with `npm run test:charm`.
Use Node 24 LTS. Real BLE testing requires an Android development build, not Expo Go.

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
