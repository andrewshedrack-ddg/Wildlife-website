document.addEventListener('DOMContentLoaded', () => {
  const yearNode = document.querySelector('[data-current-year]');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  const forms = document.querySelectorAll('form.contact-form, form.admin-form');
  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = 'Sent';
      }

      const existingNotice = form.querySelector('.form-note');
      if (existingNotice) {
        existingNotice.remove();
      }

      const notice = document.createElement('div');
      notice.className = 'form-note';
      notice.textContent = 'Your message is ready for review. Connect this form to a backend when you are ready to publish.';
      form.appendChild(notice);

      event.preventDefault();
    });
  });

  const revealTargets = document.querySelectorAll('.feature-card, .species-card, .info-card, .stat-card, .contact-panel, .scan-panel, .form-shell, .table-shell, .spotlight-panel');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.transform = 'translateY(0)';
          entry.target.style.opacity = '1';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealTargets.forEach((target) => {
      target.style.opacity = '0';
      target.style.transform = 'translateY(14px)';
      target.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      observer.observe(target);
    });
  });

  // Mock data for fallback
  const mockWildlife = [
    {name: 'African Lion', habitat: 'Savannah', fact: 'Lions are the only cats that live in groups called prides.', img: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Lion_%28Panthera_leo%29_male_6y.jpg'},
    {name: 'African Elephant', habitat: 'Savanna & Forest', fact: 'Elephants have the longest pregnancy of any land animal—about 22 months.', img: 'https://upload.wikimedia.org/wikipedia/commons/3/37/African_Bush_Elephant.jpg'},
    {name: 'Leopard', habitat: 'Savanna & Forest', fact: 'Leopards are the most elusive of the Big 5 and are excellent climbers.', img: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Leopard_in_Serengeti_National_Park.jpg'},
    {name: 'Black Rhinoceros', habitat: 'Grasslands & Savannah', fact: 'Black rhinos have a hooked upper lip, unlike the square lip of white rhinos.', img: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Black_rhino.jpg'},
    {name: 'African Buffalo', habitat: 'Floodplains & Savannah', fact: 'African buffaloes are known for their unpredictable nature and are considered dangerous.', img: 'https://upload.wikimedia.org/wikipedia/commons/5/59/African_Buffalo.jpg'}
  ];

  // Mock data for Parks and Reserves (replacing Team section)
  const mockParks = [
    {name: "Serengeti National Park", role: "National Park", bio: "Tanzania's oldest and most famous national park, renowned for the annual Great Migration of over 1.5 million wildebeest and 250,000 zebras. Home to the Big Five and diverse ecosystems.", img: "https://upload.wikimedia.org/wikipedia/commons/5/55/Serengeti_National_Park_%28Tanzania%29.jpg"},
    {name: "Ngorongoro Conservation Area", role: "Conservation Area", bio: "Features the world's largest inactive volcanic caldera, the Ngorongoro Crater, which hosts a dense population of wildlife including lions, elephants, and rhinos. A UNESCO World Heritage Site.", img: "https://upload.wikimedia.org/wikipedia/commons/0/03/Ngorongoro_Crater%2C_Tanzania.jpg"},
    {name: "Selous Game Reserve", role: "Game Reserve", bio: "One of the largest faunal reserves in the world, located in southern Tanzania. Known for its populations of elephants, hippos, African wild dogs, and crocodiles along the Rufiji River.", img: "https://upload.wikimedia.org/wikipedia/commons/3/35/Selous_Game_Reserve_Tanzania.jpg"},
    {name: "Tarangire National Park", role: "National Park", bio: "Famous for its high density of elephants and baobab trees. The park offers spectacular wildlife viewing during the dry season when animals congregate along the Tarangire River.", img: "https://upload.wikimedia.org/wikipedia/commons/7/73/Tarangire_National_Park_%28Tanzania%29.jpg"}
  ];

  // Mock data for Conservation Efforts
  const mockConservation = [
    {name: "Anti-Poaching Patrols", role: "Conservation Effort", bio: "Ranger patrols monitor protected areas 24/7 to prevent illegal hunting and protect wildlife from poachers.", img: "https://via.placeholder.com/300x200?text=Anti-Poaching+Patrols"},
    {name: "Community Education", role: "Conservation Effort", bio: "Educational programs teach local communities about wildlife conservation and sustainable coexistence with nature.", img: "https://via.placeholder.com/300x200?text=Community+Education"},
    {name: "Habitat Restoration", role: "Conservation Effort", bio: "Efforts to restore degraded habitats, replant native vegetation, and protect water sources for wildlife.", img: "https://via.placeholder.com/300x200?text=Habitat+Restoration"}
  ];

  // Mock data for How You Can Help
  const mockHelp = [
    {name: "Donate", role: "Support Option", bio: "Your donations fund critical conservation work, including anti-poaching units and community outreach programs.", img: "https://via.placeholder.com/300x200?text=Donate"},
    {name: "Volunteer", role: "Support Option", bio: "Join our volunteer programs to assist with wildlife monitoring, data collection, and community projects.", img: "https://via.placeholder.com/300x200?text=Volunteer"},
    {name: "Spread Awareness", role: "Support Option", bio: "Share information about wildlife conservation on social media and with friends to amplify our impact.", img: "https://via.placeholder.com/300x200?text=Spread+Awareness"}
  ];

  async function loadWildlife() {
    try {
      const resp = await fetch('/api/wildlife');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const grid = document.getElementById('wildlife-grid');
      grid.innerHTML = data.map(item => `
        <div class='glass-card'>
          <img src='${item.img}' alt='${item.name}' class='wildlife-img' onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
          <h3>${item.name}</h3>
          <p><strong>Habitat:</strong> ${item.habitat}</p>
          <p><strong>Fact:</strong> ${item.fact}</p>
        </div>
      `).join('');
    } catch (e) {
      console.warn('Using mock wildlife data:', e);
      const grid = document.getElementById('wildlife-grid');
      grid.innerHTML = mockWildlife.map(item => `
        <div class='glass-card'>
          <img src='${item.img}' alt='${item.name}' class='wildlife-img' onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
          <h3>${item.name}</h3>
          <p><strong>Habitat:</strong> ${item.habitat}</p>
          <p><strong>Fact:</strong> ${item.fact}</p>
        </div>
      `).join('');
    }
  }

  async function loadParks() {
    try {
      const resp = await fetch('/api/parks');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const grid = document.getElementById('parks-grid');
      grid.innerHTML = data.map(park => `
        <div class='glass-card'>
          <img src='${park.img}' alt='${park.name}' class='wildlife-img' onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
          <h3>${park.name}</h3>
          <p><strong>Type:</strong> ${park.role}</p>
          <p>${park.bio}</p>
        </div>
      `).join('');
    } catch (e) {
      console.warn('Using mock parks data:', e);
      const grid = document.getElementById('parks-grid');
      grid.innerHTML = mockParks.map(park => `
        <div class='glass-card'>
          <img src='${park.img}' alt='${park.name}' class='wildlife-img' onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
          <h3>${park.name}</h3>
          <p><strong>Type:</strong> ${park.role}</p>
          <p>${park.bio}</p>
        </div>
      `).join('');
    }
  }

  async function loadConservation() {
    try {
      const resp = await fetch('/api/conservation');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const grid = document.getElementById('conservation-grid');
      grid.innerHTML = data.map(item => `
        <div class='glass-card'>
          <img src='${item.img}' alt='${item.name}' class='wildlife-img' onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
          <h3>${item.name}</h3>
          <p>${item.role}</p>
          <p>${item.bio}</p>
        </div>
      `).join('');
    } catch (e) {
      console.warn('Using mock conservation data:', e);
      const grid = document.getElementById('conservation-grid');
      grid.innerHTML = mockConservation.map(item => `
        <div class='glass-card'>
          <img src='${item.img}' alt='${item.name}' class='wildlife-img' onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
          <h3>${item.name}</h3>
          <p>${item.role}</p>
          <p>${item.bio}</p>
        </div>
      `).join('');
    }
  }

  async function loadHelp() {
    try {
      const resp = await fetch('/api/help');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const grid = document.getElementById('help-grid');
      grid.innerHTML = data.map(item => `
        <div class='glass-card'>
          <img src='${item.img}' alt='${item.name}' class='wildlife-img' onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
          <h3>${item.name}</h3>
          <p>${item.role}</p>
          <p>${item.bio}</p>
        </div>
      `).join('');
    } catch (e) {
      console.warn('Using mock help data:', e);
      const grid = document.getElementById('help-grid');
      grid.innerHTML = mockHelp.map(item => `
        <div class='glass-card'>
          <img src='${item.img}' alt='${item.name}' class='wildlife-img' onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
          <h3>${item.name}</h3>
          <p>${item.role}</p>
          <p>${item.bio}</p>
        </div>
      `).join('');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadWildlife();
    loadParks();
    loadConservation();
    loadHelp();
  });

  // Hero slideshow functionality is handled by CSS and the hero section elements above.
  // The body background is set in style.css using background.png and shows through the sections.
});