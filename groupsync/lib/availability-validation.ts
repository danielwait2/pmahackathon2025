export interface TimeSlotInput {
  day: number;
  startHour: number;
  endHour: number;
}

export function isValidSlot(slot: unknown): slot is TimeSlotInput {
  if (!slot || typeof slot !== 'object') return false;
  const candidate = slot as Partial<TimeSlotInput>;
  return (
    typeof candidate.day === 'number' &&
    typeof candidate.startHour === 'number' &&
    typeof candidate.endHour === 'number' &&
    candidate.day >= 0 &&
    candidate.day <= 6 &&
    candidate.startHour >= 0 &&
    candidate.startHour <= 23.5 &&
    candidate.endHour > 0 &&
    candidate.endHour <= 24 &&
    candidate.startHour < candidate.endHour
  );
}

export function validateSlots(slots: unknown): { valid: true; slots: TimeSlotInput[] } | { valid: false; error: string } {
  if (!Array.isArray(slots)) {
    return { valid: false, error: 'slots must be an array' };
  }

  for (const slot of slots) {
    if (!isValidSlot(slot)) {
      return {
        valid: false,
        error: 'Invalid slot format. Each slot must have day (0-6), startHour (0-23.5), and endHour (0-24)',
      };
    }
  }

  return { valid: true, slots: slots as TimeSlotInput[] };
}
