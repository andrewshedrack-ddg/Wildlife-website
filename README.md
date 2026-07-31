# WildGuard Society

A wildlife conservation platform for Tanzania's ecosystems — combining education, AI-powered species detection, and community engagement.

> **Note**: The project name is **WildGuard Society** (used throughout the UI). The previous README used "WildGuard Explorer" — this has been corrected.

---

## Current Status (July 2026)

| Aspect | Status |
|--------|--------|
| **Frontend** | Functional demo — 8 HTML pages, 15+ JS modules, 732-line CSS |
| **Backend (Flask)** | Partial — 629-line `app.py` with models, auth, Socket.IO, 19 API routes |
| **Backend (Express)** | Deprecated — skeleton only, will be removed |
| **Database** | SQLite (dev), PostgreSQL (prod target) — not fully wired |
| **Authentication** | JWT + cookies (Flask), localStorage fallback (demo) |
| **Real-time** | Socket.IO admin dashboard + user notifications |
| **AI/Scan** | TensorFlow.js MobileNet simulation (client-side only) |
| **i18n** | 4 languages (EN, FR, SW, ES) — 288+ translation keys |
| **Deployment** | GitHub Pages (frontend only), Azure (planned) |
| **Security** | ⚠️ **Critical issues present** — see [Security](#security--compliance) |

---

## Features

### Public Pages
- **Home** (`index.html`) — Hero slideshow, Big Five wildlife cards, Tanzania parks grid, conservation initiatives, get-involved CTA
- **Wildlife Library** (`library/`) — 8 taxonomic categories (mammals, birds, reptiles, amphibians, aquatic, plants, fungi, bacteria, viruses), search, biome filter, collapsible "scanned" section, 500+ species data
- **Scan Mode** (`scan.html`) — Camera/upload interface, TensorFlow.js classification, voice commands, text-to-speech field guide, offline-capable
- **About** (`about.html`) — Mission, vision, impact statistics
- **Contact** (`contact.html`) — Form (mailto fallback), field team info

### Authenticated User Pages (`user/`)
- **Profile** — Avatar, stats (scans, favorites, parks), account settings form
- **History** — Scan timeline with confidence scores, summary statistics
- **Favorites** — Bookmarked species gallery

### Admin Portal (`admin/`)
- **Dashboard** — Real-time stats (Socket.IO), 7-metric cards, quick actions
- **Pending Scans** — Review/approve user submissions
- **Messages** — Contact form submissions management
- **Notifications** — System + user notifications
- **Users** — Registered user list with roles
- **Traffic/Activity Log** — Audit trail
- **Email Campaigns** — Compose + broadcast to all users
- **Manage Animals** — CRUD table for species catalog
- **Upload Species** — Form with drag-drop image preview

---

## Architecture

```
Wildlife-website/
├── *.html                 # 8 root pages
├── css/
│   ├── style.css         # 732 lines — main stylesheet (needs modularization)
│   ├── slideshow.css     # Background slideshow
│   ├── scan.css          # Scan page styles
│   └── library.css       # Library page styles
├── js/
│   ├── main.js           # Shared UI (slideshow, mobile menu, animations)
│   ├── auth.js           # 764 lines — auth, notifications, email, activity (needs split)
│   ├── scan.js           # 749 lines — scan logic, TF.js, voice, TTS
│   ├── library.js        # Library interactivity
│   ├── slideshow.js      # Slideshow controller
│   ├── i18n.js           # i18n engine
│   ├── config.js         # Config + API integrations
│   ├── alert.js          # Toast notifications
│   ├── system-monitor.js # Admin monitoring
│   ├── admin.js          # Admin dashboard logic
│   ├── admin-ui.js       # Admin UI components
│   ├── admin-portal.js   # Admin portal (Socket.IO, email, broadcast)
│   ├── admin-auth-guard.js
│   └── wildlife-data.json # 1060+ keys, ~50KB species database
├── js/i18n/
│   ├── en.json (288+ lines), fr.json, sw.json, es.json
├── library/              # 10 category pages
├── admin/                # 3 admin pages
├── user/                 # 3 user pages + empty README
├── assets/images/        # 67 files (species, backgrounds, flags, moments)
├── app.py                # Flask backend (629 lines) — PRIMARY BACKEND
├── requirements.txt      # Python deps (Flask, SQLAlchemy, SocketIO, JWT, Bcrypt)
├── backend/              # DEPRECATED Node.js/Express skeleton
│   ├── api/server.js     # 9 lines — single endpoint
│   ├── db/config.js      # Hardcoded MySQL creds (security issue)
│   └── model/species.js  # 2 hardcoded species
├── admin-guard.js        # Admin auth redirect
├── sw.js                 # Service Worker (PWA)
├── gen_complete.py       # Species data generator (500+ entries)
├── verify_lib.py         # Library feature validator
├── check_*.py            # Debug/validation scripts
├── .env                  # ⚠️ Contains secrets (in .gitignore but on disk)
├── .env.local            # Next.js/Supabase remnants
├── admin_credentials.txt # ⚠️ PLAINTEXT PASSWORDS — DELETE IMMEDIATELY
├── .github/workflows/deploy.yml # GitHub Pages deploy
└── AGENTS.md             # Architecture documentation
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3 (CSS Variables, Glassmorphism), Vanilla JS (ES6+) |
| **Backend** | **Flask 3.0** (Python 3.11+) — primary; Node.js/Express — deprecated |
| **Database** | SQLite (dev), **PostgreSQL** (prod target via Azure) |
| **Real-time** | Flask-SocketIO + eventlet |
| **Auth** | PyJWT (access + refresh tokens), Flask-Bcrypt, httpOnly cookies |
| **AI/ML** | TensorFlow.js (MobileNet) — client-side simulation |
| **i18n** | Custom JSON-based system (4 languages) |
| **Icons/Fonts** | Font Awesome 6, Google Fonts (Inter + Playfair Display) |
| **Deployment** | GitHub Pages (static), **Azure** (Container Apps + PostgreSQL + Redis) |
| **CI/CD** | GitHub Actions (planned) |
| **Monitoring** | Azure Application Insights (planned) |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+ (for tooling only — no Express runtime needed)
- Git

### Local Development

```bash
# 1. Clone
git clone https://github.com/<your-org>/Wildlife-website.git
cd Wildlife-website

# 2. Python environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Environment variables
cp .env.example .env  # Create this file first — see below
# Edit .env with your values

# 4. Run Flask backend
python app.py
# Serves at http://localhost:5000 (all static files + API)

# 5. Or serve static only (for frontend-only work)
# npx serve .  # or any static server
```

### Required Environment Variables (`.env`)

```bash
# Flask
FLASK_ENV=development
SECRET_KEY=<generate-with: python -c "import secrets; print(secrets.token_hex(32))">
JWT_SECRET_KEY=<generate-separate-key>
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=604800

# Database (SQLite for dev)
DATABASE_URL=sqlite:///instance/wildguard.db

# Email (SendGrid — optional for dev)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@localhost
SENDGRID_FROM_NAME=WildGuard Society

# Push Notifications (VAPID — generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@localhost
```

### Generate Species Data (Optional)

```bash
# Generates js/wildlife-data.json with 500+ species
python gen_complete.py
```

---

## API Endpoints (Flask)

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/species` | List species (query: category, status, search) |
| GET | `/api/species/<id>` | Single species detail |
| GET | `/api/settings` | Public site settings |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | User registration |
| POST | `/api/login` | User login (returns JWT in cookie) |
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

### Admin (Requires `admin` role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/species` | Species catalog |
| POST | `/api/admin/species` | Create species |
| PUT | `/api/admin/species/<id>` | Update species |
| DELETE | `/api/admin/species/<id>` | Delete species |
| GET | `/api/admin/messages` | Contact messages |
| GET | `/api/admin/scans/pending` | Pending scan reviews |
| PUT | `/api/admin/scans/<id>/review` | Approve/reject scan |
| GET | `/api/admin/activity` | Activity log |
| POST | `/api/admin/email-campaigns` | Send broadcast email |

---

## Security & Compliance

### ✅ FIXED — Critical Issues Resolved

1. ~~**`admin_credentials.txt`** — Contains plaintext admin emails/passwords. **DELETED**~~ ✅
2. ~~**`js/auth.js:384`** — Hardcoded fallback admin credentials (`admin@wildguardsociety.org` / `admin123`). **REMOVED**~~ ✅
3. ~~**`backend/db/config.js`** — Hardcoded MySQL root password. **Entire `backend/` directory REMOVED**~~ ✅
4. **`.env` on disk** — Contains real `SECRET_KEY`, VAPID keys. Ensure in `.gitignore`, rotate all values. ⚠️
5. **Client-side auth fallback** — `auth.js` uses localStorage demo mode. Disable in production. ⚠️

### Remaining Hardening
- [ ] Rotate all secrets after removing from repo history
- [ ] Enable Flask-Talisman (HSTS, CSP, XSS protection)
- [ ] Add rate limiting (Flask-Limiter)
- [ ] Implement CSRF protection for forms
- [ ] Audit all `innerHTML` usage for XSS
- [ ] Run `bandit` and `safety` in CI
- [ ] OWASP ZAP scan before production

---

## Development Roadmap

See **[PLAN.md](PLAN.md)** for detailed 16-week plan with phases:

| Phase | Focus | Timeline |
|-------|-------|----------|
| 1 | Security + Backend Consolidation | Weeks 1-3 |
| 2 | Frontend Modernization (Templates, CSS, JS) | Weeks 3-6 |
| 3 | API Completion + Frontend Integration | Weeks 5-8 |
| 4 | Advanced Features (AI, PWA, i18n, Email) | Weeks 8-14 |
| 5 | Production Hardening (Azure, CI/CD, Monitoring) | Weeks 12-16 |

### Immediate Priorities (This Week)
- [ ] Delete `admin_credentials.txt` and rotate credentials
- [ ] Remove hardcoded secrets from `auth.js`, `backend/db/config.js`
- [ ] Delete deprecated `backend/` directory
- [ ] Create `.env.example` template
- [ ] Set up Alembic migrations for Flask models
- [ ] Begin Jinja2 template extraction (header, footer, slideshow)

---

## Deployment (Target Architecture)

```
GitHub Actions CI/CD
        │
        ├── Frontend → Azure Static Web Apps (or CDN + Storage)
        ├── Backend  → Azure Container Apps (Flask + Gunicorn + eventlet)
        ├── Database → Azure Database for PostgreSQL (Flexible Server)
        ├── Cache    → Azure Cache for Redis
        ├── Secrets  → Azure Key Vault
        └── Monitor  → Application Insights + Log Analytics
```

**Current**: GitHub Pages only (static frontend, no backend)

---

## Project Structure Conventions

- **CSS**: Mobile-first, CSS variables for theming, 768px primary breakpoint
- **JS**: IIFE modules (migrating to ES modules + TypeScript)
- **HTML**: Semantic, accessible, shared components via templates
- **Python**: Type hints, SQLAlchemy 2.0 style, Pydantic for validation
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`)

---

## Contributing

1. Fork → feature branch → PR
2. Run pre-commit hooks: `pre-commit run --all-files`
3. Ensure tests pass: `pytest` (backend), `npm test` (frontend, when added)
4. Follow code style: `ruff` + `black` (Python), `eslint` + `prettier` (JS/TS)

---

## License

© 2025-2026 WildGuard Society | Protecting Tanzania's Wildlife Heritage

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `PLAN.md` | Full 16-week project plan with tasks, risks, metrics |
| `AGENTS.md` | Architecture documentation for AI agents |
| `app.py` | Flask backend — primary server |
| `requirements.txt` | Python dependencies |
| `css/style.css` | Main stylesheet (needs split) |
| `js/auth.js` | Auth + notifications + email (needs split) |
| `js/scan.js` | Scan page AI/voice/TTS logic |
| `js/wildlife-data.json` | Species database |
| `gen_complete.py` | Data generator for species DB |
| `.github/workflows/deploy.yml` | GitHub Pages deployment |

---

*Last updated: July 31, 2026*