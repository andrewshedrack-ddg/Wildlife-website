import { describe, it, expect, beforeEach } from 'vitest';

// config.js attaches itself to `module.exports` and registers a DOMContentLoaded
// listener; the jsdom environment provides a valid `document` at import time.
import WildGuardConfig from '../../js/config.js';

describe('WildGuardConfig', () => {
  it('defines all supported languages', () => {
    expect(Object.keys(WildGuardConfig.languages)).toContain('en');
    expect(Object.keys(WildGuardConfig.languages)).toContain('es');
    expect(Object.keys(WildGuardConfig.languages)).toContain('fr');
    expect(Object.keys(WildGuardConfig.languages)).toContain('sw');
  });

  it('flags Arabic as RTL', () => {
    expect(WildGuardConfig.languages.ar.rtl).toBe(true);
    expect(WildGuardConfig.languages.en.rtl).toBe(false);
  });

  it('defaults to English', () => {
    expect(WildGuardConfig.defaultLanguage).toBe('en');
  });

  it('configures external API endpoints', () => {
    expect(WildGuardConfig.api.gbif).toMatch(/api\.gbif\.org/);
    expect(WildGuardConfig.api.inaturalist).toMatch(/api\.inaturalist\.org/);
    expect(WildGuardConfig.api.timeout).toBeGreaterThan(0);
  });

  describe('t()', () => {
    beforeEach(() => {
      WildGuardConfig._translations = {
        nav: { home: 'Home', about: 'About' },
        welcome: 'Welcome, {{name}}!',
        missing: 'Nothing here'
      };
    });

    it('returns a nested translation', () => {
      expect(WildGuardConfig.t('nav.home')).toBe('Home');
      expect(WildGuardConfig.t('nav.about')).toBe('About');
    });

    it('substitutes named parameters', () => {
      expect(WildGuardConfig.t('welcome', { name: 'Ada' })).toBe('Welcome, Ada!');
    });

    it('falls back to the raw key for missing translations', () => {
      expect(WildGuardConfig.t('nav.doesNotExist')).toBe('nav.doesNotExist');
      expect(WildGuardConfig.t('totally.missing.key')).toBe('totally.missing.key');
    });

    it('leaves unknown parameters untouched', () => {
      expect(WildGuardConfig.t('welcome')).toBe('Welcome, {{name}}!');
    });
  });
});