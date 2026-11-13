import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Event, hasValidCoordinates } from '../types/event';
import { Coordinate } from '../services/routingService';
import { getBrandColor, getBrandMark } from '../utils/brand';
import { NAVIGATION_ZOOM, routeBearing } from '../utils/geo';

declare const process: { env: Record<string, string | undefined> };

export type CampusMapProps = {
  events: Event[];
  selectedEvent: Event | null;
  onSelect: (event: Event) => void;
  showUserLocation?: boolean;
  routeCoordinates?: Coordinate[];
  userLocation?: Coordinate | null;
  followUser?: boolean;
  onStopNavigation?: () => void;
};

const WEB_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY;
const CAMPUS_CENTER = { lat: 33.7756, lng: -84.3963 };

function loadGoogleMaps(key: string): Promise<void> {
  const win = globalThis as any;
  if (win.google?.maps?.importLibrary) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const doc = win.document;
    const existing = doc.getElementById('careerpin-google-maps');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }

    const script = doc.createElement('script');
    script.id = 'careerpin-google-maps';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.onload = () => resolve();
    script.onerror = reject;
    doc.head.appendChild(script);
  });
}

function fallbackPosition(event: Event) {
  const longitude = event.longitude ?? CAMPUS_CENTER.lng;
  const latitude = event.latitude ?? CAMPUS_CENTER.lat;
  return {
    left: `${50 + (longitude - CAMPUS_CENTER.lng) * 1800}%`,
    top: `${50 - (latitude - CAMPUS_CENTER.lat) * 1800}%`,
  } as const;
}

export default function CampusMap({ events, selectedEvent, onSelect, routeCoordinates = [], userLocation = null, followUser = false }: CampusMapProps) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markerLibRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeRef = useRef<any>(null);
  const wasFollowing = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!WEB_API_KEY || !containerRef.current) return;
    let cancelled = false;

    loadGoogleMaps(WEB_API_KEY)
      .then(async () => {
        const google = (globalThis as any).google;
        const markerLib = await google.maps.importLibrary('marker');
        if (cancelled) return;
        markerLibRef.current = markerLib;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: CAMPUS_CENTER,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          mapId: 'DEMO_MAP_ID',
          zoom: 16,
        });
        setReady(true);
      })
      .catch(() => setError(true));

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => { marker.map = null; });
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !markerLibRef.current) return;
    const { AdvancedMarkerElement, PinElement } = markerLibRef.current;
    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current = events.filter(hasValidCoordinates).map((event) => {
      const pin = new PinElement({
        background: getBrandColor(event.company),
        borderColor: '#FFFFFF',
        glyphColor: '#FFFFFF',
        glyphSrc: event.logoUrl,
        glyphText: event.logoUrl ? undefined : getBrandMark(event.company),
        scale: selectedEvent?.id === event.id ? 1.18 : 1,
      });
      const marker = new AdvancedMarkerElement({
        content: pin.element,
        map: mapRef.current,
        position: { lat: event.latitude, lng: event.longitude },
        title: event.company,
      });
      marker.addListener('click', () => onSelect(event));
      return marker;
    });

    if (selectedEvent && hasValidCoordinates(selectedEvent)) {
      mapRef.current.panTo({ lat: selectedEvent.latitude, lng: selectedEvent.longitude });
      mapRef.current.setZoom(17);
    }
  }, [events, onSelect, ready, selectedEvent]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    routeRef.current?.setMap(null);
    if (routeCoordinates.length < 2) return;

    const google = (globalThis as any).google;
    routeRef.current = new google.maps.Polyline({
      geodesic: true,
      map: mapRef.current,
      path: routeCoordinates.map(({ latitude, longitude }) => ({ lat: latitude, lng: longitude })),
      strokeColor: '#2D6A4F',
      strokeOpacity: 0.9,
      strokeWeight: 5,
    });
    const bounds = new google.maps.LatLngBounds();
    routeCoordinates.forEach(({ latitude, longitude }) => bounds.extend({ lat: latitude, lng: longitude }));
    mapRef.current.fitBounds(bounds, { top: 80, right: 40, bottom: 340, left: 40 });
  }, [ready, routeCoordinates]);

  useEffect(() => {
    if (ready && followUser && userLocation) {
      const firstNavigationFrame = !wasFollowing.current;
      wasFollowing.current = true;
      mapRef.current?.panTo({ lat: userLocation.latitude, lng: userLocation.longitude });
      if (firstNavigationFrame) mapRef.current?.setZoom(NAVIGATION_ZOOM);
      mapRef.current?.setTilt(45);
      if (routeCoordinates.length > 1) mapRef.current?.setHeading(routeBearing(userLocation, routeCoordinates));
    } else if (!followUser) {
      wasFollowing.current = false;
    }
  }, [followUser, ready, routeCoordinates, userLocation]);

  if (!WEB_API_KEY || error) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Campus map preview</Text>
        <Text style={styles.fallbackBody}>
          Add EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY to use Google Maps on web.
        </Text>
        {events.filter(hasValidCoordinates).map((event) => (
          <Pressable
            key={event.id}
            onPress={() => onSelect(event)}
            style={[styles.fallbackPin, fallbackPosition(event)]}
          >
            <View style={[styles.fallbackPinCircle, { backgroundColor: getBrandColor(event.company) }]}>
              {event.logoUrl ? (
                <Image source={{ uri: event.logoUrl }} style={styles.fallbackLogo} />
              ) : (
                <Text style={styles.fallbackPinText}>{getBrandMark(event.company)}</Text>
              )}
            </View>
          </Pressable>
        ))}
      </View>
    );
  }

  return <View ref={containerRef} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  fallback: { backgroundColor: '#DCEDE3', flex: 1, overflow: 'hidden' },
  fallbackTitle: {
    color: '#18352A',
    fontSize: 17,
    fontWeight: '800',
    left: 20,
    position: 'absolute',
    top: 24,
    zIndex: 2,
  },
  fallbackBody: {
    color: '#53665B',
    fontSize: 12,
    left: 20,
    maxWidth: 250,
    position: 'absolute',
    top: 50,
    zIndex: 2,
  },
  fallbackPin: { position: 'absolute' },
  fallbackPinCircle: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 3,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  fallbackPinText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  fallbackLogo: { backgroundColor: '#FFFFFF', borderRadius: 10, height: 20, width: 20 },
});
