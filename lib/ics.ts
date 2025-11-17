export function generateICSForBooking(params: {
  id: string
  title: string
  description?: string
  startISO: string
  durationMinutes: number
  location?: string
}): string {
  const { id, title, description, startISO, durationMinutes, location } = params
  const dtStart = formatToICSDate(startISO)
  const dtEnd = formatToICSDate(new Date(new Date(startISO).getTime() + durationMinutes * 60000).toISOString())
  const uid = `${id}@tsmartcleaning`
  const now = formatToICSDate(new Date().toISOString())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tSmartCleaning//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : undefined,
    location ? `LOCATION:${escapeICS(location)}` : undefined,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return lines.join('\r\n')
}

function formatToICSDate(iso: string): string {
  // Expecting UTC or local; normalize to UTC without separators: YYYYMMDDTHHMMSSZ
  const d = new Date(iso)
  const YYYY = d.getUTCFullYear()
  const MM = String(d.getUTCMonth() + 1).padStart(2, '0')
  const DD = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${YYYY}${MM}${DD}T${hh}${mm}${ss}Z`
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}


