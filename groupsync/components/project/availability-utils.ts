import { AvailabilitySlot } from '@/types';

export const DAYS = [
  { day: 1, short: 'Mon', label: 'Monday' },
  { day: 2, short: 'Tue', label: 'Tuesday' },
  { day: 3, short: 'Wed', label: 'Wednesday' },
  { day: 4, short: 'Thu', label: 'Thursday' },
  { day: 5, short: 'Fri', label: 'Friday' },
  { day: 6, short: 'Sat', label: 'Saturday' },
  { day: 0, short: 'Sun', label: 'Sunday' },
] as const;

export const START_HOUR = 8;
export const SLOT_COUNT = 28;

export const TIME_SLOTS = Array.from({ length: SLOT_COUNT }, (_, index) => {
  const totalMinutes = START_HOUR * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

export function formatTimeLabel(time: string) {
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

export function getCellKey(day: number, timeIndex: number) {
  return `${day}-${timeIndex}`;
}

export function splitCellKey(key: string) {
  const [day, index] = key.split('-').map(Number);
  return { day, index };
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getTimeIndex(time: string) {
  const minutes = timeToMinutes(time);
  const startMinutes = START_HOUR * 60;
  return Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor((minutes - startMinutes) / 30)));
}

export function expandSlotsToCellSet(slots: AvailabilitySlot[]) {
  const selected = new Set<string>();

  for (const slot of slots) {
    const startIndex = getTimeIndex(slot.start);
    const endIndex = Math.min(SLOT_COUNT, getTimeIndex(slot.end) + (slot.end.endsWith(':30') ? 1 : 0));

    for (let idx = startIndex; idx < endIndex; idx += 1) {
      selected.add(getCellKey(slot.day, idx));
    }
  }

  return selected;
}

export function collapseCellSetToSlots(selected: Set<string>) {
  const slots: AvailabilitySlot[] = [];

  for (const dayItem of DAYS) {
    const indices = Array.from(selected)
      .map(splitCellKey)
      .filter((item) => item.day === dayItem.day)
      .map((item) => item.index)
      .sort((a, b) => a - b);

    let start: number | null = null;
    let prev: number | null = null;

    for (const index of indices) {
      if (start === null) {
        start = index;
        prev = index;
        continue;
      }

      if (prev !== null && index === prev + 1) {
        prev = index;
        continue;
      }

      if (prev !== null) {
        slots.push({
          day: dayItem.day,
          start: TIME_SLOTS[start],
          end: TIME_SLOTS[Math.min(prev + 1, TIME_SLOTS.length - 1)] ?? '22:00',
        });
      }

      start = index;
      prev = index;
    }

    if (start !== null && prev !== null) {
      const endIndex = Math.min(prev + 1, TIME_SLOTS.length);
      slots.push({
        day: dayItem.day,
        start: TIME_SLOTS[start],
        end: endIndex < TIME_SLOTS.length ? TIME_SLOTS[endIndex] : '22:00',
      });
    }
  }

  return slots;
}

export function isMemberAvailableAt(slots: AvailabilitySlot[], day: number, timeIndex: number) {
  const targetMinutes = START_HOUR * 60 + timeIndex * 30;
  return slots.some((slot) => {
    if (slot.day !== day) return false;
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);
    return targetMinutes >= start && targetMinutes < end;
  });
}
