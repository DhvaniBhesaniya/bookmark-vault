import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Merge Tailwind classes with clsx
 * Handles conditional classes and deduplication
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a MongoDB ObjectId to a plain hex string.
 * Handles: plain string, {"$oid":"..."}, and bson ObjectId objects.
 */
export function resolveOid(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (typeof value.$oid === 'string') return value.$oid;
    if (typeof value.toHexString === 'function') return value.toHexString();
  }
  return '';
}

/**
 * Format a date as relative time ("2 days ago")
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format a date as a readable string
 */
export function formatDate(date, pattern = 'MMM d, yyyy') {
  if (!date) return '';
  return format(new Date(date), pattern);
}

/**
 * Extract domain from a URL
 */
export function extractDomain(url) {
  if (!url) return '';
  try {
    const { hostname } = new URL(url);
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Truncate text to a max length
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + '…';
}

/**
 * Debounce a function
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a favicon URL from a domain
 */
export function getFaviconUrl(domain) {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}
