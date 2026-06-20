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
});
