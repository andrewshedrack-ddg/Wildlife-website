/**
 * WildGuard Society - Internationalization System
 * Lightweight i18n with dynamic language switching
 */

(function() {
  'use strict';

  const I18n = {
    currentLang: 'en',
    fallbackLang: 'en',
    translations: {},
    observers: [],

    // Initialize i18n system
    async init() {
      // Load saved language preference
      const savedLang = localStorage.getItem('wildguard_language') || 
                       navigator.language.split('-')[0] || 
                       'en';
      
      // Check if language is supported
      const supported = ['en', 'es', 'fr', 'sw']; // Add more as needed
      this.currentLang = supported.includes(savedLang) ? savedLang : 'en';
      
      // Load translations for current language
      await this.loadLanguage(this.currentLang);
      
      // Apply translations to DOM
      this.applyTranslations();
      
      // Update language selector UI
      this.updateLanguageSelector();
      
      // Bind dropdown events
      this.bindLanguageDropdown();
      
      console.log('[I18n] Initialized with language:', this.currentLang);
    },

    // Load translation file for a language
    async loadLanguage(lang) {
      try {
        // Detect if we're in a subdirectory (library/, admin/, user/)
        const path = window.location.pathname;
        const depth = path.split('/').filter(Boolean).length;
        const basePath = depth >= 2 ? '../js/i18n/' : 'js/i18n/';
        const response = await fetch(`${basePath}${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
        this.translations[lang] = await response.json();
      } catch (err) {
        console.warn(`[I18n] Could not load ${lang}, using fallback:`, err);
        if (lang !== this.fallbackLang) {
          await this.loadLanguage(this.fallbackLang);
        }
      }
    },

    // Get translation for a key
    t(key, params = {}) {
      const keys = key.split('.');
      let result = this.translations[this.currentLang];
      
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          // Fallback to English
          result = this.translations[this.fallbackLang];
          for (const fk of keys) {
            if (result && typeof result === 'object' && fk in result) {
              result = result[fk];
            } else {
              return key; // Return key if not found
            }
          }
          break;
        }
      }
      
      if (typeof result !== 'string') return key;
      
      // Replace parameters
      return result.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    },

    // Apply translations to all elements with data-i18n attribute
    applyTranslations() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = this.t(key);
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.type === 'placeholder' || el.hasAttribute('placeholder')) {
            el.placeholder = translation;
          } else {
            el.value = translation;
          }
        } else if (el.tagName === 'IMG') {
          el.alt = translation;
        } else {
          // Preserve HTML elements inside
          const htmlContent = el.innerHTML;
          // Only replace text nodes, not inner HTML
          if (!htmlContent.includes('<')) {
            el.textContent = translation;
          } else {
            // For complex elements, only translate if no children or data-i18n-html
            if (el.hasAttribute('data-i18n-html')) {
              el.innerHTML = translation;
            }
          }
        }
      });

      // Update document title
      const titleKey = document.documentElement.getAttribute('data-i18n-title');
      if (titleKey) {
        document.title = this.t(titleKey);
      }

      // Update language attribute
      document.documentElement.lang = this.currentLang;
    },

    // Switch language
    async setLanguage(lang) {
      if (lang === this.currentLang) return;
      
      const supported = ['en', 'es', 'fr', 'sw'];
      if (!supported.includes(lang)) {
        console.warn('[I18n] Unsupported language:', lang);
        return;
      }

      this.currentLang = lang;
      localStorage.setItem('wildguard_language', lang);
      
      await this.loadLanguage(lang);
      this.applyTranslations();
      this.updateLanguageSelector();
      
      // Notify observers
      this.observers.forEach(cb => cb(lang));
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    },

    // Get current language
    getLanguage() {
      return this.currentLang;
    },

    // Subscribe to language changes
    onLanguageChange(callback) {
      this.observers.push(callback);
      return () => {
        this.observers = this.observers.filter(cb => cb !== callback);
      };
    },

    // Update language selector UI
    updateLanguageSelector() {
      // Update button group
      const toggles = document.querySelectorAll('.lang-toggle');
      toggles.forEach(btn => {
        const isActive = btn.getAttribute('data-lang') === this.currentLang;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-expanded', isActive);
      });
      
      // Update dropdown options
      const options = document.querySelectorAll('.lang-option');
      options.forEach(opt => {
        const isActive = opt.getAttribute('data-lang') === this.currentLang;
        opt.classList.toggle('active', isActive);
        opt.setAttribute('aria-selected', isActive);
      });
    },

    // Bind language dropdown events
    bindLanguageDropdown() {
      const toggles = document.querySelectorAll('.lang-toggle');
      const dropdowns = document.querySelectorAll('.lang-dropdown');
      
      toggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = toggle.getAttribute('aria-expanded') === 'true';
          
          // Close all dropdowns first
          document.querySelectorAll('.lang-dropdown').forEach(dd => {
            dd.classList.remove('open');
            dd.hidden = true;
          });
          document.querySelectorAll('.lang-toggle').forEach(t => {
            t.setAttribute('aria-expanded', 'false');
          });
          
          if (!isOpen) {
            const dropdown = toggle.nextElementSibling;
            if (dropdown && dropdown.classList.contains('lang-dropdown')) {
              dropdown.classList.add('open');
              dropdown.hidden = false;
              toggle.setAttribute('aria-expanded', 'true');
            }
          }
        });
      });
      
      // Handle dropdown option clicks
      document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', () => {
          const lang = option.getAttribute('data-lang');
          if (lang) {
            this.setLanguage(lang);
          }
        });
      });
      
      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.language-selector')) {
          document.querySelectorAll('.lang-dropdown').forEach(dd => {
            dd.classList.remove('open');
            dd.hidden = true;
          });
          document.querySelectorAll('.lang-toggle').forEach(t => {
            t.setAttribute('aria-expanded', 'false');
          });
        }
      });
      
      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.lang-dropdown').forEach(dd => {
            dd.classList.remove('open');
            dd.hidden = true;
          });
          document.querySelectorAll('.lang-toggle').forEach(t => {
            t.setAttribute('aria-expanded', 'false');
            t.focus();
          });
        }
      });
    },

    // Auto-detect and set language from browser
    async autoDetect() {
      const browserLang = navigator.language.split('-')[0];
      const supported = ['en', 'es', 'fr', 'sw'];
      if (supported.includes(browserLang)) {
        await this.setLanguage(browserLang);
      }
    }
  };

  // Expose globally
  window.I18n = I18n;

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18n.init());
  } else {
    I18n.init();
  }

})();