import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatTimeRange } from '../utils/date';
import { Event } from '../types/event';
import { useAppTheme } from '../utils/theme';

type EventCardProps = {
  event: Event;
  onPress: (event: Event) => void;
};

export function EventCard({ event, onPress }: EventCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.company}: ${event.title}`}
      onPress={() => onPress(event)}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
    >
      <View style={[styles.dateColumn, { backgroundColor: colors.accentSoft }]}>
        <Text style={[styles.dateMonth, { color: colors.accent }]}>{formatDate(event.startTime).split(' ')[1]}</Text>
        <Text style={[styles.dateDay, { color: colors.text }]}>{formatDate(event.startTime).split(' ')[2]}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.rowBetween}>
          <Text style={[styles.company, { color: colors.accent }]}>{event.company}</Text>
          <Text style={[styles.source, { color: colors.textMuted }]}>{event.source}</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{event.title}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatTimeRange(event.startTime, event.endTime)}</Text>
        <Text style={[styles.location, { color: colors.textMuted }]} numberOfLines={1}>⌖ {event.locationName}</Text>
      </View>
      <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E4EAE6',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 14,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  dateColumn: {
    alignItems: 'center',
    backgroundColor: '#EAF4EE',
    borderRadius: 12,
    justifyContent: 'center',
    marginRight: 12,
    minHeight: 58,
    width: 52,
  },
  dateMonth: {
    color: '#2D6A4F',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateDay: {
    color: '#173B2D',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 25,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  company: {
    color: '#2D6A4F',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  source: {
    color: '#75847B',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: '#18352A',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: 4,
  },
  meta: {
    color: '#53665B',
    fontSize: 12,
    marginTop: 6,
  },
  location: {
    color: '#7B8981',
    fontSize: 12,
    marginTop: 3,
  },
  chevron: {
    color: '#B1BDB5',
    fontSize: 26,
    marginLeft: 8,
  },
});
