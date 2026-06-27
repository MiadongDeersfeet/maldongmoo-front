export const DISPLAY_TIME_ZONE = 'Asia/Seoul';

/** yyyy-MM-dd in Korea Standard Time (matches backend check-in date). */
export function getLocalDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DISPLAY_TIME_ZONE }).format(date);
}

/**
 * Normalizes API datetime strings to `yyyy-MM-dd HH:mm:ss`.
 * Backend returns KST wall-clock values without offset.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeApiDateTime(value) {
  if (typeof value !== 'string' || !value) {
    return '';
  }

  if (value.includes('T')) {
    return value.replace('T', ' ').slice(0, 19);
  }

  return value.slice(0, 19);
}

/**
 * @param {unknown} value
 * @returns {string} yyyy-MM-dd
 */
export function extractDisplayDatePart(value) {
  const normalized = normalizeApiDateTime(value);
  return normalized ? normalized.slice(0, 10) : '';
}

/**
 * Formats API datetime as Korean 12-hour clock label.
 * @param {unknown} value
 * @returns {string}
 */
export function formatDisplayTime(value) {
  const normalized = normalizeApiDateTime(value);
  if (!normalized) {
    return '';
  }

  const timePart = normalized.includes(' ') ? normalized.split(' ')[1] : normalized;
  const [hourStr, minuteStr] = timePart.split(':');
  const hour = Number(hourStr);
  const minute = minuteStr ?? '00';
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${displayHour}:${minute}`;
}

/**
 * Compact HH:mm for detail rows.
 * @param {unknown} value
 * @returns {string}
 */
export function formatDisplayClock(value) {
  const normalized = normalizeApiDateTime(value);
  if (!normalized) {
    return '';
  }

  const timePart = normalized.includes(' ') ? normalized.split(' ')[1] : normalized;
  return timePart.slice(0, 5);
}
