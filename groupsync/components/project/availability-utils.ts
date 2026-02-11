/**
 * Availability utilities for managing time slots
 */

export interface TimeSlot {
  day: number; // 0-6 (Sunday-Saturday)
  startHour: number; // 0-23.5 (supports half hours: 9, 9.5, 10, 10.5, etc.)
  endHour: number; // 0-24 (supports half hours)
}

export interface UserAvailability {
  userId: string;
  userName: string;
  slots: TimeSlot[];
}

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i * 0.5); // 0, 0.5, 1, 1.5, ... 23.5

/**
 * Convert time slots to JSON string for storage
 */
export function slotsToJson(slots: TimeSlot[]): string {
  return JSON.stringify(slots);
}

/**
 * Parse time slots from JSON string
 */
export function jsonToSlots(json: string): TimeSlot[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Format hour as 12-hour time string (e.g., "9:00 AM", "9:30 AM", "2:00 PM")
 */
export function formatHour(hour: number): string {
  const wholeHour = Math.floor(hour);
  const minutes = (hour % 1) * 60;
  const minuteStr = minutes === 0 ? '00' : minutes.toString();

  if (wholeHour === 0) return `12:${minuteStr} AM`;
  if (wholeHour < 12) return `${wholeHour}:${minuteStr} AM`;
  if (wholeHour === 12) return `12:${minuteStr} PM`;
  return `${wholeHour - 12}:${minuteStr} PM`;
}

/**
 * Format a time slot as a readable string
 */
export function formatTimeSlot(slot: TimeSlot): string {
  const day = DAYS_OF_WEEK[slot.day];
  const start = formatHour(slot.startHour);
  const end = formatHour(slot.endHour);
  return `${day} ${start} - ${end}`;
}

/**
 * Check if two time slots overlap
 */
export function slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false;
  return !(slot1.endHour <= slot2.startHour || slot2.endHour <= slot1.startHour);
}

/**
 * Merge overlapping time slots for the same day
 */
export function mergeSlots(slots: TimeSlot[]): TimeSlot[] {
  if (slots.length === 0) return [];

  // Group by day
  const byDay = new Map<number, TimeSlot[]>();
  for (const slot of slots) {
    if (!byDay.has(slot.day)) {
      byDay.set(slot.day, []);
    }
    byDay.get(slot.day)!.push(slot);
  }

  const merged: TimeSlot[] = [];

  // Merge each day's slots
  for (const [day, daySlots] of byDay) {
    // Sort by start hour
    daySlots.sort((a, b) => a.startHour - b.startHour);

    let current = daySlots[0];
    for (let i = 1; i < daySlots.length; i++) {
      const next = daySlots[i];
      if (current.endHour >= next.startHour) {
        // Overlapping or adjacent, merge
        current = {
          day,
          startHour: current.startHour,
          endHour: Math.max(current.endHour, next.endHour),
        };
      } else {
        // No overlap, push current and move to next
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
  }

  return merged;
}

/**
 * Find overlapping availability across multiple users
 */
export function findCommonAvailability(availabilities: UserAvailability[]): TimeSlot[] {
  if (availabilities.length === 0) return [];
  if (availabilities.length === 1) return availabilities[0].slots;

  // Start with the first user's slots
  let common = availabilities[0].slots;

  // Intersect with each subsequent user
  for (let i = 1; i < availabilities.length; i++) {
    common = intersectSlots(common, availabilities[i].slots);
  }

  return mergeSlots(common);
}

/**
 * Find intersection of two slot arrays
 */
function intersectSlots(slots1: TimeSlot[], slots2: TimeSlot[]): TimeSlot[] {
  const result: TimeSlot[] = [];

  for (const slot1 of slots1) {
    for (const slot2 of slots2) {
      if (slot1.day !== slot2.day) continue;

      const startHour = Math.max(slot1.startHour, slot2.startHour);
      const endHour = Math.min(slot1.endHour, slot2.endHour);

      if (startHour < endHour) {
        result.push({ day: slot1.day, startHour, endHour });
      }
    }
  }

  return result;
}

/**
 * Get suggested meeting times from common availability
 * Returns slots that are at least minDuration hours long
 */
export function suggestMeetingTimes(
  commonSlots: TimeSlot[],
  minDuration: number = 1
): TimeSlot[] {
  return commonSlots.filter((slot) => slot.endHour - slot.startHour >= minDuration);
}

/**
 * Create a grid representation of availability for a week
 * Returns a 2D array [day][halfHourIndex] where true means available
 * Grid is 7x48 (7 days, 48 half-hour blocks per day)
 */
export function createAvailabilityGrid(slots: TimeSlot[]): boolean[][] {
  const grid: boolean[][] = Array.from({ length: 7 }, () => Array(48).fill(false));

  for (const slot of slots) {
    const startIndex = Math.floor(slot.startHour * 2);
    const endIndex = Math.floor(slot.endHour * 2);

    for (let i = startIndex; i < endIndex; i++) {
      grid[slot.day][i] = true;
    }
  }

  return grid;
}

/**
 * Convert availability grid back to time slots
 */
export function gridToSlots(grid: boolean[][]): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (let day = 0; day < 7; day++) {
    let startIndex: number | null = null;

    for (let i = 0; i < 48; i++) {
      if (grid[day][i] && startIndex === null) {
        // Start of a new slot
        startIndex = i;
      } else if (!grid[day][i] && startIndex !== null) {
        // End of current slot
        const startHour = startIndex / 2;
        const endHour = i / 2;
        slots.push({ day, startHour, endHour });
        startIndex = null;
      }
    }

    // Handle slot that extends to end of day
    if (startIndex !== null) {
      const startHour = startIndex / 2;
      slots.push({ day, startHour, endHour: 24 });
    }
  }

  return slots;
}
