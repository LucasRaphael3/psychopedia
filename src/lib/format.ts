const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export function formatTime(date: Date) {
  return timeFormatter.format(date);
}

export function relativeTime(date: Date, now = new Date()) {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "1 dia" : `${days} dias`;
  return formatDate(date);
}

export function readingMinutes(text: string) {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
