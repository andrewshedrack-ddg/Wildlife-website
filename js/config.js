// WildGuard Society - Configuration & Internationalization
// Supports: English, Spanish, French, Swahili, Portuguese, Arabic, Chinese

const WildGuardConfig = {
  // API Configuration
  api: {
    baseUrl: '',
    gbif: 'https://api.gbif.org/v1',
    inaturalist: 'https://api.inaturalist.org/v1',
    iucn: 'https://apiv3.iucnredlist.org/api/v3',
    timeout: 10000,
    // Azure AI Vision (Image Analysis) — used by the backend /api/scan proxy.
    azureVision: {
      endpoint: '',
      key: ''
    }
  },

  // Supported Languages
  languages: {
    en: { name: 'English', native: 'English', rtl: false, flag: '🇬🇧' },
    es: { name: 'Spanish', native: 'Español', rtl: false, flag: '🇪🇸' },
    fr: { name: 'French', native: 'Français', rtl: false, flag: '🇫🇷' },
    sw: { name: 'Swahili', native: 'Kiswahili', rtl: false, flag: '🇹🇿' },
    pt: { name: 'Portuguese', native: 'Português', rtl: false, flag: '🇵🇹' },
    ar: { name: 'Arabic', native: 'العربية', rtl: true, flag: '🇸🇦' },
    zh: { name: 'Chinese', native: '中文', rtl: false, flag: '🇨🇳' }
  },

  // Default language
  defaultLanguage: 'en',

  // Translation cache
  _translations: {},
  _currentLang: 'en',

  // Initialize i18n
  async init() {
    // Load saved language or detect browser language
    const saved = localStorage.getItem('wildguard_lang');
    const browserLang = navigator.language.split('-')[0];
    const detected = this.languages[browserLang] ? browserLang : 'en';
    this._currentLang = saved || detected;

    // Load translations
    await this.loadTranslations(this._currentLang);
    
    // Apply translations to DOM
    this.applyTranslations();
    
    // Create language selector
    this.createLanguageSelector();
  },

  // Load translation file
  async loadTranslations(lang) {
    try {
      const response = await fetch(`js/i18n/${lang}.json`);
      if (response.ok) {
        this._translations = await response.json();
      } else {
        console.warn(`Translation file not found for ${lang}, using English`);
        const enResponse = await fetch('js/i18n/en.json');
        this._translations = await enResponse.json();
      }
    } catch (e) {
      console.error('Failed to load translations:', e);
      this._translations = {};
    }
  },

  // Get translation
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this._translations;
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key; // Fallback to key if translation missing
      }
    }
    // Replace parameters
    if (typeof value === 'string') {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => params[param] || match);
    }
    return value;
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
      } else {
        el.textContent = translation;
      }
    });

    // Update direction for RTL languages
    const langInfo = this.languages[this._currentLang];
    document.documentElement.dir = langInfo.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = this._currentLang;

    // Update language selector display
    this.updateLanguageSelector();
  },

  // Create language selector dropdown
  createLanguageSelector() {
    const existing = document.getElementById('lang-selector');
    if (existing) existing.remove();

    const selector = document.createElement('div');
    selector.id = 'lang-selector';
    selector.className = 'language-selector';
    selector.innerHTML = `
      <button class="lang-btn" aria-label="Select language" aria-expanded="false">
        <span class="lang-flag">${this.languages[this._currentLang].flag}</span>
        <span class="lang-name">${this.languages[this._currentLang].native}</span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div class="lang-dropdown" role="menu" hidden>
        ${Object.entries(this.languages).map(([code, info]) => `
          <button class="lang-option ${code === this._currentLang ? 'active' : ''}" 
                  role="menuitem" data-lang="${code}">
            <span class="lang-flag">${info.flag}</span>
            <span class="lang-native">${info.native}</span>
            <span class="lang-english">${info.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    // Add to header actions
    const headerActions = document.querySelector('.header-actions') || document.querySelector('.header-container');
    if (headerActions) {
      headerActions.insertBefore(selector, headerActions.firstChild);
    }

    // Bind events
    const btn = selector.querySelector('.lang-btn');
    const dropdown = selector.querySelector('.lang-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
      dropdown.hidden = expanded;
    });

    dropdown.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', () => this.setLanguage(opt.dataset.lang));
    });

    // Close on outside click
    document.addEventListener('click', () => {
      dropdown.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    });
  },

  updateLanguageSelector() {
    const btn = document.querySelector('.lang-btn');
    const dropdown = document.querySelector('.lang-dropdown');
    if (btn && dropdown) {
      const info = this.languages[this._currentLang];
      btn.querySelector('.lang-flag').textContent = info.flag;
      btn.querySelector('.lang-name').textContent = info.native;
      dropdown.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === this._currentLang);
      });
    }
  },

  // Set language
  async setLanguage(lang) {
    if (!this.languages[lang]) return;
    this._currentLang = lang;
    localStorage.setItem('wildguard_lang', lang);
    await this.loadTranslations(lang);
    this.applyTranslations();
  },

  // GBIF API Integration
  async searchGBIF(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      limit: options.limit || 20,
      rank: options.rank || 'SPECIES',
      ...options.params
    });
    try {
      const response = await fetch(`${this.api.gbif}/species/search?${params}`, {
        headers: { 'Accept': 'application/json' }
      });
      return await response.json();
    } catch (e) {
      console.error('GBIF search failed:', e);
      return { results: [] };
    }
  },

  async getGBIFSpecies(key) {
    try {
      const response = await fetch(`${this.api.gbif}/species/${key}`);
      return await response.json();
    } catch (e) {
      console.error('GBIF species fetch failed:', e);
      return null;
    }
  },

  async getGBIFVernacularNames(key) {
    try {
      const response = await fetch(`${this.api.gbif}/species/${key}/vernacularNames`);
      return await response.json();
    } catch (e) {
      return { results: [] };
    }
  },

  // iNaturalist API Integration
  async searchINaturalist(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      per_page: options.per_page || 20,
      ...options.params
    });
    try {
      const response = await fetch(`${this.api.inaturalist}/taxa?${params}`);
      return await response.json();
    } catch (e) {
      console.error('iNaturalist search failed:', e);
      return { results: [] };
    }
  },

  async getINaturalistTaxon(id) {
    try {
      const response = await fetch(`${this.api.inaturalist}/taxa/${id}`);
      return await response.json();
    } catch (e) {
      return null;
    }
  },

  // IUCN Red List Integration (requires API token)
  async getIUCNStatus(scientificName) {
    const token = this.api.iucnToken || localStorage.getItem('iucn_token');
    if (!token) return { status: 'Unknown', note: 'IUCN API token required' };
    try {
      const response = await fetch(`${this.api.iucn}/species/${encodeURIComponent(scientificName)}?token=${token}`);
      return await response.json();
    } catch (e) {
      return { status: 'Unknown', note: 'API error' };
    }
  },

  // Species enrichment - combines multiple sources
  async enrichSpeciesData(speciesData) {
    const scientificName = speciesData.scientificName || speciesData.name;
    const results = { ...speciesData };

    // Try GBIF
    const gbifSearch = await this.searchGBIF(scientificName, { limit: 1 });
    if (gbifSearch.results && gbifSearch.results.length > 0) {
      const gbifSpecies = gbifSearch.results[0];
      results.gbifKey = gbifSpecies.key;
      results.gbifData = gbifSpecies;
      
      // Get vernacular names
      const vernacular = await this.getGBIFVernacularNames(gbifSpecies.key);
      results.vernacularNames = vernacular.results || [];
    }

    // Try iNaturalist
    const inatSearch = await this.searchINaturalist(scientificName, { per_page: 1 });
    if (inatSearch.results && inatSearch.results.length > 0) {
      const taxon = inatSearch.results[0];
      results.inatId = taxon.id;
      results.inatData = taxon;
    }

    // Try IUCN (if token available)
    const iucn = await this.getIUCNStatus(scientificName);
    if (iucn && iucn.result && iucn.result.length > 0) {
      results.iucnStatus = iucn.result[0].category;
      results.iucnPopulation = iucn.result[0].population;
      results.iucnTrend = iucn.result[0].populationTrend;
    }

    return results;
  }
};

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => WildGuardConfig.init());

// Export for module usage
if (typeof module !== 'undefined') module.exports = WildGuardConfig;