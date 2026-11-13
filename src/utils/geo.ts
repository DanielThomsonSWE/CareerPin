import type { Coordinate } from '../services/routingService';

export const NAVIGATION_ZOOM = 19;

export function bearingBetween(from: Coordinate, to: Coordinate): number {
  const radians = Math.PI / 180;
  const latitude1 = from.latitude * radians;
  const latitude2 = to.latitude * radians;
  const longitudeDelta = (to.longitude - from.longitude) * radians;
  const y = Math.sin(longitudeDelta) * Math.cos(latitude2);
  const x = Math.cos(latitude1) * Math.sin(latitude2) - Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(longitudeDelta);
  return (Math.atan2(y, x) / radians + 360) % 360;
}

export function routeBearing(origin: Coordinate, route: Coordinate[]): number {
  const nextPoint = route.slice(1).find((point) => Math.abs(point.latitude - origin.latitude) + Math.abs(point.longitude - origin.longitude) > 0.0002) ?? route[route.length - 1];
  return nextPoint ? bearingBetween(origin, nextPoint) : 0;
}

