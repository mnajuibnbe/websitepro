function hoursAndMinutes(totalSeconds: number) {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.ceil((totalSeconds % 3600) / 60),
  };
}

/** "3 hr 45 min video", used on the course sales page hero. */
export function formatCourseVideoLength(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Self-paced learning';
  const { hours, minutes } = hoursAndMinutes(totalSeconds);
  return `${hours > 0 ? `${hours} hr ` : ''}${minutes} min video`;
}

/** "9.5 total hours" (or "45 total minutes" under an hour), used on catalog cards. */
export function formatCourseTotalHours(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Self-paced';
  const totalHours = totalSeconds / 3600;
  if (totalHours < 1) {
    const minutes = Math.max(1, Math.round(totalSeconds / 60));
    return `${minutes} total minutes`;
  }
  const rounded = Math.round(totalHours * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${display} total hours`;
}
