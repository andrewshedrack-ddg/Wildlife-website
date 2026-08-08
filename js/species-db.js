/**
 * WildGuard Society - Centralized Species Database
 * Single source of truth for the wildlife species catalog.
 * Seeded from js/wildlife-data.json (499 species) + scan.js inline DB,
 * persisted to localStorage so admin edits (add/edit/delete/image) apply site-wide.
 */
(function() {
  'use strict';

  var STORE_KEY = 'wildguard_species_db';
  var species = {};      // key -> entry
  var ready = false;
  var readyCallbacks = [];
  var changeCallbacks = [];

  function read() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; }
  }
  function write() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
        species: species
      }));
    } catch (e) {}
  }
  function notifyReady() {
    ready = true;
    readyCallbacks.forEach(function(fn) { try { fn(); } catch (e) {} });
    readyCallbacks = [];
  }
  function notifyChange() {
    changeCallbacks.forEach(function(fn) { try { fn(); } catch (e) {} });
  }

  // Seed from scan.js inline DB (if present) + external wildlife-data.json
  function seed() {
    if (window.WildlifeScan && window.WildlifeScan.speciesDB) {
      Object.keys(window.WildlifeScan.speciesDB).forEach(function(k) {
        species[k] = window.WildlifeScan.speciesDB[k];
      });
    }
    fetch('js/wildlife-data.json')
      .then(function(r) { return r.ok ? r.json() : null; })
      .catch(function() { return null; })
      .then(function(data) {
        if (data && data.speciesDB) {
          Object.keys(data.speciesDB).forEach(function(k) {
            var base = data.speciesDB[k] || {};
            species[k] = species[k] ? Object.assign({}, base, species[k]) : base;
          });
        }
        write();
        notifyReady();
        notifyChange();
      });
  }

  function init() {
    var existing = read();
    if (existing && existing.species && Object.keys(existing.species).length) {
      species = existing.species;
      ready = true;
      notifyChange();
      return;
    }
    seed();
  }

  function normalizeImage(src) {
    if (!src) return '';
    if (/^(data:|http:\/\/|https:\/\/|blob:)/.test(src)) return src;
    var trimmed = src.trim();
    if (trimmed.charAt(0) !== '/' && !/^\.\.?\//.test(trimmed)) trimmed = 'assets/images/' + trimmed;
    return trimmed;
  }

  window.WildGuardSpeciesDB = {
    isReady: function() { return ready; },
    onReady: function(fn) {
      if (ready) { try { fn(); } catch (e) {} return; }
      readyCallbacks.push(fn);
    },
    onChange: function(fn) { changeCallbacks.push(fn); },

    get: function(key) { return species[key] || null; },
    getAll: function() { return species; },
    list: function() {
      return Object.keys(species).map(function(k) {
        var e = Object.assign({ key: k }, species[k]);
        if (!e.order) e.order = 1000;
        return e;
      }).sort(function(a, b) { return a.order - b.order || (a.name || '').localeCompare(b.name || ''); });
    },
    count: function() { return Object.keys(species).length; },

    save: function(key, data) {
      species[key] = Object.assign({}, species[key] || {}, data, { key: key });
      write();
      notifyChange();
      return species[key];
    },
    add: function(key, data) {
      if (!key) return null;
      if (species[key]) { this.save(key, data); return species[key]; }
      var entry = Object.assign({}, data, { key: key, order: Date.now() });
      species[key] = entry;
      write();
      notifyChange();
      return entry;
    },
    remove: function(key) {
      if (!species[key]) return false;
      delete species[key];
      write();
      notifyChange();
      return true;
    },
    reset: function() {
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      species = {};
      ready = false;
      seed();
    },

    // Image helpers for the admin "swap images" feature
    image: normalizeImage,
    availableImages: function() {
      return [
        'elephant.jpg', 'lion.jpg', 'zebra.png', 'rhino.png', 'leopard.png', 'Eagle.png',
        'flamingo.png', 'fox.png', 'Bear.png', 'Hippo.png', 'Kangaroo.png', 'Koala.png',
        'Monkey.png', 'owl.png', 'peacock.png', 'Polar bear.png', 'Rabbit.png', 'shark.png',
        'Tortoise.png', 'warthog.png', 'White Head Eagle.png', 'Hedgehog.png', 'Horse.png',
        'bee.png', 'buffalo.png', 'Butterfly.png', 'chameleon.png', 'cow.png', 'goose.png',
        'pig.png', 'Turkey.png', 'Antelope.png', 'serengeti.jpg'
      ];
    }
  };

  init();
})();
