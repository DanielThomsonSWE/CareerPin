# CareerPin

CareerPin is a React Native + Expo MVP for Georgia Tech students to discover recruiting events and company information sessions on a campus map. The current app uses six fictional local events; Handshake and CareerBuzz integrations are intentionally out of scope for this version.

## Requirements

- Node.js 18 or newer
- Expo Go on a physical iOS or Android device, or an iOS Simulator / Android Emulator

## Install and run

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go, or press `i` for the iOS Simulator, `a` for an Android Emulator, or `w` for web. The native app uses `react-native-maps` with the default native provider, so no map key is needed in Expo Go.

For web, set `EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY` before starting Expo. The web map uses Google's JavaScript Advanced Marker `PinElement`, with `logoUrl` when provided and a two-letter company mark as the fallback glyph. Without a web key, CareerPin shows a non-blank tappable campus preview instead of a blank screen.

## Google Maps SDK keys for development builds

Expo Go does not need additional map configuration. If you create a native development build and want Google Maps SDK support, create restricted keys in Google Cloud, enable Maps SDK for Android and/or Maps SDK for iOS, and associate them with this app's identifiers:

- Android package: `edu.gatech.careerpin`
- iOS bundle identifier: `edu.gatech.careerpin`

Do not commit API keys. Copy `.env.example` to `.env`, fill in the keys locally, and export them before generating a native build:

```bash
export GOOGLE_MAPS_ANDROID_API_KEY="your_android_key"
export GOOGLE_MAPS_IOS_API_KEY="your_ios_key"
export EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY="your_web_key"
npx expo prebuild
npx expo run:android
# or: npx expo run:ios
```

`app.config.js` reads those environment variables and passes them to the `react-native-maps` config plugin. The app intentionally leaves the `provider` prop unset so Expo Go and native builds use the platform's default map provider. If the app later switches to Google as an explicit provider, add `provider={PROVIDER_GOOGLE}` in `src/app/index.tsx` and rebuild the native binary.

## Project structure

```text
src/
  app/
    _layout.tsx       Expo Router stack
    index.tsx         Map/list home screen
  components/
    CampusMap*.tsx    Native map + Google Maps JavaScript web map
    EventMarker.tsx   Map pin
    EventCard.tsx     Sorted list row
    EventDetails.tsx  Selected event preview/details
  data/
    events.json       Six sample GT events
  services/
    eventService.ts   Async data boundary for future providers
  types/
    event.ts          Event model and coordinate guard
  utils/
    date.ts           Date/time formatting helpers
```

## MVP behavior

- Events are sorted chronologically.
- Search filters by company name.
- The Upcoming control filters out events that have started.
- Only in-person events with finite latitude/longitude values render pins.
- Selecting a list event switches to the map and animates to its marker.
- Selecting a marker opens event details and its registration link.
- Loading, data-load error, and empty filter states are included.

## Checks

```bash
npx tsc --noEmit
npx expo lint
```

No authentication, Supabase, Handshake scraping, or CareerBuzz scraping is included yet.
