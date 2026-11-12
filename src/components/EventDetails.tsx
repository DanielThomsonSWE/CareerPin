import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Event } from '../types/event';
import { formatDate, formatTimeRange } from '../utils/date';

type EventDetailsProps = {
  event: Event;
  onDismiss: () => void;
};

export function EventDetails({ event, onDismiss }: EventDetailsProps) {
  return (
    <View style={styles.card}>
      <View style={styles.handle} />
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.company}>{event.company}</Text>
          <Text style={styles.title}>{event.title}</Text>
        </View>
        <Pressable
          accessibilityLabel="Close event details"
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
      <View style={styles.detailGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>WHEN</Text>
          <Text style={styles.detailValue}>{formatDate(event.startTime)}</Text>
          <Text style={styles.detailSubvalue}>{formatTimeRange(event.startTime, event.endTime)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>WHERE</Text>
          <Text style={styles.detailValue} numberOfLines={2}>{event.locationName}</Text>
        </View>
      </View>
      <Text style={styles.description}>{event.description}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.source}>{event.source} · {event.isVirtual ? 'Virtual' : 'In person'}</Text>
        {event.sourceUrl ? (
          <Pressable onPress={() => Linking.openURL(event.sourceUrl as string)}>
            <Text style={styles.link}>Register ↗</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E7E2',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 8,
    marginHorizontal: 16,
    padding: 18,
    shadowColor: '#193A2B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D3DDD6',
    borderRadius: 3,
    height: 4,
    marginBottom: 14,
    width: 36,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  headerCopy: {
    flex: 1,
  },
  company: {
    color: '#2D6A4F',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    color: '#18352A',
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 4,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#F0F4F1',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginLeft: 10,
    width: 32,
  },
  closeText: {
    color: '#53665B',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 25,
  },
  detailGrid: {
    borderBottomColor: '#EDF1EE',
    borderBottomWidth: 1,
    borderTopColor: '#EDF1EE',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingVertical: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: '#91A098',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  detailValue: {
    color: '#2B4236',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  detailSubvalue: {
    color: '#718078',
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    color: '#53665B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  source: {
    color: '#91A098',
    fontSize: 11,
    fontWeight: '700',
  },
  link: {
    color: '#D65E45',
    fontSize: 13,
    fontWeight: '800',
  },
});
