export type TravelMode = 'WALK' | 'DRIVE' | 'TRANSIT';

export type Coordinate = { latitude: number; longitude: number };

export type RouteSummary = {
  durationSeconds: number;
  durationLabel: string;
  distanceMeters: number;
  distanceLabel: string;
  coordinates: Coordinate[];
};

declare const process: { env: Record<string, string | undefined> };

const ROUTES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_ROUTES_API_KEY;

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} hr ${minutes % 60 ? `${minutes % 60} min` : ''}`.trim()
    : `${minutes} min`;
}

function formatDistance(meters: number): string {
  return meters < 160
    ? `${Math.round(meters)} m`
    : `${(meters / 1609.344).toFixed(1)} mi`;
}

function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }

  return coordinates;
}

export async function getRoute(
  origin: Coordinate,
  destination: Coordinate,
  travelMode: TravelMode,
): Promise<RouteSummary> {
  if (!ROUTES_API_KEY) {
    throw new Error('Add EXPO_PUBLIC_GOOGLE_ROUTES_API_KEY to calculate ETA.');
  }

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': ROUTES_API_KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
      destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
      travelMode,
      ...(travelMode === 'DRIVE' ? { routingPreference: 'TRAFFIC_AWARE' } : {}),
      languageCode: 'en-US',
      units: 'IMPERIAL',
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Google Routes: ${message}`);
  }

  const route = body.routes?.[0];
  if (!route) throw new Error('No route was found to this event.');

  const durationSeconds = Number.parseFloat(String(route.duration ?? '0').replace('s', ''));
  const distanceMeters = Number(route.distanceMeters ?? 0);
  return {
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
    distanceMeters,
    distanceLabel: formatDistance(distanceMeters),
    coordinates: decodePolyline(route.polyline?.encodedPolyline ?? ''),
  };
}
