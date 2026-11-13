import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import type { Camera } from 'react-native-maps';

import { EventMarker } from './EventMarker';
import { Coordinate } from '../services/routingService';
import { Event, hasValidCoordinates } from '../types/event';
import { NAVIGATION_ZOOM, routeBearing } from '../utils/geo';
import { useAppTheme } from '../utils/theme';

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

const CAMPUS_REGION: Region = {
  latitude: 33.7756,
  longitude: -84.3963,
  latitudeDelta: 0.014,
  longitudeDelta: 0.014,
};

export default function CampusMap({ events, selectedEvent, onSelect, showUserLocation = false, routeCoordinates = [], userLocation = null, followUser = false, onStopNavigation }: CampusMapProps) {
  const mapRef = useRef<MapView>(null);
  const { colors, mode } = useAppTheme();
  const wasFollowing = useRef(false);
  const fittedRoute = useRef<Coordinate[] | null>(null);
  const [heading, setHeading] = useState(0);
  const [orientation, setOrientation] = useState<'north' | 'heading'>('north');

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    if (orientation === 'heading' || followUser) {
      (async () => {
        try {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (!permission.granted) {
            setOrientation('north');
            return;
          }
          subscription = await Location.watchHeadingAsync((nextHeading) => {
            const next = nextHeading.trueHeading >= 0 ? nextHeading.trueHeading : nextHeading.magHeading;
            if (!cancelled && Number.isFinite(next)) setHeading(next);
          });
          if (cancelled) subscription.remove();
        } catch {
          setOrientation('north');
        }
      })();
    }

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [followUser, orientation]);

  useEffect(() => {
    if (!followUser || !userLocation || !mapRef.current) {
      if (!followUser) wasFollowing.current = false;
      return;
    }
    const map = mapRef.current;
    const firstNavigationFrame = !wasFollowing.current;
    wasFollowing.current = true;
    const target: Camera = {
      center: userLocation,
      heading: routeBearing(userLocation, routeCoordinates),
      pitch: 45,
    };
    if (firstNavigationFrame) {
      map.setCamera({ ...target, zoom: NAVIGATION_ZOOM });
    } else {
      map.animateCamera(target, { duration: 350 });
    }
  }, [followUser, routeCoordinates, userLocation]);

  useEffect(() => {
    if (followUser || !mapRef.current) return;
    let cancelled = false;
    mapRef.current.getCamera().then((camera) => {
      if (!cancelled) {
        mapRef.current?.animateCamera({ ...camera, heading: orientation === 'heading' ? heading : 0 }, { duration: 250 });
      }
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [followUser, heading, orientation]);

  useEffect(() => {
    if (!followUser && routeCoordinates.length > 1 && fittedRoute.current !== routeCoordinates) {
      fittedRoute.current = routeCoordinates;
      mapRef.current?.fitToCoordinates(routeCoordinates, {
        animated: false,
        edgePadding: { top: 100, right: 50, bottom: 340, left: 50 },
      });
    }
  }, [followUser, routeCoordinates]);

  useEffect(() => {
    if (!selectedEvent || !hasValidCoordinates(selectedEvent)) return;
    mapRef.current?.animateToRegion({
      latitude: selectedEvent.latitude,
      longitude: selectedEvent.longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    }, 450);
  }, [selectedEvent]);

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={CAMPUS_REGION}
        ref={mapRef}
        rotateEnabled
        showsCompass
        showsPointsOfInterests
        showsUserLocation={showUserLocation && !followUser}
        style={styles.map}
      >
        {routeCoordinates.length > 1 ? (
          <Polyline coordinates={routeCoordinates} strokeColor="#2D6A4F" strokeWidth={5} />
        ) : null}
        {followUser && userLocation ? (
          <Marker
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={userLocation}
            flat
            rotation={0}
            tracksViewChanges
          >
            <View style={[styles.directionMarker, { transform: [{ rotate: `${heading}deg` }] }]}>
              <View style={styles.directionDropTip} />
              <View style={styles.directionDropBody} />
              <View style={styles.directionDot} />
            </View>
          </Marker>
        ) : null}
        {events.map((event) => (
          <EventMarker
            event={event}
            key={event.id}
            onPress={onSelect}
            selected={selectedEvent?.id === event.id}
          />
        ))}
      </MapView>
      <View style={styles.controls}>
        {followUser ? (
          <Pressable accessibilityLabel="Exit route preview" onPress={onStopNavigation} style={[styles.stopButton, { backgroundColor: colors.dangerSoft }]}>
            <Text style={styles.stopText}>×</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityLabel={orientation === 'north' ? 'Switch to device heading' : 'Switch to north up'} onPress={() => setOrientation((value) => value === 'north' ? 'heading' : 'north')} style={[styles.compassButton, { backgroundColor: colors.surface }]}>
          <Text style={[styles.compassArrow, { color: mode === 'light' ? '#D65E45' : '#FF9E88', transform: [{ rotate: `${orientation === 'heading' ? -heading : 0}deg` }] }]}>↑</Text>
          <Text style={[styles.compassLabel, { color: colors.textMuted }]}>{orientation === 'north' ? 'N' : 'H'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: { gap: 8, position: 'absolute', right: 16, top: 16 },
  compassButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, elevation: 4, height: 48, justifyContent: 'center', shadowColor: '#18352A', shadowOpacity: 0.16, shadowRadius: 5, width: 48 },
  compassArrow: { color: '#D65E45', fontSize: 20, fontWeight: '900', lineHeight: 20 },
  compassLabel: { color: '#53665B', fontSize: 9, fontWeight: '900' },
  stopButton: { alignItems: 'center', backgroundColor: '#E76F51', borderRadius: 12, elevation: 4, height: 40, justifyContent: 'center', shadowColor: '#18352A', shadowOpacity: 0.16, shadowRadius: 5, width: 40 },
  stopText: { color: '#FFFFFF', fontSize: 24, lineHeight: 26 },
  directionMarker: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  directionDropTip: { borderBottomColor: '#2D6A4F', borderBottomWidth: 12, borderLeftColor: 'transparent', borderLeftWidth: 7, borderRightColor: 'transparent', borderRightWidth: 7, height: 0, position: 'absolute', top: 0, width: 0 },
  directionDropBody: { backgroundColor: '#2D6A4F', borderColor: '#FFFFFF', borderRadius: 11, borderWidth: 2, height: 20, position: 'absolute', top: 9, width: 20 },
  directionDot: { backgroundColor: '#FFFFFF', borderColor: '#2D6A4F', borderRadius: 5, borderWidth: 2, height: 10, width: 10 },
});
