export function formatMAD(value: number, opts?: { compact?: boolean; sign?: boolean }) {
  const abs = Math.abs(Math.round(value));
  let body: string;
  if (opts?.compact && abs >= 1_000_000) body = `${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(".", ",")} M`;
  else if (opts?.compact && abs >= 10_000) body = `${Math.round(abs / 1000)} k`;
  else body = groupDigits(abs);
  const sign = value < 0 ? "-" : opts?.sign ? "+" : "";
  return `${sign}${body} DH`;
}

export function groupDigits(n: number) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
}

export function formatNumber(n: number, unit?: string) {
  return unit ? `${groupDigits(n)} ${unit}` : groupDigits(n);
}

export function formatPercent(n: number, sign = true) {
  const v = n.toFixed(1).replace(".", ",");
  return `${sign && n > 0 ? "+" : ""}${v} %`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const MONTHS = [
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
];

export function monthLabel(iso: string) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Relative time against the demo "now" (the app's reference date). */
export function relativeTime(iso: string, now: Date) {
  const diff = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} jours`;
  const months = Math.round(days / 30);
  return `il y a ${months} mois`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
