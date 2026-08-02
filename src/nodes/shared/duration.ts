export function parseDuration(input: number | string): number {
  if (!isNaN(input as number)) {
    const duration = Math.round(Number(input));
    if (duration < 0 || duration > 255) {
      throw new Error(`Incorrect Duration: ${duration}.`);
    }
    return duration;
  }
  const str = String(input);
  const value = parseInt(str, 10);
  const unit = str.replace(/^[\s\d]+/, "").toLowerCase();
  if (["second", "seconds"].includes(unit) && value > 0 && value <= 60) {
    return value;
  }
  if (["minute", "minutes"].includes(unit) && value > 0 && value <= 60) {
    return value + 60;
  }
  if (["hour", "hours"].includes(unit) && value > 0 && value <= 134) {
    return value + 120;
  }
  if (["day", "days"].includes(unit) && value > 0 && value <= 5) {
    return value * 24 + 120;
  }
  if (["forever", "indefinite", "indefinitely"].includes(unit)) {
    return 255;
  }
  if (["off", "disable"].includes(unit)) {
    return 0;
  }
  throw new Error(`Incorrect Duration Format: ${input}`);
}
const SECONDS_PER_UNIT: Record<string, number> = {
  second: 1,
  seconds: 1,
  minute: 60,
  minutes: 60,
  hour: 3600,
  hours: 3600,
  day: 86400,
  days: 86400,
};
export function parseSecondsValue(input: number | string, max: number): number {
  if (!isNaN(input as number)) {
    const value = Math.round(Number(input));
    if (value < 0 || value > max) {
      throw new Error(`Incorrect value: ${value}. Must be between 0 and ${max} seconds.`);
    }
    return value;
  }
  const match = String(input)
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(second|seconds|minute|minutes|hour|hours|day|days)$/i);
  if (!match) {
    throw new Error(
      `Incorrect value format: ${input}. Use a number of seconds, or e.g. "10 minutes", "2 hours".`
    );
  }
  const seconds = Math.round(Number(match[1]) * SECONDS_PER_UNIT[match[2].toLowerCase()]);
  if (seconds < 0 || seconds > max) {
    throw new Error(
      `Incorrect value: ${seconds} seconds (from "${input}"). Must be between 0 and ${max} seconds.`
    );
  }
  return seconds;
}
