export interface Bookmark {
  url: string;
  slug: string;
}

/**
 * Normalizes a URL by adding "https://" if it doesn't already have a protocol.
 * Handles URLs with or without "https://", "http://", or other protocols.
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Check if URL already has a protocol
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  // Otherwise, prepend https://
  return `https://${trimmed}`;
}

/**
 * Generates a short base62 slug with a "mona-" prefix.
 * Uses a counter-based approach to ensure uniqueness.
 */
let counter = 0;
function base62(num: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  if (num === 0) return chars[0];

  let result = '';
  while (num > 0) {
    result = chars[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result;
}

export function generateSlug(): string {
  counter++;
  return `mona-${base62(counter)}`;
}

/**
 * Loads bookmarks from localStorage under the "mona-bookmarks" key.
 * Validates that the stored value is an array of {url, slug} objects.
 * Returns an empty array if storage is empty, corrupted, or invalid.
 * Never throws; handles gracefully.
 */
export function loadBookmarksFromStorage(): Bookmark[] {
  try {
    const stored = localStorage.getItem('mona-bookmarks');

    // Empty storage
    if (stored === null || stored === '') {
      return [];
    }

    const parsed = JSON.parse(stored);

    // Not an array
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validate each item is a {url, slug} object
    const validated: Bookmark[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.url === 'string' &&
        typeof item.slug === 'string' &&
        item.url.length > 0 &&
        item.slug.length > 0
      ) {
        validated.push({
          url: item.url,
          slug: item.slug,
        });
      }
    }

    return validated;
  } catch {
    // JSON.parse error, localStorage unavailable, or any other error
    return [];
  }
}

/**
 * Saves bookmarks to localStorage under the "mona-bookmarks" key.
 */
export function saveBookmarksToStorage(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem('mona-bookmarks', JSON.stringify(bookmarks));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Formats a bookmark as a display string with " :: " separator.
 */
export function formatBookmark(bookmark: Bookmark): string {
  return `${bookmark.url} :: ${bookmark.slug}`;
}

/**
 * Resets the counter for slug generation (useful for testing).
 */
export function resetCounter(): void {
  counter = 0;
}
