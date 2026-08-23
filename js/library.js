// library.js - real book covers with wildlife photography + filters + collapsible scans + research tools

document.addEventListener('DOMContentLoaded', () => {
    // --- Book Content ---
    const books = [
        {
            id: 1,
            title: "Kings of the Savannah",
            author: "Dr. Selene Mwangi",
            image: "../assets/images/lion.jpg",
            pages: 312,
            published: "2024",
            desc: "An intimate portrait of lion prides across the Serengeti.",
            chapters: [
                { title: "Chapter 1: The Pride", text: "Under the golden embrace of the African sun, the lion stands as the undisputed sovereign of the savannah. Their roars, echoing across the plains, are not mere sounds but declarations of territory, warnings to rivals, and reunions of pride members. A lion's mane, flowing like a crown of fire, speaks volumes about its health, genetics, and social standing among the pride." },
                { title: "Chapter 2: The Hunt", text: "When dusk falls, the lionesses emerge. Working in silent synchrony, they flank herds of wildebeest and zebra. The hunt is not a solitary affair—it is ballet of patience, timing, and explosive power. One in four hunts succeeds, yet this is enough to sustain the pride and shape the ecosystem, as lions cull the weak and maintain the balance of the savannah." },
                { title: "Chapter 3: Legacy", text: "A male lion's reign lasts but a few short years. Defeated by younger rivals, he retreats to the shadows, his legacy carried on by the cubs he sired. Yet within the pride, his genes persist, and the cycle of the savannah continues, painted in gold and shadow." }
            ]
        },
        {
            id: 2,
            title: "The Great Crossing",
            author: "John Okello",
            image: "../assets/images/zebra.png",
            pages: 256,
            published: "2023",
            chapter: "Witness the great wildebeest migration across the Mara.",
            chapters: [
                { title: "Chapter 1: The Signal", text: "The rains arrive like a drumroll across the Serengeti. From the southern plains, a pulse begins—the great migration. Over two million wildebeest, zebra, and gazelles answer an ancient call, driven by the rhythm of the seasons and the promise of green pastures." },
                { title: "Chapter 2: River of Shadows", text: "The Grumeti and Mara rivers lie in their path. Beneath the murky waters, Nile crocodiles, some over fifteen feet long, wait in prehistoric patience. The crossing is chaos: hooves thunder, currents sweep away the young and weak, and the air fills with dust and desperation." },
                { title: "Chapter 3: Circle Unbroken", text: "Those who reach the northern Serengeti find renewal. Calves are born on these rich lands. But the rains will shift again, and the great column will turn south, completing a cycle that has turned for millennia, a living pulse that sustains Africa's heart." }
            ]
        },
        {
            id: 3,
            title: "Ivory Ghosts",
            author: "Dr. Amina Khoury",
            image: "../assets/images/elephant.jpg",
            pages: 378,
            published: "2024",
            chapter: "Elephant conservation and the fight against poaching in East Africa.",
            chapters: [
                { title: "Chapter 1: Giants of Memory", text: "An elephant never forgets—a phrase rooted in truth. These matriarchs carry maps of ancient waterholes in their minds, passed from mother to daughter across generations. Their trunks, capable of detecting the footsteps of a friend miles away, are both tools and hands, caressing a calf or toppling a tree with equal grace." },
                { title: "Chapter 2: The Tusk War", text: "Ivory has been a curse. In the 1970s and 80s, poachers slaughtered half of Africa's elephants. Today, guarded sanctuaries and brave rangers fight a different war—one of education, technology, and community. Where elephants thrive, ecosystems flourish; where they vanish, the land grows silent." },
                { title: "Chapter 3: Sanctuary", text: "In Amboseli, researchers have named every elephant. They celebrate births, mourn deaths, and track lineages. Tourists come not to gawk but to bear witness, their entry fees funding the very survival of the herds. Here, the ivory ghosts are becoming spirits of hope." }
            ]
        },
        {
            id: 4,
            title: "Rainforest Guardians",
            author: "Prof. David Kimani",
            image: "../assets/images/Monkey.png",
            pages: 290,
            published: "2023",
            chapter: "Exploring the Congo Basin's rich biodiversity and defenders.",
            chapters: [
                { title: "Chapter 1: Canopy Secrets", text: "High above the Congo basin, where light filters through a mosaic of leaves, lives a world unknown to those below. Colobus monkeys leap between branches, their white tails flashing. Great blue turacos call from hidden perches. And in the shadows, forest elephants carve silent paths through the undergrowth." },
                { title: "Chapter 2: The Unseen Web", text: "Beneath the soil, mycorrhizal fungi connect trees in a vast neural network, sharing nutrients and warning of pests. This wood-wide web sustains the forest more than any single species. When a gorilla family moves through, they prune, plant, and fertilize, unknowingly tending the garden that sustains them." },
                { title: "Chapter 3: Vanishing", text: "Every minute, an area of African rainforest the size of thirty football fields disappears. Logging, mining, and agriculture consume what took millennia to grow. But in community forests, where locals own the land and the profit, the cutting stops. The guardians are rising." }
            ]
        },
        {
            id: 5,
            title: "Wings Over Africa",
            author: "Sarah Odhiambo",
            image: "../assets/images/Eagle.png",
            pages: 222,
            published: "2025",
            chapter: "A journey through Africa's diverse bird species and migrations.",
            chapters: [
                { title: "Chapter 1: Sky Nomads", text: "The African fish eagle, wings spread like a herald's banner, glides above the great lakes. Below, flamingos paint the water pink. Secretary birds stride through the grass, stamping on snakes with surgical precision. Africa's skies are not empty—they are highways of migration, spanning continents." },
                { title: "Chapter 2: The Vulture's Bargain", text: "Misunderstood and maligned, vultures are the sanitation crew of the savannah. A single flock can reduce a carcass to bones in hours, preventing disease. When vulture populations crash due to poisoning, rabies and anthrax spike. They are ugly, perhaps, but utterly irreplaceable." },
                { title: "Chapter 3: Songlines", text: "From the lilac-breasted roller's rainbow flash to the bee-eater's iridescent dart, African birds are color made flesh. In the miombo woodlands, the dawn chorus is a symphony of a hundred species, each note a territorial claim, a love song, or a warning. To know Africa, one must listen to its wings." }
            ]
        }
    ];

    // --- Category Filter/Search ---
    const categoryGrid = document.getElementById('categoryGrid');
    const categorySearch = document.getElementById('categorySearch');
    const statusFilter = document.getElementById('statusFilter');
    let allCategoryCards = [];

    // --- Scanned Species Collapsible Section ---
    const scannedSection = document.getElementById('scannedSection');
    const scannedContainer = document.getElementById('scannedLibraryContainer');
    const toggleScannedBtn = document.getElementById('toggleScanned');
    const scanSearch = document.getElementById('scanSearch');
    const scanStatusFilter = document.getElementById('scanStatusFilter');

    let scannedCollapsed = true;

    // Initialize scanned section as collapsed
    if (scannedSection) {
        scannedSection.classList.add('collapsed');
    }
    if (toggleScannedBtn) {
        toggleScannedBtn.setAttribute('aria-expanded', 'false');
    }

    // Toggle scanned section
    if (toggleScannedBtn) {
        toggleScannedBtn.addEventListener('click', () => {
            scannedCollapsed = !scannedCollapsed;
            if (scannedSection) {
                scannedSection.classList.toggle('collapsed', scannedCollapsed);
            }
            if (toggleScannedBtn) {
                toggleScannedBtn.setAttribute('aria-expanded', !scannedCollapsed);
            }
        });
    }

    // --- Category Filter/Search ---
    if (categoryGrid) {
        allCategoryCards = Array.from(categoryGrid.querySelectorAll('.card[data-category]'));
        
        if (categorySearch) {
            categorySearch.addEventListener('input', filterCategories);
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', filterCategories);
        }
        filterCategories();
    }

    function filterCategories() {
        const searchTerm = categorySearch ? categorySearch.value.toLowerCase() : '';
        const status = statusFilter ? statusFilter.value : '';
        
        allCategoryCards.forEach(card => {
            const name = (card.getAttribute('data-name') || '').toLowerCase();
            const category = (card.getAttribute('data-category') || '').toLowerCase();
            const matchesSearch = searchTerm === '' || name.includes(searchTerm) || category.includes(searchTerm);
            const matchesStatus = status === '' || card.getAttribute('data-status') === status;
            
            if (matchesSearch && matchesStatus) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // --- Scan Filter/Search ---
    if (scanSearch) {
        scanSearch.addEventListener('input', filterScans);
    }
    if (scanStatusFilter) {
        scanStatusFilter.addEventListener('change', filterScans);
    }

    function filterScans() {
        const searchTerm = scanSearch ? scanSearch.value.toLowerCase() : '';
        const status = scanStatusFilter ? scanStatusFilter.value : '';
        
        const scanCards = scannedContainer ? scannedContainer.querySelectorAll('.wildlife-card, .scan-card') : [];
        scanCards.forEach(card => {
            const name = (card.querySelector('h2, h3, h4')?.textContent || '').toLowerCase();
            const cardStatus = card.getAttribute('data-status') || '';
            const matchesSearch = searchTerm === '' || name.includes(searchTerm);
            const matchesStatus = status === '' || cardStatus === status;
            
            if (matchesSearch && matchesStatus) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // --- Render Books ---
    const booksGrid = document.getElementById('booksGrid');
    if (booksGrid) {
        books.forEach(book => {
            const el = document.createElement('div');
            el.className = 'lib-book';
            el.innerHTML = `
                <div class="lib-book-cover">
                    <div class="lib-book-top-edge"></div>
                    <div class="lib-book-pages"></div>
                    <div class="lib-book-front">
                        <img class="lib-book-cover-img" src="${book.image}" alt="${book.title}" loading="lazy">
                        <div class="lib-book-front-overlay"></div>
                        <h4>${book.title}</h4>
                        <span class="author">${book.author}</span>
                    </div>
                </div>
                <div class="lib-book-info">
                    <p class="lib-book-pages">${book.pages} pages &mdash; ${book.published}</p>
                    <p class="lib-book-desc">${book.chapter || book.desc}</p>
                </div>
                <div class="lib-book-actions">
                    <button data-read="${book.id}" class="btn btn--primary btn--sm">Read</button>
                    <button data-download="${book.id}" class="btn btn--secondary btn--sm"><i class="fas fa-download"></i> PDF</button>
                </div>
            `;
            booksGrid.appendChild(el);
        });

        // Events
        booksGrid.addEventListener('click', (e) => {
            const readId = e.target.dataset.read;
            const dlId = e.target.dataset.download;
            if (readId) openBook(parseInt(readId));
            if (dlId) downloadBook(parseInt(dlId));
        });
    }

    function openBook(id) {
        const book = books.find(b => b.id === id);
        if (!book) return;
        const modal = document.getElementById('bookModal');
        const modalContent = document.getElementById('bookModalContent');

        let html = `<h2>${book.title}</h2>
            <div class="author">by ${book.author}</div>`;
        book.chapters.forEach(ch => {
            html += `<div class="chapter">
                <h3>${ch.title}</h3>
                <p>${ch.text}</p>
            </div>`;
        });

        modalContent.innerHTML = html;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function downloadBook(id) {
        const book = books.find(b => b.id === id);
        if (!book) return;
        const blob = new Blob([buildBookPdf(book)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function buildBookPdf(book) {
        const esc = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        const wrap = (text, max) => {
            const words = String(text).split(/\s+/);
            const lines = [];
            let cur = '';
            for (const w of words) {
                const t = cur ? cur + ' ' + w : w;
                if (t.length > max && cur) { lines.push(cur); cur = w; }
                else cur = t;
            }
            if (cur) lines.push(cur);
            return lines;
        };

        const linesPerPage = 44;
        const contentLines = [book.title, `by ${book.author}`, ''];
        book.chapters.forEach(ch => {
            contentLines.push(ch.title, '');
            wrap(ch.text, 86).forEach(l => contentLines.push(l));
            contentLines.push('');
        });
        const pages = [];
        for (let i = 0; i < contentLines.length; i += linesPerPage) {
            pages.push(contentLines.slice(i, i + linesPerPage));
        }
        if (pages.length === 0) pages.push(['']);

        const N = pages.length;
        const pageObjs = pages.map((_, i) => 3 + i);
        const fontObj = 3 + N;
        const contentObjs = pages.map((_, i) => 4 + N + i);

        const objects = [null];
        objects.push('<< /Type /Catalog /Pages 2 0 R >>');
        objects.push(`<< /Type /Pages /Kids [${pageObjs.map(n => `${n} 0 R`).join(' ')}] /Count ${N} >>`);
        pages.forEach((pl, i) => {
            objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObjs[i]} 0 R >>`);
        });
        objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
        pages.forEach(pl => {
            let stream = 'BT /F1 12 Tf 72 720 Td 14 TL\n';
            pl.forEach(line => { stream += `(${esc(line)}) Tj T*\n`; });
            stream += 'ET';
            objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
        });

        let out = '%PDF-1.4\n';
        const offsets = [0];
        for (let i = 1; i < objects.length; i++) {
            offsets[i] = out.length;
            out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
        }
        const xrefStart = out.length;
        out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
        for (let i = 1; i < objects.length; i++) {
            out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
        }
        out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
        return out;
    }

    // --- Modal Close ---
    const modal = document.getElementById('bookModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.dataset.modalClose !== undefined || e.target.classList.contains('book-modal-backdrop')) {
                modal.hidden = true;
                document.body.style.overflow = '';
            }
        });
    }

    // --- Research Tools ---
    // Initialize research module if on library page
    if (document.getElementById('categoryGrid') || document.getElementById('booksGrid')) {
        window.WildGuardResearch = {
            // Perform research search and display results on page
            performResearch() {
                const query = document.getElementById('researchSearch')?.value?.trim();
                const resultsDiv = document.getElementById('researchResults');
                if (!query || query.length < 2) {
                    resultsDiv.innerHTML = '';
                    resultsDiv.style.display = 'none';
                    return;
                }
                
                // Show loading state
                resultsDiv.innerHTML = '<div class="research-result-card"><div class="spinner"></div></div>';
                resultsDiv.style.display = 'block';
                
                // Search using multiple APIs with timeout
                this.searchSpecies(query).then(speciesInfo => {
                    if (speciesInfo) {
                        console.log('Research found:', speciesInfo);
                        this.displayResults(resultsDiv, speciesInfo);
                    } else {
                        console.log('No iNaturalist match, trying Wikipedia fallback');
                        this.fallbackSearch(query, resultsDiv);
                    }
                }).catch(e => {
                    console.warn('Research search error:', e);
                    resultsDiv.innerHTML = '<div class="research-result-card"><p style="color:var(--muted);">Search error. Please try again.</p></div>';
                });
            },

            // Search using iNaturalist API
            async searchSpecies(query) {
                if (!query || query.length < 2) return null;
                try {
                    const encodedQuery = encodeURIComponent(query);
                    const url = "https://api.inaturalist.org/v1/taxa?q=" + encodedQuery +
                        "&per_page=5&visual_quality=true";
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 8000);
                    const resp = await fetch(url, { signal: controller.signal });
                    clearTimeout(timer);
                    
                    if (!resp.ok) {
                        console.warn("iNaturalist API returned status:", resp.status);
                        return null;
                    }
                    
                    const data = await resp.json();
                    if (!data || !data.results || !data.results.length) {
                        console.warn("iNaturalist: no results returned");
                        return null;
                    }
                    
                    console.log("iNaturalist results count:", data.results.length);
                    
                    // Find best match - prefer exact name match
                    const qNorm = query.toLowerCase().trim();
                    let best = null;
                    
                    for (const t of data.results) {
                        if (!t || !t.name) continue;
                        
                        const name = (t.name || '').toLowerCase();
                        const common = ((t.preferred_common_name) || '').toLowerCase();
                        const taxon_id = t.taxon_id;
                        
                        // 1. Exact name match (case-insensitive)
                        if (name === qNorm || common === qNorm) {
                            best = t;
                            console.log("iNaturalist: exact match found:", t.name);
                            break;
                        }
                        
                        // 2. Query matches first word of name
                        const firstWord = name.split(' ')[0];
                        if (firstWord && firstWord.startsWith(qNorm)) {
                            best = t;
                            console.log("iNaturalist: first word match:", t.name);
                            break;
                        }
                        
                        // 3. Contains query anywhere in name
                        if (name.includes(qNorm) || common.includes(qNorm)) {
                            if (!best) best = t; // Take first good match
                            console.log("iNaturalist: contains match:", t.name);
                        }
                    }
                    
                    if (!best) {
                        console.warn("iNaturalist: no good match found out of", data.results.length, "results");
                    }
                    
                    return best || null;
                } catch (e) {
                    console.error("iNaturalist search failed:", e);
                    return null;
                }
            },

            // Fallback: Wikipedia search
            async fallbackSearch(query, resultsDiv) {
                try {
                    const encodedQuery = encodeURIComponent(query);
                    const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodedQuery;
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 8000);
                    const resp = await fetch(url, { signal: controller.signal });
                    clearTimeout(timer);
                    
                    if (!resp.ok) {
                        // Try with just the first word
                        const firstWord = query.split(' ')[0];
                        if (firstWord && firstWord.length > 2) {
                            console.log("Wikipedia direct failed, trying first word:", firstWord);
                            return this.fallbackSearch(firstWord, resultsDiv);
                        }
                        resultsDiv.innerHTML = '<div class="research-result-card"><p style="color:var(--muted);">No results found. Try a scientific or common name.</p></div>';
                        return;
                    }
                    
                    const j = await resp.json();
                    if (!j || !j.extract) {
                        // Try with first word if full query fails
                        const firstWord = query.split(' ')[0];
                        if (firstWord && firstWord.length > 2) {
                            console.log("Wikipedia no extract, trying first word:", firstWord);
                            return this.fallbackSearch(firstWord, resultsDiv);
                        }
                        resultsDiv.innerHTML = '<div class="research-result-card"><p style="color:var(--muted);">No Wikipedia article found.</p></div>';
                        return;
                    }
                    
                    this.displayResults(resultsDiv, {
                        scientificName: query,
                        commonName: j.title,
                        extract: j.extract.slice(0, 400),
                        thumbnail: j.thumbnail ? j.thumbnail.source : "",
                        wikipedia_url: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page ? j.content_urls.desktop.page : ""
                    });
                } catch (e) {
                    console.error("Wikipedia search failed:", e);
                    resultsDiv.innerHTML = '<div class="research-result-card"><p style="color:var(--muted);">Search failed. Please try again.</p></div>';
                }
            },

            // Display research results on page
            displayResults(resultsDiv, speciesInfo) {
                let url = 'https://www.google.com/search?q=' + encodeURIComponent(speciesInfo.commonName || speciesInfo.scientificName || '');
                if (speciesInfo.wikipedia_url) url += '&site=wikipedia';
                if (speciesInfo.inaturalistId) url += '&species=' + speciesInfo.inaturalistId;
                
                let html = `
                    <div class="research-result-card">
                        ${speciesInfo.thumbnail ? `<div class="research-thumbnail"><img src="${speciesInfo.thumbnail}" alt="${speciesInfo.commonName}" loading="lazy"></div>` : ''}
                        <div class="research-info">
                            <h3>${speciesInfo.commonName || speciesInfo.scientificName}</h3>
                            <p>${speciesInfo.extract || ''}</p>
                            <div class="research-tags">
                                ${speciesInfo.conservationStatus ? `<span class="tag">${speciesInfo.conservationStatus}</span>` : ''}
                            </div>
                            <a href="${url}" target="_blank" class="btn btn--secondary btn--sm" style="margin-top:0.5rem;width:auto;padding:0.5rem 0.8rem;font-size:0.78rem;">View on Google →</a>
                        </div>
                    </div>`;
                resultsDiv.innerHTML = html;
                resultsDiv.style.display = 'block';
            },

            // ... rest of existing WildGuardResearch methods stay the same
            // iNaturalist API - no key required for search
            async searchSpecies(query) {
                if (!query || query.length < 2) return null;
                try {
                    const url = "https://api.inaturalist.org/v1/taxa?q=" + encodeURIComponent(query) +
                        "&per_page=5&visual_quality=true";
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 8000);
                    const resp = await fetch(url, { signal: controller.signal });
                    clearTimeout(timer);
                    if (!resp.ok) return null;
                    const data = await resp.json();
                    if (!data || !data.results || !data.results.length) return null;
                    
                    // Find best match - prefer exact name match
                    const qNorm = query.toLowerCase().trim();
                    let best = null;
                    for (const t of data.results) {
                        if (!t || !t.name) continue;
                        const name = t.name.toLowerCase();
                        const common = (t.preferred_common_name || '').toLowerCase();
                        
                        // Exact name match preferred
                        if (name === qNorm || common === qNorm) {
                            best = t;
                            break;
                        }
                        // Starts with query (whole word)
                        const re = new RegExp("^(" + qNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ")\\b");
                        if (re.test(name) || re.test(common)) {
                            if (!best) best = t; // Take first good match
                        }
                    }
                    return best || null;
                } catch (e) {
                    console.warn("iNaturalist search failed:", e);
                    return null;
                }
            },

            // GBIF API - species matching
            async matchSpecies(query) {
                if (!query || query.length < 2) return null;
                try {
                    const url = "https://api.gbif.org/v1/species/match?name=" + encodeURIComponent(query);
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 8000);
                    const resp = await fetch(url, { signal: controller.signal });
                    clearTimeout(timer);
                    if (!resp.ok) return null;
                    const data = await resp.json();
                    if (!data || !data.speciesKey) return null;
                    return {
                        usageKey: data.speciesKey,
                        scientificName: data.scientificName || query,
                        matchType: data.matchType || "",
                        confidence: data.confidence || 0,
                        status: data.status || ""
                    };
                } catch (e) {
                    console.warn("GBIF match failed:", e);
                    return null;
                }
            },

            // Wikipedia API - species summary
            async getWikipediaSummary(query) {
                if (!query) return null;
                try {
                    const candidates = [query, query.split(/\s+/)[0]];
                    for (const c of candidates) {
                        if (!c) continue;
                        const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(c);
                        const controller = new AbortController();
                        const timer = setTimeout(() => controller.abort(), 8000);
                        const resp = await fetch(url, { signal: controller.signal });
                        clearTimeout(timer);
                        if (!resp.ok) continue;
                        const j = await resp.json();
                        if (j && j.extract && !j.type) {
                            return {
                                title: j.title || c,
                                extract: j.extract ? j.extract.slice(0, 500) : "",
                                thumbnail: j.thumbnail ? j.thumbnail.source : "",
                                url: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page ? j.content_urls.desktop.page : ""
                            };
                        }
                    }
                    return null;
                } catch (e) {
                    console.warn("Wikipedia summary failed:", e);
                    return null;
                }
            },

            // Open-Meteo - geographic/weather context
            async getGeographicContext(lat, lng) {
                if (!lat || !lng) return null;
                try {
                    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng +
                        "&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=auto";
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 8000);
                    const resp = await fetch(url, { signal: controller.signal });
                    clearTimeout(timer);
                    if (!resp.ok) return null;
                    const j = await resp.json();
                    const cur = j && j.current;
                    if (!cur) return null;
                    return {
                        temperature: cur.temperature_2m,
                        weather: this.weatherLabel(cur.weather_code),
                        windKmh: cur.wind_speed_10m,
                        isDay: cur.is_day === 1
                    };
                } catch (e) {
                    console.warn("Geographic context failed:", e);
                    return null;
                }
            },

            weatherLabel(code) {
                const map = {
                    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                    45: "Fog", 48: "Depositing rime fog",
                    51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
                    61: "Slight rain", 63: "Rain", 65: "Heavy rain",
                    71: "Slight snow", 73: "Snow", 75: "Heavy snow",
                    80: "Slight showers", 81: "Showers", 82: "Violent showers",
                    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm with hail"
                };
                return map[code] || "Variable conditions";
            },

            // Get conservation status from IUCN
            async getConservationStatus(scientificName) {
                if (!scientificName) return null;
                try {
                    // Use iNaturalist's conservation status
                    const url = "https://api.inaturalist.org/v1/taxa?q=" + encodeURIComponent(scientificName) +
                        "&per_page=1";
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 8000);
                    const resp = await fetch(url, { signal: controller.signal });
                    clearTimeout(timer);
                    if (!resp.ok) return null;
                    const data = await resp.json();
                    if (!data || !data.results || !data.results.length) return null;
                    const t = data.results[0];
                    const cs = t.conservation_status;
                    if (!cs) return null;
                    const raw = (cs.status_name || cs.status || "").toString();
                    const statusMap = {
                        /critically endangered/i: "Critically Endangered",
                        /endangered/i: "Endangered",
                        /vulnerable/i: "Vulnerable",
                        /near threatened/i: "Near Threatened",
                        /least concern/i: "Least Concern",
                        /data deficient/i: "Data Deficient"
                    };
                    for (const [regex, label] of Object.entries(statusMap)) {
                        if (regex.test(raw)) return {
                            status: label,
                            iucn: cs.status_name || cs.status || ""
                        };
                    }
                    return { status: "Data Deficient", iucn: cs.status_name || cs.status || "" };
                } catch (e) {
                    console.warn("Conservation status failed:", e);
                    return null;
                }
            },

            // Open a new tab with research results
            openResearchTab(speciesInfo) {
                if (!speciesInfo) return;
                const features = [
                    'resizable',
                    'scrollbars=yes',
                    'width=900',
                    'height=700'
                ].join(',');
                
                let url = 'https://www.google.com/search?q=' + encodeURIComponent(speciesInfo.commonName || speciesInfo.scientificName || '');
                
                // Add more specific searches based on available data
                if (speciesInfo.wikipedia_url) {
                    url += '&site=wikipedia';
                }
                if (speciesInfo.inaturalistId) {
                    url += '&species=' + speciesInfo.inaturalistId;
                }
                
                window.open(url, '_blank', features);
            }
        };
    }

});