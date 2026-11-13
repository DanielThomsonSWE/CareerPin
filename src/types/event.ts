export type Event = {
  id: string;
  company: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  source: string;
  sourceUrl?: string;
  logoUrl?: string;
  tags?: string[];
  industries?: string[];
  majors?: string[];
  isVirtual: boolean;
};

export function hasValidCoordinates(event: Event): event is Event & {
  latitude: number;
  longitude: number;
} {
  return (
    !event.isVirtual &&
    typeof event.latitude === 'number' &&
    typeof event.longitude === 'number' &&
    Number.isFinite(event.latitude) &&
    Number.isFinite(event.longitude)
  );
}
