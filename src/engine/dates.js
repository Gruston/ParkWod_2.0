// ═══════════════════════════════════════════════════════════════
// LOCAL CALENDAR DATES — a log date is a DEVICE-local calendar day
// ═══════════════════════════════════════════════════════════════
// A workout log carries a bare "YYYY-MM-DD" calendar day, not an instant.
// Two JavaScript defaults quietly disagree with that, and both shifted
// history by a day:
//
//   new Date().toISOString().slice(0,10) — the UTC date. East of Greenwich
//     (AEST/AEDT is UTC+10/+11) anything logged before 10am local carries
//     YESTERDAY's date. That is why morning sessions were filed on the day
//     before and afternoon ones looked correct.
//
//   new Date("2026-09-15") — parsed as UTC MIDNIGHT, so comparing it against
//     a local-midnight boundary (a week start, a streak step) is off by the
//     UTC offset and can flip a session into the neighbouring day.
//
// Everything here follows the device clock, so the dates track wherever the
// phone actually is rather than a fixed offset.

// A stored log date as a Date at LOCAL midnight. Date objects, epoch
// timestamps and full ISO instants pass straight through to the platform
// parser — only the bare calendar-day form needs the correction.
export function toLocalDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(value);
}

// The local calendar day of `value` as "YYYY-MM-DD". Defaults to right now.
// Returns "" for an unparseable value rather than "NaN-NaN-NaN".
export function localDateKey(value = new Date()) {
  const d = toLocalDate(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// The calendar day `deltaDays` away from `value`, as "YYYY-MM-DD". Steps the
// date field from local noon rather than adding 24h, so a DST change (which
// makes one local day 23 or 25 hours long) can never skip or repeat a day
// while walking a streak backwards.
export function localDateKeyOffset(value, deltaDays) {
  const d = new Date(toLocalDate(value).getTime());
  if (Number.isNaN(d.getTime())) return "";
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + deltaDays);
  return localDateKey(d);
}

// Whole calendar days from `from` to `to`, counting date boundaries rather
// than 24h blocks — so a session logged last night reads as 1 day ago at 7am
// this morning, not 0. Both ends are taken at noon to stay DST-proof.
export function daysBetweenLocal(from, to) {
  const a = toLocalDate(from), b = toLocalDate(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const noon = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  return Math.round((noon(b) - noon(a)) / 86400000);
}
