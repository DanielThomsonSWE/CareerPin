import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import CampusMap from '../components/CampusMap';
import { EventCard } from '../components/EventCard';
import { EventDetails } from '../components/EventDetails';
import { getEvents } from '../services/eventService';
import { getRoute, RouteSummary, TravelMode } from '../services/routingService';
import { Event, hasValidCoordinates } from '../types/event';
import { isUpcoming } from '../utils/date';
import { useAppTheme, type ThemeColors } from '../utils/theme';

type ViewMode = 'map' | 'list';
type FilterKind = 'industry' | 'major';

export default function HomeScreen() {
  const { colors, mode, toggle } = useAppTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [navigationActive, setNavigationActive] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [openFilter, setOpenFilter] = useState<FilterKind | null>(null);

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
      .filter((event) => isUpcoming(event.startTime))
      .filter((event) => !query || event.company.toLowerCase().includes(query))
      .filter((event) => !selectedIndustry || event.industries?.includes(selectedIndustry))
      .filter((event) => !selectedMajor || event.majors?.includes(selectedMajor))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, searchText, selectedIndustry, selectedMajor]);

  const industryOptions = useMemo(
    () => [...new Set(events.flatMap((event) => event.industries ?? []))].sort(),
    [events],
  );
  const majorOptions = useMemo(
    () => [...new Set(events.flatMap((event) => event.majors ?? []))].sort(),
    [events],
  );

  const mappableEvents = useMemo(
    () => visibleEvents.filter(hasValidCoordinates),
    [visibleEvents],
  );

  const focusEvent = useCallback((event: Event) => {
    setSelectedEvent(event);
    setRoute(null);
    setRouteError(null);
    setNavigationActive(false);
    setViewMode('map');
    Keyboard.dismiss();
  }, []);

  const calculateEta = useCallback(async (travelMode: TravelMode) => {
    if (!selectedEvent || !hasValidCoordinates(selectedEvent)) return;

    setRouteLoading(true);
    setRouteError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Location permission is needed to calculate ETA.');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const currentLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setUserLocation(currentLocation);
      setShowUserLocation(true);
      setRoute(await getRoute(
        currentLocation,
        { latitude: selectedEvent.latitude, longitude: selectedEvent.longitude },
        travelMode,
      ));
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : 'Unable to calculate ETA.');
    } finally {
      setRouteLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (!navigationActive) return;
    let subscription: Location.LocationSubscription | null = null;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
      (position) => setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
    ).then((nextSubscription) => { subscription = nextSubscription; }).catch(() => undefined);
    return () => subscription?.remove();
  }, [navigationActive]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerState, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={[styles.stateTitle, { color: colors.text }]}>Loading campus events</Text>
        <Text style={[styles.stateBody, { color: colors.textMuted }]}>Getting the latest recruiting opportunities ready.</Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[styles.centerState, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateIcon, { backgroundColor: colors.dangerSoft, color: mode === 'light' ? '#D65E45' : '#FF9E88' }]}>!</Text>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Something went wrong</Text>
        <Text style={[styles.stateBody, { color: colors.textMuted }]}>{loadError}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}> 
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>GEORGIA TECH</Text>
        </View>
        <View style={[styles.logoMark, { backgroundColor: colors.accent }]}> 
          <Text style={styles.logoText}>CP</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>⌕</Text>
          <TextInput
            accessibilityLabel="Search by company"
            autoCapitalize="none"
            onChangeText={setSearchText}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Search by company"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.text }]}
            value={searchText}
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText('')}>
              <Text style={[styles.clearSearch, { color: colors.textMuted }]}>×</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
          accessibilityRole="button"
          onPress={toggle}
          style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.filterText, { color: colors.textSecondary }]}>{mode === 'dark' ? '☀ Light' : '☾ Dark'}</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {(['industry', 'major'] as FilterKind[]).map((kind) => {
          const value = kind === 'industry' ? selectedIndustry : selectedMajor;
          const label = kind === 'industry' ? 'Industry' : 'Major';
          return (
            <Pressable
              key={kind}
              onPress={() => setOpenFilter((current) => current === kind ? null : kind)}
              style={[styles.filterChip, { borderColor: colors.border }, value && { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
            >
              <Text style={[styles.filterChipText, { color: colors.textSecondary }, value && { color: colors.accent }]}>
                {value || `Filter by ${label}`}
              </Text>
              <Text style={[styles.filterChevron, { color: colors.textMuted }]}>{openFilter === kind ? '⌃' : '⌄'}</Text>
            </Pressable>
          );
        })}
      </View>
      {openFilter ? (
        <View style={[styles.filterMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView nestedScrollEnabled>
            <Pressable
              onPress={() => {
                if (openFilter === 'industry') setSelectedIndustry('');
                else setSelectedMajor('');
                setOpenFilter(null);
              }}
              style={[styles.filterOption, { borderBottomColor: colors.divider }]}
            >
              <Text style={[styles.filterOptionText, { color: colors.text }]}>All {openFilter === 'industry' ? 'industries' : 'majors'}</Text>
            </Pressable>
            {(openFilter === 'industry' ? industryOptions : majorOptions).map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  if (openFilter === 'industry') setSelectedIndustry(option);
                  else setSelectedMajor(option);
                  setOpenFilter(null);
                }}
                style={[styles.filterOption, { borderBottomColor: colors.divider }]}
              >
                <Text style={[styles.filterOptionText, { color: colors.text }]}>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={[styles.viewToggle, { backgroundColor: colors.surfaceMuted }]}>
        <Pressable onPress={() => setViewMode('map')} style={[styles.toggleOption, viewMode === 'map' && { backgroundColor: colors.surface }]}>
          <Text style={[styles.toggleText, { color: colors.textMuted }, viewMode === 'map' && { color: colors.accent }]}>Map</Text>
        </Pressable>
        <Pressable onPress={() => setViewMode('list')} style={[styles.toggleOption, viewMode === 'list' && { backgroundColor: colors.surface }]}>
          <Text style={[styles.toggleText, { color: colors.textMuted }, viewMode === 'list' && { color: colors.accent }]}>Events <Text style={[styles.countText, { color: colors.textMuted }]}>{visibleEvents.length}</Text></Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {viewMode === 'map' ? (
          <View style={styles.mapContainer}>
            <CampusMap
              events={mappableEvents}
              onSelect={focusEvent}
              routeCoordinates={route?.coordinates}
              selectedEvent={selectedEvent}
              showUserLocation={showUserLocation}
              userLocation={userLocation}
              followUser={navigationActive}
              onStopNavigation={() => setNavigationActive(false)}
            />
            <View style={[styles.mapBadge, { backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(24, 36, 31, 0.94)' }]}>
              <View style={styles.liveDot} />
              <Text style={[styles.mapBadgeText, { color: colors.textSecondary }]}>{mappableEvents.length} campus {mappableEvents.length === 1 ? 'pin' : 'pins'}</Text>
            </View>
            {visibleEvents.length === 0 ? (
              <EmptyState colors={colors} compact searchText={searchText} />
            ) : selectedEvent && !navigationActive ? (
              <View style={styles.detailsOverlay}>
                <EventDetails
                  event={selectedEvent}
                  onDismiss={() => setSelectedEvent(null)}
                  onGetEta={calculateEta}
                  onToggleNavigation={() => setNavigationActive((active) => !active)}
                  navigationActive={navigationActive}
                  route={route}
                  routeError={routeError}
                  routeLoading={routeLoading}
                />
              </View>
            ) : (
              <View style={[styles.mapHint, { backgroundColor: mode === 'light' ? 'rgba(24, 53, 42, 0.9)' : 'rgba(10, 20, 15, 0.92)' }]}>
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
            ListEmptyComponent={<EmptyState colors={colors} searchText={searchText} />}
            renderItem={({ item }) => <EventCard event={item} onPress={focusEvent} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function EmptyState({ colors, compact = false, searchText }: { colors: ThemeColors; compact?: boolean; searchText: string }) {
  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact, compact && { backgroundColor: colors.background }]}>
      <Text style={[styles.emptyIcon, { color: colors.textMuted }]}>⌖</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No events found</Text>
      <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
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
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 10 },
  filterChip: { alignItems: 'center', borderColor: '#E1E9E3', borderRadius: 12, borderWidth: 1, flex: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 40, paddingHorizontal: 11 },
  filterChipActive: { backgroundColor: '#E8F2EB', borderColor: '#BFD8C6' },
  filterChipText: { color: '#53665B', flex: 1, fontSize: 11, fontWeight: '700' },
  filterChipTextActive: { color: '#2D6A4F' },
  filterChevron: { color: '#759087', fontSize: 15, fontWeight: '800', marginLeft: 6 },
  filterMenu: { backgroundColor: '#FFFFFF', borderColor: '#E1E9E3', borderRadius: 14, borderWidth: 1, elevation: 5, marginHorizontal: 20, marginTop: 8, maxHeight: 220, overflow: 'hidden', shadowColor: '#18352A', shadowOpacity: 0.12, shadowRadius: 8 },
  filterOption: { borderBottomColor: '#EEF3EF', borderBottomWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  filterOptionText: { color: '#2B4236', fontSize: 13, fontWeight: '600' },
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
