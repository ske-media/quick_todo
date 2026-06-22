/** Format a number of seconds as mm:ss (or h:mm:ss past one hour). */
export function formatDuration(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "-" : "";
  const s = Math.abs(Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${sign}${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${sign}${pad(minutes)}:${pad(seconds)}`;
}

/** Short human duration, e.g. "1h 05m", "12m 30s", "45s". */
export function formatHuman(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  return `${seconds}s`;
}

/** Format a timestamp into a readable French date+time. */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a timestamp into a short French date. */
export function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
