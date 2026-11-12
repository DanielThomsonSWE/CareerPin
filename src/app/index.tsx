import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import CampusMap from '../components/CampusMap';
import { EventCard } from '../components/EventCard';
import { EventDetails } from '../components/EventDetails';
import { getEvents } from '../services/eventService';
import { Event, hasValidCoordinates } from '../types/event';
import { isUpcoming } from '../utils/date';

type ViewMode = 'map' | 'list';

export default function HomeScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchText, setSearchText] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getEvents()
      .then((loadedEvents) => {
        if (isMounted) {
          setEvents(loadedEvents);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError('We could not load campus events. Try again.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleEvents = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return events
      .filter((event) => !upcomingOnly || isUpcoming(event.startTime))
      .filter((event) => !query || event.company.toLowerCase().includes(query))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, searchText, upcomingOnly]);

  const mappableEvents = useMemo(
    () => visibleEvents.filter(hasValidCoordinates),
    [visibleEvents],
  );

  const focusEvent = useCallback((event: Event) => {
    setSelectedEvent(event);
    setViewMode('map');
    Keyboard.dismiss();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerState}>
        <ActivityIndicator color="#2D6A4F" size="large" />
        <Text style={styles.stateTitle}>Loading campus events</Text>
        <Text style={styles.stateBody}>Getting the latest recruiting opportunities ready.</Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.centerState}>
        <Text style={styles.stateIcon}>!</Text>
        <Text style={styles.stateTitle}>Something went wrong</Text>
        <Text style={styles.stateBody}>{loadError}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>GEORGIA TECH</Text>
          <Text style={styles.heading}>Find your next opportunity</Text>
        </View>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>CP</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Search by company"
            autoCapitalize="none"
            onChangeText={setSearchText}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Search by company"
            placeholderTextColor="#9BA9A1"
            returnKeyType="search"
            style={styles.searchInput}
            value={searchText}
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText('')}>
              <Text style={styles.clearSearch}>×</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: upcomingOnly }}
          onPress={() => setUpcomingOnly((current) => !current)}
          style={[styles.filterButton, upcomingOnly && styles.filterButtonActive]}
        >
          <Text style={[styles.filterText, upcomingOnly && styles.filterTextActive]}>Upcoming</Text>
        </Pressable>
      </View>

      <View style={styles.viewToggle}>
        <Pressable onPress={() => setViewMode('map')} style={[styles.toggleOption, viewMode === 'map' && styles.toggleOptionActive]}>
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map</Text>
        </Pressable>
        <Pressable onPress={() => setViewMode('list')} style={[styles.toggleOption, viewMode === 'list' && styles.toggleOptionActive]}>
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Events <Text style={styles.countText}>{visibleEvents.length}</Text></Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {viewMode === 'map' ? (
          <View style={styles.mapContainer}>
            <CampusMap events={mappableEvents} onSelect={focusEvent} selectedEvent={selectedEvent} />
            <View style={styles.mapBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.mapBadgeText}>{mappableEvents.length} campus {mappableEvents.length === 1 ? 'pin' : 'pins'}</Text>
            </View>
            {visibleEvents.length === 0 ? (
              <EmptyState compact searchText={searchText} />
            ) : selectedEvent ? (
              <View style={styles.detailsOverlay}>
                <EventDetails event={selectedEvent} onDismiss={() => setSelectedEvent(null)} />
              </View>
            ) : (
              <View style={styles.mapHint}>
                <Text style={styles.mapHintText}>Tap a pin to explore an event</Text>
              </View>
            )}
          </View>
        ) : (
          <FlatList
            contentContainerStyle={visibleEvents.length === 0 ? styles.emptyList : styles.listContent}
            data={visibleEvents}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(event) => event.id}
            ListEmptyComponent={<EmptyState searchText={searchText} />}
            renderItem={({ item }) => <EventCard event={item} onPress={focusEvent} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function EmptyState({ compact = false, searchText }: { compact?: boolean; searchText: string }) {
  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
      <Text style={styles.emptyIcon}>⌖</Text>
      <Text style={styles.emptyTitle}>No events found</Text>
      <Text style={styles.emptyBody}>
        {searchText ? 'Try another company name or clear your search.' : 'Try turning off the upcoming filter to see more events.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F7FAF8',
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  eyebrow: {
    color: '#759087',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heading: {
    color: '#18352A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 3,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: '#2D6A4F',
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E9E3',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 14,
  },
  searchIcon: {
    color: '#557166',
    fontSize: 26,
    marginRight: 8,
    marginTop: -3,
  },
  searchInput: {
    color: '#18352A',
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearSearch: {
    color: '#809188',
    fontSize: 22,
    paddingLeft: 8,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E9E3',
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  filterButtonActive: {
    backgroundColor: '#E6F2EA',
    borderColor: '#C7DFCE',
  },
  filterText: {
    color: '#53665B',
    fontSize: 12,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#2D6A4F',
  },
  viewToggle: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9EFEB',
    borderRadius: 12,
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 3,
  },
  toggleOption: {
    borderRadius: 9,
    minWidth: 86,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#18352A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  toggleText: {
    color: '#819188',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  toggleTextActive: {
    color: '#2D6A4F',
  },
  countText: {
    color: '#94A39A',
    fontSize: 11,
  },
  content: {
    flex: 1,
    marginTop: 14,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 18,
    flexDirection: 'row',
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    top: 16,
  },
  liveDot: {
    backgroundColor: '#E76F51',
    borderRadius: 4,
    height: 8,
    marginRight: 7,
    width: 8,
  },
  mapBadgeText: {
    color: '#3E5549',
    fontSize: 12,
    fontWeight: '800',
  },
  mapHint: {
    alignSelf: 'center',
    backgroundColor: 'rgba(24, 53, 42, 0.9)',
    borderRadius: 18,
    bottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'absolute',
  },
  mapHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsOverlay: {
    bottom: 12,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  centerState: {
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  stateIcon: {
    alignItems: 'center',
    backgroundColor: '#FCEDE8',
    borderRadius: 24,
    color: '#D65E45',
    fontSize: 22,
    fontWeight: '800',
    height: 48,
    lineHeight: 48,
    marginBottom: 16,
    textAlign: 'center',
    width: 48,
  },
  stateTitle: {
    color: '#18352A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  stateBody: {
    color: '#75847B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 72,
  },
  emptyStateCompact: {
    backgroundColor: 'rgba(247, 250, 248, 0.95)',
    borderRadius: 22,
    bottom: 24,
    left: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    position: 'absolute',
    right: 24,
  },
  emptyIcon: {
    color: '#A7B7AD',
    fontSize: 34,
  },
  emptyTitle: {
    color: '#2B4236',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyBody: {
    color: '#809188',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
});
