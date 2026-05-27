import type { RegisteredEvent } from '@/lib/attendance';

export function hasEventDateParts(event: Pick<RegisteredEvent, 'month' | 'day' | 'year'>) {
  return Boolean(event.month?.trim() && event.day?.trim());
}

export function getEventTimeLabel(dateTime?: string) {
  const parts = dateTime?.split(',') || [];
  return parts.at(-1)?.trim() || '';
}

export function getEventBanner(event: RegisteredEvent) {
  return (event as RegisteredEvent & { bannerDataUrl?: string }).bannerDataUrl || '';
}
