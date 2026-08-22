// WildGuardAI — on-device transfer-learning wildlife classifier.
//
# Uses the already-loaded MobileNet as a feature extractor and trains a
# species classifier in the browser on REAL wildlife photos pulled from
# Wikipedia / Wikimedia (CORS-enabled). Per-species embedding centroids are
# cached in localStorage so the model persists across visits. Identification
# is cosine-similarity against those centroids, optionally boosted by the
# scan's geographic context (habitat/country match).
#
# Fallback chain (scan.js): cloud vision API -> this on-device model ->
# generic MobileNet labels + filename keywords.

const WildGuardAI = (function () {
  const STORAGE_KEY = "wildguard_ai_model_v1";
  const MAX_TRAIN = 100;            // species we train on (first N resolved)
  const CONCURRENCY = 4;           // parallel image fetches during training
  const GEO_BOOST = 0.08;          // added similarity for habitat/country match
  const MIN_CONFIDENCE = 0.22;     // below this the model is "unsure"
  const IMG_SIZE = 224;

  let tfModel = null;              // MobileNet instance (has .infer(img, true))
  let centroids = {};              // key -> { key, name, scientificName, vector:[...], count }
  let trained = false;
  let training = false;

  function isReady() { return trained && !!tfModel; }

  function getStatus() {
    return { trained, training, species: Object.keys(centroids).length };
  }

  // ---- Persistence -------------------------------------------------------

  function loadCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1 || !data.centroids) return false;
      centroids = data.centroids || {};
      trained = Object.keys(centroids).length > 0;
      // Prune old cache if > 200 species (prevents bloating)
      if (Object.keys(centroids).length > 200) {
        // Keep only the most recent 150 species by timestamp
        const entries = Object.entries(centroids).sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0));
        centroids = Object.fromEntries(entries.slice(0, 150).map(([k, v]) => [k, v]));
      }
      return trained;
    } catch (e) {
      return false;
    }
  }

  function saveCache() {
    try {
      const payload = { version: 1, savedAt: Date.now(), centroids: centroids };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn("Failed to save AI model cache:", e);
      return false;
    }
  }

  function clearCache() {
    centroids = {};
    trained = false;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // ---- Training ----------------------------------------------------------

  // Resolve a Wikipedia page thumbnail URL for a species, or null.
  async function resolveImageUrl(species) {
    const candidates = [];
    if (species.scientificName) candidates.push(species.scientificName);
    if (species.name) candidates.push(species.name);
    for (const c of candidates) {
      if (!c) continue;
      try {
        const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(c);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!resp.ok) continue;
        const j = await resp.json();
        if (j && j.thumbnail && j.thumbnail.source) return j.thumbnail.source;
      } catch (e) {}
    }
    return null;
  }

  function loadImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const timer = setTimeout(() => resolve(null), 8000);
      img.onload = () => { clearTimeout(timer); resolve(img); };
      img.onerror = () => { clearTimeout(timer); resolve(null); };
      img.src = url;
    });
  }

  // MobileNet v2 (alpha 1.0) embedding -> normalized Float32Array.
  async function embed(img) {
    if (!tfModel || !img) return null;
    try {
      const tensor = tfModel.infer(img, true); // true => embedding
      const values = await tensor.data();
      tensor.dispose();
      return normalize(values);
    } catch (e) {
      return null;
    }
  }

  function normalize(values) {
    let norm = 0;
    for (let i = 0; i < values.length; i++) norm += values[i] * values[i];
    norm = Math.sqrt(norm) || 1;
    const out = new Float32Array(values.length);
    for (let i = 0; i < values.length; i++) out[i] = values[i] / norm;
    return out;
  }

  // Train on the species DB. Pulls one real photo per species from Wikipedia,
  // computes the MobileNet embedding, and stores a per-species centroid.
  async function train(speciesDB, onProgress) {
    if (!tfModel || training) return;
    training = true;
    try {
      const keys = Object.keys(speciesDB || {});
      const pending = keys.filter(k => speciesDB[k] && !centroids[k]);
      const queue = pending.slice(0, MAX_TRAIN);
      let done = 0;
      const total = Math.max(queue, 1); // avoid div/0

      const worker = async (key) => {
        const sp = speciesDB[key];
        try {
          const url = await resolveImageUrl(sp);
          const img = url ? await loadImage(url) : null;
          const vec = img ? await embed(img) : null;
          if (vec) {
            centroids[key] = {
              key: key,
              name: sp.name || key,
              scientificName: sp.scientificName || "",
              category: sp.category || "",
              habitat: (sp.habitat || "").slice(0, 120),
              vector: Array.from(vec),
              count: 1,
              savedAt: Date.now()
            };
          }
        } catch (e) {
          // Species skipped (no Wikipedia image available)
        }
        done++;
        if (onProgress) onProgress(Math.min(100, Math.round((done / total) * 100)), done, total);
      };

      // Run with a small concurrency limit.
      let index = 0;
      async function next() {
        while (index < queue.length) {
          const key = queue[index++];
          await worker(key);
        }
      }
      const runners = [];
      for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) runners.push(next());
      await Promise.all(runners);

      trained = Object.keys(centroids).length > 0;
      saveCache();
    } finally {
      training = false;
    }
  }

  // ---- Classification ----------------------------------------------------

  function cosine(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }

  // Classify an image element. Returns sorted [{key, name, score, geo}].
  async function classify(imgEl, geo) {
    if (!isReady() || !imgEl) return [];
    const vec = await embed(imgEl);
    if (!vec) return [];
    const results = [];
    for (const k in centroids) {
      const c = centroids[k];
      let score = cosine(vec, c.vector);
      // Geo boost: if species' habitat matches scan location, increase similarity
      if (geo && (geo.country || geo.region || geo.place)) {
        const hay = ((c.habitat || "") + " " + (c.name || "")).toLowerCase();
        const loc = (geo.country + " " + geo.region + " " + geo.place).toLowerCase();
        if (hay && loc && loc.length > 2) {
          const words = loc.split(/[\s,]+/).filter(w => w.length > 3);
          for (const w of words) {
            if (hay.indexOf(w) > -1) { score += GEO_BOOST; break; }
          }
        }
      }
      results.push({ key: k, name: c.name, scientificName: c.scientificName, score: Math.min(1, score), geo: !!(geo && (geo.country || geo.region)) });
    }
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  // Top pick + whether the model is confident enough to trust it.
  async function topPick(imgEl, geo) {
    const ranked = await classify(imgEl, geo);
    if (!ranked.length) return null;
    const best = ranked[0];
    if (best.score < MIN_CONFIDENCE) return null;
    return best;
  }

  // ---- Geo helpers (pure, testable) --------------------------------------

  function geoMatchScore(species, geo) {
    if (!species || !geo) return 0;
    if (!(geo.country || geo.region || geo.place)) return 0;
    const hay = ((species.habitat || "") + " " + (species.name || "")).toLowerCase();
    const loc = (geo.country + " " + geo.region + " " + geo.place).toLowerCase();
    if (!hay || loc.length <= 2) return 0;
    const words = loc.split(/[\s,]+/).filter(w => w.length > 3);
    for (const w of words) {
      if (hay.indexOf(w) > -1) return GEO_BOOST;
    }
    return 0;
  }

  // ---- Public API --------------------------------------------------------

  const api = {
    init(model) {
      tfModel = model || null;
      loadCache();
    },
    isReady,
    getStatus,
    train,
    classify,
    topPick,
    cosine,
    geoMatchScore,
    normalize,
    clearCache,
    STORAGE_KEY,
    _resolveImageUrl: resolveImageUrl,
    _loadImage: loadImage,
    _embed: embed
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.WildGuardAI = api;
  return api;
})();

if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.WildGuardAI = api;
return api;
)();