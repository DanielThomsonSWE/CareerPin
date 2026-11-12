import eventData from '../data/events.json';
import { Event } from '../types/event';

/**
 * Keeps the UI independent from the event provider. Replace this implementation
 * with a Handshake, CareerBuzz, or Supabase query without changing screens.
 */
export async function getEvents(): Promise<Event[]> {
  return eventData.map((event) => ({ ...event })) as Event[];
}
