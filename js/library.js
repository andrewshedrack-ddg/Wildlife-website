// library.js for WildGuard Explorer Library Page
// Handles biome filtering, IUCN status badges, and search filtering

document.addEventListener('DOMContentLoaded', () => {
    // Existing folder toggling code (kept for compatibility)
    document.querySelectorAll('.folder').forEach((folder) => {
        folder.setAttribute('tabindex', '0');

        const toggle = () => {
            folder.classList.toggle('expanded');
        };

        folder.addEventListener('mouseenter', toggle);
        folder.addEventListener('mouseleave', toggle);
        folder.addEventListener('click', toggle);
        folder.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle();
            }
        });
    });

    // ==== Biome and IUCN enhancements ====

    // 1. Set data-biome on each wildlife card based on a simple mapping
    const biomeMap = {
        // Mammals
        'african elephant': 'savanna',
        'lion': 'savanna',
        'leopard': 'savanna',
        'reticulated giraffe': 'savanna',
        'african buffalo': 'savanna',
        'black rhinoceros': 'savanna',
        'cheetah': 'savanna',
        'hippopotamus': 'wetland',
        'nile crocodile': 'wetland',
        'african bullfrog': 'wetland',
        // Birds
        'secretarybird': 'savanna',
        'african fish eagle': 'wetland',
        'lilac-breasted roller': 'savanna',
        'greater flamingo': 'wetland',
        'ostrich': 'savanna',
        // Reptiles & Amphibians
        'african rock python': 'savanna',
        'puff adder': 'savanna',
        'nile monitor': 'wetland',
        'chameleon': 'forest',
        'african spurred tortoise': 'savanna',
        // Aquatic Life
        'nile tilapia': 'wetland',
        'nile perch': 'wetland',
        // Add more as needed
    };

    document.querySelectorAll('.wildlife-card').forEach(card => {
        const titleEl = card.querySelector('h3');
        if (!titleEl) return;
        const title = titleEl.textContent.trim().toLowerCase();
        let biome = 'savanna'; // default
        if (biomeMap[title]) {
            biome = biomeMap[title];
        }
        // You could also refine based on habitat text if needed
        card.setAttribute('data-biome', biome);
    });

    // 2. Replace brief paragraphs with IUCN status badges
    document.querySelectorAll('.wildlife-card .brief').forEach(briefEl => {
        const statusText = briefEl.textContent.trim();
        // Convert status text to a class key
        let statusKey = statusText.toLowerCase().replace(/ /g, '-');
        // Handle special cases
        if (statusKey === 'critically-endangered') { statusKey = 'critically-endangered'; }
        else if (statusKey === 'endangered') { statusKey = 'endangered'; }
        else if (statusKey === 'vulnerable') { statusKey = 'vulnerable'; }
        else if (statusKey === 'near-threatened') { statusKey = 'near-threatened'; }
        else if (statusKey === 'least-concern') { statusKey = 'least-concern'; }
        else if (statusKey === 'data-deficient') { statusKey = 'data-deficient'; }
        else if (statusKey === 'not-evaluated') { statusKey = 'not-evaluated'; }
        else {
            statusKey = 'least-concern'; // fallback
        }
        const badge = document.createElement('span');
        badge.className = `status-badge status--${statusKey}`;
        badge.textContent = statusText;
        briefEl.parentNode.replaceChild(badge, briefEl);
    });

    // 3. Biome filter event listener
    const biomeSelect = document.getElementById('biomeSelect');
    if (biomeSelect) {
        biomeSelect.addEventListener('change', () => {
            filterCards();
        });
    }

    // 4. Search input event listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterCards();
        });
    }

    // Filter function: show cards that match search query and selected biome
    function filterCards() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedBiome = biomeSelect ? biomeSelect.value : 'all';

        document.querySelectorAll('.wildlife-card').forEach(card => {
            const titleEl = card.querySelector('h3');
            const title = titleEl ? titleEl.textContent.trim().toLowerCase() : '';
            const biome = card.getAttribute('data-biome') || 'savanna';

            const matchesSearch = title.includes(query);
            const matchesBiome = (selectedBiome === 'all') || (biome === selectedBiome);

            if (matchesSearch && matchesBiome) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // === Compact Card Expansion ===
    document.querySelectorAll('.wildlife-card').forEach((card) => {
        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-card-btn';
        expandBtn.textContent = 'Read More';
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.toggle('expanded');
            expandBtn.textContent = card.classList.contains('expanded') ? 'Read Less' : 'Read More';
        });
        // Append button after the full-details div or at the end of card info
        const info = card.querySelector('.wildlife-info') || card;
        info.appendChild(expandBtn);
    });

    // === Books & Resources ===
    const books = [
        {
            id: 1,
            title: "African Wildlife Conservation Guide",
            author: "Dr. Jane Mbatha",
            desc: "Comprehensive guide to African wildlife conservation techniques, case studies, and best practices for protecting endangered species.",
            color: "#1b5e40"
        },
        {
            id: 2,
            title: "Safari Photography Essentials",
            author: "John Mwangi",
            desc: "Master the art of wildlife photography with tips on equipment, composition, and ethics of capturing animals in their natural habitat.",
            color: "#0ea5e9"
        },
        {
            id: 3,
            title: "Big Cats of Africa",
            author: "Sarah Odhiambo",
            desc: "An in-depth study of lions, leopards, and cheetahs—their behavior, habitats, and the threats they face in the modern world.",
            color: "#f59e0b"
        },
        {
            id: 4,
            title: "Marine Life of the Indian Ocean",
            author: "Prof. David Kimani",
            desc: "Explore the rich marine biodiversity along the East African coast, from coral reefs to deep-sea creatures.",
            color: "#0d9488"
        },
        {
            id: 5,
            title: "Birds of East Africa",
            author: "Alice Wanjiku",
            desc: "A detailed field guide to over 500 bird species found in East Africa, with illustrations and conservation status.",
            color: "#84cc16"
        }
    ];

    const booksGrid = document.getElementById('booksGrid');
    if (booksGrid) {
        books.forEach((book) => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML =
                '<div class="book-cover" style="background:' + book.color + '20;"><i class="fas fa-book" style="color:' + book.color + ';"></i></div>' +
                '<h4>' + book.title + '</h4>' +
                '<div class="author">by ' + book.author + '</div>' +
                '<div class="desc">' + book.desc + '</div>' +
                '<button class="btn-download" data-book-id="' + book.id + '"><i class="fas fa-download"></i> Download</button>';
            booksGrid.appendChild(card);
        });

        booksGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-download')) {
                const id = parseInt(e.target.getAttribute('data-book-id'));
                downloadBook(id);
            }
        });
    }

    function downloadBook(bookId) {
        const book = books.find(b => b.id === bookId);
        if (!book) return;
        const content = 'Title: ' + book.title + '\nAuthor: ' + book.author + '\n\n' + book.desc + '\n\n---\nThis is a sample book from WildGuard Society Library.\nFor educational purposes only.';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = book.title.replace(/\s+/g, '_') + '.txt';
        a.click();
        URL.revokeObjectURL(url);
    }
});
