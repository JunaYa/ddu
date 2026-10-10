/**
 * Format a date by replacing YYYY, MM, DD, HH, mm and ss with their values.
 * Components are not zero-padded ("2026-10-9 7:05" renders as "2026-10-9 7:5"),
 * matching what the history window has always shown.
 */
export function formatTime(time: Date, format: string): string {
  return format
    .replace("YYYY", String(time.getFullYear()))
    .replace("MM", String(time.getMonth() + 1))
    .replace("DD", String(time.getDate()))
    .replace("HH", String(time.getHours()))
    .replace("mm", String(time.getMinutes()))
    .replace("ss", String(time.getSeconds()));
}
