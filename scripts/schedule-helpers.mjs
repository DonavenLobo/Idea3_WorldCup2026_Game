// scripts/schedule-helpers.mjs
// Pure helpers for building the static schedule config. No I/O here.

const round5 = (value) => Math.round(value * 1e5) / 1e5;

export function parseKickoffUtc(date, time) {
  const [clock, tz] = String(time).trim().split(/\s+/);
  if (!clock || !tz) throw new Error(`Bad time string: "${time}"`);
  const offset = tz.match(/^UTC([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!offset) throw new Error(`Bad UTC offset: "${tz}"`);
  const [hh, mm] = clock.split(":");
  if (hh === undefined || mm === undefined) throw new Error(`Bad clock: "${clock}"`);
  const sign = offset[1];
  const offHours = offset[2].padStart(2, "0");
  const offMins = (offset[3] ?? "00").padStart(2, "0");
  const iso = `${date}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00${sign}${offHours}:${offMins}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Bad datetime: "${iso}"`);
  return parsed.toISOString();
}

export function stageForRound(round) {
  if (String(round).startsWith("Matchday")) return "group";
  switch (round) {
    case "Round of 32": return "r32";
    case "Round of 16": return "r16";
    case "Quarter-final": return "qf";
    case "Semi-final": return "sf";
    case "Match for third place": return "third";
    case "Final": return "final";
    default: throw new Error(`Unknown round: "${round}"`);
  }
}

export function isPlaceholderTeam(name) {
  return /\//.test(name) || /^\d/.test(name) || /^[WL]\d/.test(name);
}

export function assignMatchNumbers(matches) {
  const sortKey = (m) => `${m.kickoffUtc}|${m.ground}|${m.team1}|${m.team2}`;
  const groupMatches = matches.filter((m) => m.num === undefined || m.num === null);
  const ordered = [...groupMatches].sort((a, b) =>
    sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0
  );
  const numByMatch = new Map();
  ordered.forEach((m, index) => numByMatch.set(m, index + 1));
  return matches.map((m) => ({ ...m, num: m.num ?? numByMatch.get(m) }));
}

export function parseCoords(input) {
  const component = /(\d+(?:\.\d+)?)°(?:\s*(\d+(?:\.\d+)?)['′])?(?:\s*(\d+(?:\.\d+)?)["″])?\s*([NSEW])/g;
  const parts = [];
  let match;
  while ((match = component.exec(input)) !== null) {
    const deg = parseFloat(match[1]);
    const min = match[2] ? parseFloat(match[2]) : 0;
    const sec = match[3] ? parseFloat(match[3]) : 0;
    let value = deg + min / 60 + sec / 3600;
    if (match[4] === "S" || match[4] === "W") value = -value;
    parts.push({ dir: match[4], value });
  }
  const lat = parts.find((p) => p.dir === "N" || p.dir === "S");
  const lng = parts.find((p) => p.dir === "E" || p.dir === "W");
  if (!lat || !lng) throw new Error(`Bad coords: "${input}"`);
  return { lat: round5(lat.value), lng: round5(lng.value) };
}
