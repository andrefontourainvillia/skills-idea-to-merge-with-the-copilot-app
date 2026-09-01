import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeUrl,
  generateSlug,
  loadBookmarksFromStorage,
  saveBookmarksToStorage,
  formatBookmark,
  resetCounter,
  type Bookmark,
} from './bookmarks';

describe('bookmarks utilities', () => {
  beforeEach(() => {
    resetCounter();
    // Mock localStorage for these tests
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
      key: (index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
      length: Object.keys(store).length,
    } as Storage;
  });

  describe('normalizeUrl', () => {
    it('should add https:// to a URL without a protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    it('should not modify a URL with https://', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should not modify a URL with http://', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should handle URLs with paths', () => {
      expect(normalizeUrl('example.com/path')).toBe('https://example.com/path');
      expect(normalizeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('should handle URLs with query strings', () => {
      expect(normalizeUrl('example.com?query=1')).toBe('https://example.com?query=1');
    });

    it('should trim whitespace', () => {
      expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
    });

    it('should return empty string for empty input', () => {
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl('  ')).toBe('');
    });

    it('should handle URLs with www prefix', () => {
      expect(normalizeUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('should handle custom protocols', () => {
      expect(normalizeUrl('ftp://example.com')).toBe('ftp://example.com');
    });
  });

  describe('generateSlug', () => {
    it('should generate a slug with mona- prefix', () => {
      const slug = generateSlug();
      expect(slug).toMatch(/^mona-/);
    });

    it('should generate unique slugs', () => {
      const slug1 = generateSlug();
      const slug2 = generateSlug();
      expect(slug1).not.toBe(slug2);
      expect(slug1).toMatch(/^mona-/);
      expect(slug2).toMatch(/^mona-/);
    });

    it('should generate short base62 encoded slugs', () => {
      resetCounter();
      expect(generateSlug()).toBe('mona-1');
      expect(generateSlug()).toBe('mona-2');
      expect(generateSlug()).toBe('mona-3');
    });

    it('should handle counter overflow into base62', () => {
      resetCounter();
      // Generate up to 61 to test base62 encoding (counter will be 0-61)
      for (let i = 0; i < 61; i++) {
        generateSlug();
      }
      // The 62nd should be base62 "10" (representing 62 in base62)
      expect(generateSlug()).toBe('mona-10');
    });
  });

  describe('formatBookmark', () => {
    it('should format a bookmark with " :: " separator', () => {
      const bookmark: Bookmark = {
        url: 'https://www.example.com',
        slug: 'mona-7fk2',
      };
      expect(formatBookmark(bookmark)).toBe('https://www.example.com :: mona-7fk2');
    });

    it('should use exact " :: " separator (with spaces)', () => {
      const bookmark: Bookmark = {
        url: 'https://github.com',
        slug: 'mona-abc',
      };
      const formatted = formatBookmark(bookmark);
      expect(formatted).toContain(' :: ');
      // Verify the separator appears exactly once and with correct spacing
      const parts = formatted.split(' :: ');
      expect(parts.length).toBe(2);
      expect(parts[0]).toBe('https://github.com');
      expect(parts[1]).toBe('mona-abc');
    });

    it('should handle complex URLs', () => {
      const bookmark: Bookmark = {
        url: 'https://example.com/path?query=value&other=test#anchor',
        slug: 'mona-xyz',
      };
      expect(formatBookmark(bookmark)).toBe(
        'https://example.com/path?query=value&other=test#anchor :: mona-xyz'
      );
    });
  });

  describe('loadBookmarksFromStorage', () => {
    it('should load an empty array when storage is empty', () => {
      const bookmarks = loadBookmarksFromStorage();
      expect(bookmarks).toEqual([]);
    });

    it('should load valid bookmarks from storage', () => {
      const saved: Bookmark[] = [
        { url: 'https://example.com', slug: 'mona-1' },
        { url: 'https://github.com', slug: 'mona-2' },
      ];
      saveBookmarksToStorage(saved);

      const loaded = loadBookmarksFromStorage();
      expect(loaded).toEqual(saved);
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('mona-bookmarks', '{invalid json}');
      expect(() => loadBookmarksFromStorage()).not.toThrow();
      expect(loadBookmarksFromStorage()).toEqual([]);
    });

    it('should handle non-array stored values', () => {
      localStorage.setItem('mona-bookmarks', '"a string"');
      expect(loadBookmarksFromStorage()).toEqual([]);

      localStorage.setItem('mona-bookmarks', '{"url": "test"}');
      expect(loadBookmarksFromStorage()).toEqual([]);

      localStorage.setItem('mona-bookmarks', 'null');
      expect(loadBookmarksFromStorage()).toEqual([]);
    });

    it('should drop malformed items from an array', () => {
      const mixed = [
        { url: 'https://example.com', slug: 'mona-1' }, // valid
        { url: 'https://github.com' }, // missing slug
        { slug: 'mona-2' }, // missing url
        { url: '', slug: 'mona-3' }, // empty url
        { url: 'https://test.com', slug: '' }, // empty slug
        null, // null item
        undefined, // undefined
        { url: 'https://valid.com', slug: 'mona-4' }, // valid
      ];
      localStorage.setItem('mona-bookmarks', JSON.stringify(mixed));

      const loaded = loadBookmarksFromStorage();
      expect(loaded).toEqual([
        { url: 'https://example.com', slug: 'mona-1' },
        { url: 'https://valid.com', slug: 'mona-4' },
      ]);
    });

    it('should handle empty string in storage', () => {
      localStorage.setItem('mona-bookmarks', '');
      expect(loadBookmarksFromStorage()).toEqual([]);
    });

    it('should handle legacy or unexpected storage structures', () => {
      // Old format or completely different structure
      localStorage.setItem('mona-bookmarks', '123');
      expect(loadBookmarksFromStorage()).toEqual([]);

      localStorage.setItem('mona-bookmarks', 'true');
      expect(loadBookmarksFromStorage()).toEqual([]);
    });
  });

  describe('saveBookmarksToStorage', () => {
    it('should save bookmarks to localStorage', () => {
      const bookmarks: Bookmark[] = [
        { url: 'https://example.com', slug: 'mona-1' },
      ];
      saveBookmarksToStorage(bookmarks);

      const stored = localStorage.getItem('mona-bookmarks');
      expect(stored).toBe(JSON.stringify(bookmarks));
    });

    it('should overwrite previous bookmarks', () => {
      saveBookmarksToStorage([{ url: 'https://old.com', slug: 'mona-old' }]);
      saveBookmarksToStorage([{ url: 'https://new.com', slug: 'mona-new' }]);

      const loaded = loadBookmarksFromStorage();
      expect(loaded).toEqual([{ url: 'https://new.com', slug: 'mona-new' }]);
    });

    it('should save an empty array', () => {
      saveBookmarksToStorage([]);
      expect(loadBookmarksFromStorage()).toEqual([]);
    });
  });

  describe('integration: URL normalization with storage', () => {
    it('should normalize URLs before and after storage', () => {
      const url = 'example.com';
      const normalized = normalizeUrl(url);
      const bookmark: Bookmark = {
        url: normalized,
        slug: generateSlug(),
      };

      saveBookmarksToStorage([bookmark]);
      const loaded = loadBookmarksFromStorage();

      expect(loaded[0].url).toBe('https://example.com');
    });
  });
});
