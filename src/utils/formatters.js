/**
 * Truncate a string to a maximum number of characters, appending '…'.
 */
export const truncate = (str, maxLen = 120) =>
  str.length <= maxLen ? str : `${str.slice(0, maxLen)}…`;

/**
 * Format a date string (YYYY-MM-DD) into a human-readable form.
 */
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Format a large number with K suffix (e.g. 1200 → "1.2K").
 */
export const formatCount = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

/**
 * Return initials from a full name string.
 */
// Canonical getInitials used everywhere in the app. Returns up to 2 uppercase
// initials from a name. Handles null, undefined, empty, all-whitespace, and
// names with multiple spaces between words. Returns '?' for any input that
// can't yield a real initial — never crashes, never uses the brand mark
// (which is logo-only, not a person fallback).
export const getInitials = (name) => {
  if (!name || !String(name).trim()) return '?'
  return String(name)
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Capitalise the first letter of a string.
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
