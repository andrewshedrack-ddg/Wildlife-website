// library.js - spacious library with real digital books

document.addEventListener('DOMContentLoaded', () => {
    // --- Book Content ---
    const books = [
        {
            id: 1,
            title: "Kings of the Savannah",
            author: "Dr. Selene Mwangi",
            color: "#1b5e40",
            icon: "fas fa-crown",
            chapters: [
                { title: "Chapter 1: The Pride", text: "Under the golden embrace of the African sun, the lion stands as the undisputed sovereign of the savannah. Their roars, echoing across the plains, are not mere sounds but declarations of territory, warnings to rivals, and reunions of pride members. A lion's mane, flowing like a crown of fire, speaks volumes about its health, genetics, and social standing among the pride." },
                { title: "Chapter 2: The Hunt", text: "When dusk falls, the lionesses emerge. Working in silent synchrony, they flank herds of wildebeest and zebra. The hunt is not a solitary affairâ€”it is ballet of patience, timing, and explosive power. One in four hunts succeeds, yet this is enough to sustain the pride and shape the ecosystem, as lions cull the weak and maintain the balance of the savannah." },
                { title: "Chapter 3: Legacy", text: "A male lion's reign lasts but a few short years. Defeated by younger rivals, he retreats to the shadows, his legacy carried on by the cubs he sired. Yet within the pride, his genes persist, and the cycle of the savannah continues, painted in gold and shadow." }
            ]
        },
        {
            id: 2,
            title: "The Great Crossing",
            author: "John Okello",
            color: "#0ea5e9",
            icon: "fas fa-water",
            chapters: [
                { title: "Chapter 1: The Signal", text: "The rains arrive like a drumroll across the Serengeti. From the southern plains, a pulse beginsâ€”the great migration. Over two million wildebeest, zebra, and gazelels answer an ancient call, driven by the rhythm of the seasons and the promise of green pastures." },
                { title: "Chapter 2: River of Shadows", text: "The Grumeti and Mara rivers lie in their path. Beneath the murky waters, Nile crocodiles, some over fifteen feet long, wait in prehistoric patience. The crossing is chaos: hooves thunder, currents sweep away the young and weak, and the air fills with dust and desperation." },
                { title: "Chapter 3: Circle Unbroken", text: "Those who reach the northern Serengeti find renewal. Calves are born on these rich lands. But the rains will shift again, and the great column will turn south, completing a cycle that has turned for millennia, a living pulse that sustains Africa's heart." }
            ]
        },
        {
            id: 3,
            title: "Ivory Ghosts",
            author: "Dr. Amina Khoury",
            color: "#78350f",
            icon: "fas fa-elephant",
            chapters: [
                { title: "Chapter 1: Giants of Memory", text: "An elephant never forgetsâ€”a phrase rooted in truth. These matriarchs carry maps of ancient waterholes in their minds, passed from mother to daughter across generations. Their trunks, capable of detecting the footsteps of a friend miles away, are both tools and hands, caressing a calf or toppling a tree with equal grace." },
                { title: "Chapter 2: The Tusk War", text: "Ivory has been a curse. In the 1970s and 80s, poachers slaughtered half of Africa's elephants. Today, guarded sanctuaries and brave rangers fight a different warâ€”one of education, technology, and community. Where elephants thrive, ecosystems flourish; where they vanish, the land grows silent." },
                { title: "Chapter 3: Sanctuary", text: "In Amboseli, researchers have named every elephant. They celebrate births, mourn deaths, and track lineages. Tourists come not to gawk but to bear witness, their entry fees funding the very survival of the herds. Here, the ivory ghosts are becoming spirits of hope." }
            ]
        },
        {
            id: 4,
            title: "Rainforest Guardians",
            author: "Prof. David Kimani",
            color: "#047857",
            icon: "fas fa-tree",
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
            color: "#b45309",
            icon: "fas fa-feather",
            chapters: [
                { title: "Chapter 1: Sky Nomads", text: "The African fish eagle, wings spread like a herald's banner, glides above the great lakes. Below, flamingos paint the water pink. Secretary birds stride through the grass, stamping on snakes with surgical precision. Africa's skies are not emptyâ€”they are highways of migration, spanning continents." },
                { title: "Chapter 2: The Vulture's Bargain", text: "Misunderstood and maligned, vultures are the sanitation crew of the savannah. A single flock can reduce a carcass to bones in hours, preventing disease. When vulture populations crash due to poisoning, rabies and anthrax spike. They are ugly, perhaps, but utterly irreplaceable." },
                { title: "Chapter 3: Songlines", text: "From the lilac-breasted roller's rainbow flash to the bee-eater's iridescent dart, African birds are color made flesh. In the miombo woodlands, the dawn chorus is a symphony of a hundred species, each note a territorial claim, a love song, or a warning. To know Africa, one must listen to its wings." }
            ]
        }
    ];

    // --- Render Books ---
    const booksGrid = document.getElementById('booksGrid');
    if (booksGrid) {
        books.forEach(book => {
            const el = document.createElement('div');
            el.className = 'lib-book';
            el.innerHTML = `
                <div class="lib-book-cover" style="background: linear-gradient(135deg, ${book.color} 0%, ${darken(book.color, 40)} 100%);">
                    <div class="lib-book-pages"></div>
                    <div class="lib-book-front">
                        <i class="${book.icon}"></i>
                        <h4>${book.title}</h4>
                        <span class="author">${book.author}</span>
                    </div>
                </div>
                <div class="lib-book-actions">
                    <button data-read="${book.id}">Read</button>
                    <button data-download="${book.id}">Download</button>
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
        const content = document.getElementById('bookModalContent');

        let html = `<h2>${book.title}</h2>
            <div class="author">by ${book.author}</div>`;
        book.chapters.forEach(ch => {
            html += `<div class="chapter">
                <h3>${ch.title}</h3>
                <p>${ch.text}</p>
            </div>`;
        });

        content.innerHTML = html;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function downloadBook(id) {
        const book = books.find(b => b.id === id);
        if (!book) return;
        let text = `${book.title}\nby ${book.author}\n\n`;
        book.chapters.forEach(ch => {
            text += `${ch.title}\n${ch.text}\n\n`;
        });
        text += `---\nPublished by WildGuard Society\nFor educational purposes.`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
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

    // --- Darken Helper ---
    function darken(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - percent);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
        const b = Math.max(0, (num & 0x0000FF) - percent);
        return `rgb(${r},${g},${b})`;
    }
});