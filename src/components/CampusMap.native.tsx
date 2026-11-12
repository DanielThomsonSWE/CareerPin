import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';

import { EventMarker } from './EventMarker';
import { Event, hasValidCoordinates } from '../types/event';

export type CampusMapProps = {
  events: Event[];
  selectedEvent: Event | null;
  onSelect: (event: Event) => void;
};

const CAMPUS_REGION: Region = {
  latitude: 33.7756,
  longitude: -84.3963,
  latitudeDelta: 0.014,
  longitudeDelta: 0.014,
};

export default function CampusMap({ events, selectedEvent, onSelect }: CampusMapProps) {
  const mapRef = useRef<MapView>(null);

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
    <MapView
      initialRegion={CAMPUS_REGION}
      ref={mapRef}
      showsCompass={false}
      showsPointsOfInterests
      style={styles.map}
    >
      {events.map((event) => (
        <EventMarker
          event={event}
          key={event.id}
          onPress={onSelect}
          selected={selectedEvent?.id === event.id}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
