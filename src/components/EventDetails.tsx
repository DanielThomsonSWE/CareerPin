import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { RouteSummary, TravelMode } from '../services/routingService';
import { Event, hasValidCoordinates } from '../types/event';
import { formatDate, formatTimeRange } from '../utils/date';
import { useAppTheme } from '../utils/theme';

const TAG_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  Food: { backgroundColor: '#FFF0D6', color: '#A65D00' },
  'QR Code': { backgroundColor: '#E9E1FF', color: '#6546A6' },
  Recruiter: { backgroundColor: '#DCEEFF', color: '#1E5C96' },
  Swag: { backgroundColor: '#FFE1EC', color: '#A33865' },
  default: { backgroundColor: '#E7F1EA', color: '#2D6A4F' },
};

type EventDetailsProps = {
  event: Event;
  onDismiss: () => void;
  onGetEta: (travelMode: TravelMode) => void;
  onToggleNavigation: () => void;
  navigationActive: boolean;
  route: RouteSummary | null;
  routeError: string | null;
  routeLoading: boolean;
};

export function EventDetails({ event, onDismiss, onGetEta, onToggleNavigation, navigationActive, route, routeError, routeLoading }: EventDetailsProps) {
  const { colors } = useAppTheme();
  const [travelMode, setTravelMode] = useState<TravelMode>('WALK');
  const canRoute = hasValidCoordinates(event);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={[styles.company, { color: colors.accent }]}>{event.company}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
          {event.tags?.length ? (
            <View style={styles.tagRow}>
              {event.tags.map((tag) => {
                const colors = TAG_COLORS[tag] ?? TAG_COLORS.default;
                return (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.backgroundColor }]}>
                    <Text style={[styles.tagText, { color: colors.color }]}>{tag}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="Close event details"
          accessibilityRole="button"
          onPress={onDismiss}
          style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={[styles.closeText, { color: colors.textSecondary }]}>×</Text>
        </Pressable>
      </View>
      <View style={[styles.detailGrid, { borderBottomColor: colors.divider, borderTopColor: colors.divider }]}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>WHEN</Text>
          <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{formatDate(event.startTime)}</Text>
          <Text style={[styles.detailSubvalue, { color: colors.textMuted }]}>{formatTimeRange(event.startTime, event.endTime)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>WHERE</Text>
          <Text style={[styles.detailValue, { color: colors.textSecondary }]} numberOfLines={2}>{event.locationName}</Text>
        </View>
      </View>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{event.description}</Text>
      {canRoute ? (
        <View style={[styles.routeSection, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>GET ETA FROM YOUR LOCATION</Text>
          <View style={styles.modeRow}>
            {(['WALK', 'DRIVE', 'TRANSIT'] as TravelMode[]).map((mode) => (
              <Pressable key={mode} onPress={() => setTravelMode(mode)} style={[styles.modeButton, { borderColor: colors.border }, travelMode === mode && { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
                <Text style={[styles.modeText, { color: colors.textMuted }, travelMode === mode && { color: colors.accent }]}>
                  {mode === 'WALK' ? 'Walk' : mode === 'DRIVE' ? 'Drive' : 'Transit'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable disabled={routeLoading} onPress={() => onGetEta(travelMode)} style={styles.etaButton}>
            {routeLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.etaButtonText}>Show route & ETA</Text>}
          </Pressable>
          {route ? (
            <>
          <Text style={[styles.routeResult, { color: colors.accent }]}>{route.durationLabel} · {route.distanceLabel}</Text>
              <Pressable onPress={onToggleNavigation} style={styles.goButton}>
                <Text style={styles.goButtonText}>{navigationActive ? 'Stop following route' : 'Go'}</Text>
              </Pressable>
            </>
          ) : null}
          {routeError ? <Text style={styles.routeError}>{routeError}</Text> : null}
        </View>
      ) : null}
      <View style={styles.footerRow}>
        <Text style={[styles.source, { color: colors.textMuted }]}>{event.source} · {event.isVirtual ? 'Virtual' : 'In person'}</Text>
        {event.sourceUrl ? (
          <Pressable onPress={() => Linking.openURL(event.sourceUrl as string)}>
            <Text style={[styles.link, { color: colors.accent }]}>Register ↗</Text>
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
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { fontSize: 11, fontWeight: '800' },
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
  routeSection: {
    backgroundColor: '#F5F8F6',
    borderRadius: 14,
    marginTop: 16,
    padding: 12,
  },
  modeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  modeButton: { borderColor: '#DCE7DF', borderRadius: 10, borderWidth: 1, flex: 1, paddingVertical: 8 },
  modeButtonActive: { backgroundColor: '#E2F0E6', borderColor: '#BFD8C6' },
  modeText: { color: '#6E8176', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  modeTextActive: { color: '#2D6A4F' },
  etaButton: { alignItems: 'center', backgroundColor: '#2D6A4F', borderRadius: 10, marginTop: 8, minHeight: 38, justifyContent: 'center' },
  etaButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  routeResult: { color: '#2D6A4F', fontSize: 13, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  routeError: { color: '#B44C38', fontSize: 11, lineHeight: 16, marginTop: 8 },
  goButton: { alignItems: 'center', backgroundColor: '#E76F51', borderRadius: 10, marginTop: 8, minHeight: 36, justifyContent: 'center' },
  goButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
