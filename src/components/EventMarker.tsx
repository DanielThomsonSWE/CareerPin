import { Image, StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { Event, hasValidCoordinates } from '../types/event';
import { getBrandColor, getBrandMark } from '../utils/brand';

type EventMarkerProps = {
  event: Event;
  selected?: boolean;
  onPress: (event: Event) => void;
};

export function EventMarker({ event, selected = false, onPress }: EventMarkerProps) {
  if (!hasValidCoordinates(event)) {
    return null;
  }

  const brandColor = getBrandColor(event.company);

  return (
    <Marker
      coordinate={{ latitude: event.latitude, longitude: event.longitude }}
      title={event.company}
      description={event.title}
      onPress={() => onPress(event)}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.pinWrap}>
        <View style={[styles.pinTail, { backgroundColor: brandColor }]} />
        <View style={[styles.pin, { backgroundColor: brandColor }, selected && styles.selectedPin]}>
          {event.logoUrl ? (
            <Image source={{ uri: event.logoUrl }} style={styles.logo} />
          ) : (
            <Text style={styles.pinText}>{getBrandMark(event.company)}</Text>
          )}
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pinWrap: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'flex-start',
    width: 42,
  },
  pinTail: {
    bottom: 4,
    height: 12,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 12,
  },
  pin: {
    alignItems: 'center',
    backgroundColor: '#2D6A4F',
    borderColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 3,
    elevation: 5,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#172B22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    width: 36,
  },
  selectedPin: {
    borderColor: '#FDE5DD',
    borderWidth: 4,
    height: 42,
    width: 42,
  },
  pinText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  logo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    height: 22,
    width: 22,
  },
});
