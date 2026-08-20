import { describe, it, expect } from 'vitest';

// species-db.js is an IIFE that exposes window.WildGuardSpeciesDB.
import '../../js/species-db.js';

describe('WildGuardSpeciesDB', () => {
  const db = globalThis.window.WildGuardSpeciesDB;

  it('is exposed on window', () => {
    expect(db).toBeTruthy();
  });

  describe('image normalization', () => {
    it('keeps data URIs untouched', () => {
      const uri = 'data:image/png;base64,aGVsbG8=';
      expect(db.image(uri)).toBe(uri);
    });

    it('keeps absolute http(s) URLs untouched', () => {
      expect(db.image('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
      expect(db.image('http://example.com/a.jpg')).toBe('http://example.com/a.jpg');
    });

    it('keeps blob: URLs untouched', () => {
      expect(db.image('blob:http://x/y')).toBe('blob:http://x/y');
    });

    it('prefixes bare filenames with assets/images/', () => {
      expect(db.image('lion.jpg')).toBe('assets/images/lion.jpg');
    });

    it('keeps relative paths that already point into assets', () => {
      expect(db.image('assets/images/lion.jpg')).toBe('assets/images/lion.jpg');
      expect(db.image('./assets/images/lion.jpg')).toBe('./assets/images/lion.jpg');
      expect(db.image('../assets/images/lion.jpg')).toBe('../assets/images/lion.jpg');
    });

    it('returns an empty string for null/undefined', () => {
      expect(db.image(null)).toBe('');
      expect(db.image(undefined)).toBe('');
      expect(db.image('')).toBe('');
    });

    it('trims surrounding whitespace', () => {
      expect(db.image('  lion.jpg  ')).toBe('assets/images/lion.jpg');
    });
  });
});