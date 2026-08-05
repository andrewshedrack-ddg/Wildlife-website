# WildGuard Society

> **A youth-led environmental conservation movement** — Protect Nature, Protect Life.

WildGuard Society brings together young people to understand environmental changes and take meaningful action for a healthier planet, using technology, education, and community action.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/<your-org>/Wildlife-website.git
cd Wildlife-website

# 2. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\activate        # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment
cp .env.example .env
# Edit .env with your values (generate secret keys)

# 5. Run
python app.py
# → http://localhost:5000
```

For **frontend-only development** (static files, no backend):
```bash
python -m http.server 8000       # or any static server: npx serve .
# → http://localhost:8000
```

---

## Project Structure

```
Wildlife-website/
├── index.html                  # Homepage — hero, stats, wildlife cards, parks, conservation
├── about.html                  # Mission, vision, impact statistics
├── contact.html                # Contact form + staff portal
├── scan.html                   # AI species scan simulation
├── login.html                  # User login
├── register.html               # User registration
├── admin-login.html            # Admin login
├── admin.html                  # Admin dashboard

├── library/
│   ├── library.html            # Wildlife library — categories, filter, search
│   ├── mammals.html            # Category-specific pages
│   ├── birds.html
│   ├── reptiles.html
│   ├── amphibians.html
│   ├── aquatic.html
│   ├── plants.html
│   ├── fungi.html
│   ├── bacteria.html
│   └── viruses.html

├── user/
│   ├── Profile.html            # User profile with avatar and settings
│   ├── History.html            # Scan history with timeline
│   └── Favourite.html          # Bookmarked species

├── admin/
│   ├── Dashboard.html          # Admin dashboard
│   ├── manage-animals.html     # Species CRUD
│   └── upload.html             # Species upload form

├── css/
│   ├── tokens.css              # Design tokens (colors, typography, spacing)
│   ├── animations.css          # Keyframe animations
│   ├── layout.css              # Grid, container, section, responsive
│   ├── components.css          # Buttons, cards, forms, badges, modals
│   ├── style.css               # Main stylesheet (header, footer, hero, slideshow)
│   ├── library.css             # Library & book styles
│   ├── scan.css                # Scan page styles
│   └── slideshow.css           # Legacy slideshow styles

├── js/
│   ├── main.js                 # Shared UI (slideshow, mobile menu, animations)
│   ├── auth.js                 # Authentication (login/logout, user menu)
│   ├── counter-animate.js      # Animated count-up statistic numbers
│   ├── scan.js                 # AI scan logic and client-side TensorFlow.js
│   ├── library.js               # Library interactivity
│   ├── i18n.js                 # i18n engine
│   ├── admin.js                # Admin dashboard logic
│   ├── admin-ui.js             # Admin UI components
│   ├── admin-portal.js         # Admin broadcast (Socket.IO, email)
│   ├── scan-integration.js      # Scan integration library
│   └── wildlife-data.json       # 1060+ keys, ~50KB species database

├── assets/images/
│   ├── logo.png                # Brand logo
│   ├── background*.png          # Background slideshow images
│   ├── lion.jpg, elephant.jpg, ... # Wildlife imagery
│   └── flags/                  # Language selector flags

├── DESIGN.md                   # Design system documentation
├── app.py                       # Flask backend with REST API and Socket.IO
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── AGENTS.md                    # Architecture documentation
└── README.md                    # This file
```

---

## Design System

| Element | Value |
|---------|-------|
| **Primary** | `#1b5e40` Forest green |
| **Accent** | `#d4a017` Warm gold |
| **Dark** | `#0a1a12` Canvas base |
| **Headings** | Playfair Display |
| **Body** | Inter, sans-serif |
| **Max width** | 1200px |
| **Header height** | 72px (fixed) |
| **Border radius** | 8px (buttons), 16px (cards) |

Design is inspired by **National Geographic**, **WWF**, **Chester Zoo** (dark "Forest Mode"), **Vantara**, and **Search for Lost Species**.

See **[DESIGN.md](DESIGN.md)** for full design system documentation, component library, layout patterns, and research integration.

---

## Environment Setup

### 1. Python Backend

**Required Environment Variables** (`.env`):

```bash
# Flask
FLASK_ENV=development
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
JWT_SECRET_KEY=<generate-separate-key>
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=604800

# Database
DATABASE_URL=sqlite:///instance/wildguard.db

# Email (optional for dev)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@wildguard.org
SENDGRID_FROM_NAME=WildGuard Society

# Push (optional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@wildguard.org

# Admin bootstrap (first run only)
ADMIN_EMAIL=admin@wildguard.org
ADMIN_PASSWORD=<strong-password>
```

### 2. Frontend-Only Development

No special setup needed. You can serve the static files with any HTTP server:

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js (install first)
npx serve .

# Then open http://localhost:8000
```

When running frontend-only, the demo website uses `localStorage` for authentication, favorites, history, and messages.

### 3. Deploy to GitHub Pages

```bash
git push origin main            # Push to GitHub
# GitHub automatically deploys from docs/ or root
```

### 4. Deploy to Azure

```bash
# From root directory:
az login
az group create --name wildguard-rg --location eastus

# Deploy backend (Flask + SQLite → Container Apps)
az containerapp up \
  --name wildguard-backend \
  --resource-group wildguard-rg \
  --source .

# Deploy static frontend (Static Web Apps)
az, deploy on GitHub Pages → configure automatic deployment in Azure Portal
```

---

## API Endpoints (Flask)

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/species` | List species (filters: category, status, search) |
| GET | `/api/species/<id>` | Single species detail |
| GET | `/api/settings` | Public site settings |
| POST | `/api/contact` | Contact form submission |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | User registration |
| POST | `/api/login` | User login (JWT in httpOnly cookie) |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/me` | Current user (requires token) |

### User (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Profile + stats |
| PUT | `/api/user/profile` | Update profile |
| GET | `/api/user/scans` | Scan history |
| POST | `/api/user/scans` | Save scan |
| GET | `/api/user/favourites` | Favorites list |
| POST | `/api/user/favourites` | Add favorite |
| DELETE | `/api/user/favourites/<id>` | Remove favorite |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/species` | Species catalog |
| POST | `/api/admin/species` | Create species |
| PUT | `/api/admin/species/<id>` | Update species |
| DELETE | `/api/admin/species/<id>` | Delete species |
| GET | `/api/admin/messages` | Contact messages |
| DELETE | `/api/admin/messages/<id>` | Delete message |
| GET | `/api/admin/activity` | Activity log |
| POST | `/api/admin/email-campaigns` | Send broadcast email |

### Real-Time (Socket.IO)
| Event | Direction | Description |
|-------|-----------|-------------|
| `stats_update` | S → C | Live admin stats (users, messages, scans) |
| `new_message` | S → C | New contact form message |
| `broadcast_sent` | S → C | Admin broadcast notification |
| `notification` | S → C | User notification |
| `join_user_room` | C → S | Join user-specific room |
| `join_admin_room` | C → S | Join admin room |

---

## Development Workflow

### Setup (first time)
```bash
git clone the repo
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # edit with your values
python app.py         # start Flask + Socket.IO on :5000
```

### Daily development
```bash
source .venv/bin/activate  # activate venv
python app.py              # if working on backend
```

### Testing
```bash
# Python (backend)
pytest tests/

# JavaScript (frontend) — coming soon
# npm test
```

### Linting & Quality
```bash
# Python
ruff format .
ruff check .
mypy app.py

# Frontend (static only, no build step neede)
# CSS passes directly, no build tool
```

---

## Security

### Done
- Removed `admin_credentials.txt`
- Removed hardcoded admin emails/passwords from `auth.js`
- CORS enabled (configurable)
- Password hashing via `bcrypt`
- JWT in httpOnly cookies
- `.env `ius as `.env` auto-deleted from .gitignore
- Bot detection + rate limiting in form

### Pending
- Flask-Talis (HSTS, CSP, XSS protection)
- Proper CSRF protection for forms
- Disk rotation of expithelial encryption for `SECRET_KEY` and `JWT_SECRET_KEY`
- OWASP ZAP scan before production
- Rotate any secrets that were previously in the commit history

---

## Testing

| Type | Tool | Target |
|------|------|--------|
| Unittest (Python) | pytest + pytest-cov | 80% coverage |
| Unittest (Frontend) | Vitest | 70% coverage |
| Integration | pytest + Flask test client | All API endpoints |
| E2E | Playwright | Critical user flows |
| Accessibility | axe-core + Lighthouse | WCAG 2.1 AA |
| Security | bandit, safety, npm audit | Zero high/critical |

---

## Performance Budget

| Metric | Target |
|--------|--------|
| Largest Contentful Paint | < 2s |
| Total Blocking Time | < 250ms |
| Cumulative Layout Shift | < 0.1 |
| Image sizes | < 500KB |

---

## Contributing

1. Fork the repo → create feature branch → open a PR
2. Run tests: `pytest`
3. Follow code style: `ruff` + `black` (Python)
4. Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

---

## License

© 2025-2026 WildGuard Society — **Protecting Tanzania's Wildlife Heritage**

---

## References

- Design System: `DESIGN.md`
- Architecture: `AGENTS.md`
- Project Plan: `PLAN.md` (16-week road map)
- Environment Template: `.env.example`

*Last updated: August 2026*