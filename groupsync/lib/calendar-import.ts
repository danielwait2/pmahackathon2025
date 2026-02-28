export interface ImportedCalendarEvent {
  uid: string;
  title: string;
  description: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
}

function unfoldIcsLines(icsText: string): string[] {
  const lines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

function parseIcsDate(raw: string): { date: Date | null; allDay: boolean } {
  const trimmed = raw.trim();
  if (/^\d{8}$/.test(trimmed)) {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(4, 6)) - 1;
    const day = Number(trimmed.slice(6, 8));
    return { date: new Date(Date.UTC(year, month, day)), allDay: true };
  }

  const normalized = trimmed.replace(/Z$/, '');
  const m = normalized.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!m) {
    return { date: null, allDay: false };
  }

  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = Number(m[6]);
  const isUtc = trimmed.endsWith('Z');

  const date = isUtc
    ? new Date(Date.UTC(year, month, day, hour, minute, second))
    : new Date(year, month, day, hour, minute, second);

  return { date, allDay: false };
}

function unescapeIcsText(value: string) {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

export function parseIcsFeed(icsText: string): ImportedCalendarEvent[] {
  const lines = unfoldIcsLines(icsText);
  const events: ImportedCalendarEvent[] = [];
  let inEvent = false;
  let current: Record<string, string> = {};

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (inEvent) {
        const uid = (current.UID ?? '').trim();
        const summary = unescapeIcsText((current.SUMMARY ?? '').trim());
        const description = unescapeIcsText((current.DESCRIPTION ?? '').trim());
        const startRaw = current.DTSTART ?? '';
        const endRaw = current.DTEND ?? '';
        const parsedStart = parseIcsDate(startRaw);
        const parsedEnd = parseIcsDate(endRaw);

        if (uid && summary && parsedStart.date) {
          events.push({
            uid,
            title: summary,
            description,
            start: parsedStart.date,
            end: parsedEnd.date,
            allDay: parsedStart.allDay,
          });
        }
      }
      inEvent = false;
      current = {};
      continue;
    }

    if (!inEvent) continue;

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const rawKey = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const key = rawKey.split(';')[0].toUpperCase();

    if (key === 'UID' || key === 'SUMMARY' || key === 'DESCRIPTION' || key === 'DTSTART' || key === 'DTEND') {
      current[key] = value;
    }
  }

  return events;
}
