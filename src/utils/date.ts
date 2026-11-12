export function formatDate(isoTime: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoTime));
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const timeFormat = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${timeFormat.format(new Date(startTime))} – ${timeFormat.format(new Date(endTime))}`;
}

export function isUpcoming(isoTime: string): boolean {
  return new Date(isoTime).getTime() >= Date.now();
}
