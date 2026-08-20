# WildGuard Society - Project Roadmap & TODO List

> Last Updated: August 18, 2026
> Status: PostgreSQL-ready, JWT refresh tokens, CI/CD, admin moderation & tests complete

---

## ✅ COMPLETED: Admin Moderation, Tests & Accessibility (Current Sprint)

### Admin Dashboard Completion
- **User management** (admin/Dashboard.html):
  - Backend `PUT /api/admin/users/<id>` — promote/demote role, ban/unban (`is_active`)
  - Banned accounts cannot log in or call the API (enforced in login + decorators)
  - Frontend Users tab: Promote/Demote + Ban/Unban buttons (backend-gated, self-protection)
- **Scan review queue**:
  - Backend `GET /api/admin/scans/pending` + `PUT /api/admin/scans/<id>/review` (approved/rejected)
  - `Scan.status` column (`pending` default) + Alembic migration `a1b2c3d4e5f6`
  - Frontend Pending Scans tab wired to the backend queue with fallback to localStorage
- **Site settings management**:
  - Fixed `PUT /api/admin/settings` to upsert (was a no-op on fresh DB)
  - New Settings tab in Dashboard.html (site name, announcement, contact email, limits)
- **Activity logging**: logins/admin logins now write ActivityLog entries
- **Hardened static admin fallback**: removed hardcoded fallback password from admin-login.html

### Backend Tests
- Added `tests/test_admin_extra.py` (13 tests): settings upsert, activity log, send-email,
  user moderation (promote/ban/self-guard/invalid role), scan review queue, broadcast→notification
- Full backend suite now at **94 tests passing** (SQLite + PostgreSQL in CI)

### Frontend Tests (Vitest)
- Added `package.json` + `vitest.config.js` (jsdom), `npm test`
- Tests for `WildGuardConfig` (translations, params, RTL) and `WildGuardSpeciesDB` image normalization
- Fixed a real bug found by tests: `normalizeImage` double-prefixed `assets/images/` paths
- CI: new `test-frontend` job runs Vitest (npm ci + npm test)

### WCAG 2.1 Accessibility Pass
- **Skip links** added to all 26 pages (WCAG 2.4.1 Bypass Blocks) + `.skip-link` CSS (visually hidden until focus)
- **Focus management**: dialog focus trap in `wg-dialog.js` (WCAG 2.1.2), mobile sidebar `aria-expanded` + focus, Escape closes drawer
- **Labels**: admin-login labels now `for`-associated; Profile toggle switches + scan file input + admin sidebar buttons given `aria-label`
- **Headings**: single `h1` per page (fixed admin.html/manage-animals.html/upload.html); fixed duplicate `id` on admin.html `<main>`
- **Live regions**: `aria-live="polite"` on toast containers (main.js + admin.js)
- **Semantics**: editModal in manage-animals.html now `role="dialog"` + `aria-modal` + labelled inputs

---

## ✅ COMPLETED: Session Auth, DB & CI/CD (Previous Sprint)

### JWT Refresh-Token Session Management (auth overhaul)
- **Added** rotating refresh tokens (HttpOnly `refresh_token` cookie, SameSite=Strict)
- **Added** `/api/auth/refresh` — rotates token pair, marks old as revoked, links replacement
- **Added** reuse-detection: presenting a rotated token revokes the user's whole token family
- **Added** `/api/logout` (user) + hardened `/api/admin/logout` — revoke family + clear cookies
- **Added** password-change token revocation (all sessions invalidated on password rotation)
- **Added** `RefreshToken` model (SHA-256 hashes only, revocation + rotation support)
- **Separated** `JWT_SECRET_KEY` from `SECRET_KEY`; access TTL 15 min (rotatable), refresh 7 days
- **Frontend**: transparent 401 → refresh → retry in `user-api.js` + `admin-api.js`; logout revokes server-side

### PostgreSQL Support & Database Migrations
- **Fixed** broken Alembic chain: replaced auto-migrations (which assumed pre-existing tables) with a single clean baseline (`3f8c1a2d4e6b`) that creates the full schema on any engine
- **Verified** `flask db upgrade` against fresh SQLite + rendered PostgreSQL DDL
- **Added** `TEST_DATABASE_URL` support in `tests/conftest.py` so the suite runs against a real PostgreSQL service container in CI
- Backend already reads `DATABASE_URL` — set to a `postgresql://` string for production

### CI/CD Pipeline (GitHub Actions)
- **Added** `.github/workflows/ci.yml` — lint (ruff) + tests on SQLite and PostgreSQL (service container)
- **Rewrote** `.github/workflows/deploy.yml`:
  - Frontend → GitHub Pages (curated publish set, no backend source/secrets)
  - Backend → Azure App Service (tests → zip deploy → app settings → startup), gated on `AZURE_*` secrets
- **Added** `wsgi.py` (gunicorn + eventlet entry) and `Dockerfile` (Container Apps / App Service Linux)
- **Added** `requirements-dev.txt` (pytest, ruff) and `ruff.toml` (backend lints clean: `ruff check app.py tests/`)

---

## ✅ COMPLETED: Security Hardening & AI Honesty (Current Sprint)

### M3: Remove Plaintext Password Comparison (auth.js)
- **Removed** custom `simpleHash()` function (weak client-side hashing)
- **Removed** client-side password verification in demo/fallback mode
- **Updated** login to accept any password in demo mode (backend required for real auth)
- **Updated** registration to not store password hashes client-side
- **Updated** `changeUserPassword()` to require backend authentication
- **Removed** `window.simpleHash` global export

### AI Data Honesty: Replace Fabricated Confidence Scores (scan.js)
- **Fixed** `tagsToSpecies()`: replaced `70 + Math.random() * 25` with fixed 75% (cloud vision tag match)
- **Fixed** `simulateScanAsync()`: replaced `Math.random() * 10 + 87` / `82` with honest model scores:
  - Cloud vision / trained model: use actual confidence from API
  - MobileNet: use actual prediction confidence
  - Filename match: fixed 70% (weak signal)
- **Fixed** `showNonLivingResult()`: replaced random fallback with fixed 75%

### AI Data Honesty: Remove Theater Loading Animation (scan.js)
- **Removed** fake sequential delays (900ms + 600ms + 700ms) with messages:
  - "Analyzing image with neural network..."
  - "Detecting features..."
  - "Matching against species database..."
- **Replaced** with single "Finalizing results..." + 50ms yield (real work already done)

### AI Data Honesty: Honest Fallback Messaging for /api/scan (scan.js)
- **Updated** `cloudScan()` to return structured result with `available` flag and `reason`/`message`
- **Added** fallback reasons: `no_backend` (static hosting), `offline`, `unconfigured`, `network_error`
- **Updated** `simulateScanAsync()` to show "Cloud AI unavailable — using on-device model..." when falling back
- **Updated** AI source badge to display full fallback chain (e.g., "Trained wildlife AI — cloud unavailable: no_backend")

---

## 🔄 IN PROGRESS / NEXT PRIORITIES

### Backend Integration & Deployment
- [ ] **Deploy Flask backend to Azure** (Container Apps / App Service)
  - Configure `AZURE_VISION_ENDPOINT` and `AZURE_VISION_KEY` for cloud AI
  - Set `SECRET_KEY`, `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in Azure
  - Configure CORS for GitHub Pages origin
- [ ] **Deploy frontend to GitHub Pages** (already configured)
  - Verify `backendApiBase()` correctly detects GitHub Pages and returns ""
  - Test fallback chain: Cloud → Trained AI → MobileNet → Filename
- [ ] **Configure Azure AI Vision** (or alternative)
  - Provision Cognitive Services resource
  - Test `/api/scan` endpoint with real images

### Database & Persistence
- [ ] **Migrate production data to PostgreSQL** (Azure Database for PostgreSQL)
  - ✅ Backend supports `DATABASE_URL=postgresql://` + Alembic baseline migration
  - ✅ CI runs the full suite against a PostgreSQL container
  - [ ] Provision Azure Database for PostgreSQL and point the app at it
  - [ ] Move users, scans, favourites, messages, activity logs, refresh tokens to PostgreSQL
- [x] **Implement proper session management** (JWT + refresh tokens)
  - ✅ HttpOnly Secure cookies
  - ✅ Token rotation + reuse detection + revocation (logout / password change)
- [x] **Add database migrations** (Flask-Migrate baseline `3f8c1a2d4e6b`)

### Admin Features
- [x] **Complete admin dashboard** (admin/Dashboard.html)
  - ✅ User management (list, ban, promote) — `PUT /api/admin/users/<id>`
  - ✅ Species CRUD (has API + manage-animals.html)
  - ✅ Scan approval queue (pending → approved/rejected) — `/api/admin/scans/*`
  - ✅ Broadcast messaging to users (Email Campaign tab)
  - ✅ Site settings management (Settings tab + upsert fix)
- [ ] **Admin authentication hardening**
  - Separate admin login flow (admin-login.html)
  - Role-based access control (admin_required decorator)

### User Features
- [x] **Profile page** (user/Profile.html) - complete with:
  - Avatar upload
  - Bio, location, preferences
  - Password change (backend)
  - Account deletion
- [x] **History page** (user/History.html) - scan history with filters
- [x] **Favorites page** (user/Favourite.html) - saved species
- [x] **Inbox/Notifications** (user/Inbox.html) - admin messages, scan status

### AI/ML Improvements
- [ ] **Improve WildGuardAI on-device model**
  - Increase training species (currently MAX_TRAIN=60)
  - Add geographic boosting (already implemented)
  - Cache model in IndexedDB for faster loads
- [ ] **Add custom wildlife classifier** (transfer learning)
  - Train on curated wildlife dataset
  - Export as TF.js model
- [ ] **Real-time species detection** (video stream)
  - Process camera frames continuously
  - Show live detections overlay

### Mobile & PWA
- [x] **Service Worker** (sw.js) - offline support
  - Caches static assets (project-path aware for GitHub Pages)
  - Serves cached assets offline with network fallback + runtime caching
- [x] **Web App Manifest** - installable PWA (manifest.webmanifest + registration on all pages)
- [ ] **Camera improvements**
  - Better mobile camera handling
  - Torch/flash support
  - Zoom control

### Accessibility & i18n
- [x] **WCAG 2.1 AA — core pass**
  - ✅ Skip links (2.4.1), dialog focus trap (2.1.2), focus-visible rings
  - ✅ Form labels + icon-button aria-labels, aria-live toasts
  - ✅ Single h1 per page, reduced-motion media queries
- [ ] **WCAG 2.1 AA — remaining**
  - [ ] axe-core audit + color contrast testing
  - [ ] Keyboard navigation full coverage review
- [ ] **Complete i18n translations** (en, es, fr, sw)
  - All UI strings externalized
  - RTL support for Arabic (future)

### Testing & Quality
- [x] **CI/CD Pipeline** (GitHub Actions) — lint + SQLite/PostgreSQL tests on PR/push
- [x] **Backend unit + integration tests** (pytest, 94 tests) — auth, refresh, admin moderation, user data, public endpoints
- [x] **Frontend unit tests** (Vitest + jsdom, 16 tests) — config/i18n, species-db
- [ ] **E2E tests** (Playwright/Cypress)

### Monitoring & Analytics
- [ ] **Application Insights** (Azure) - backend telemetry
- [ ] **Frontend error tracking** (Sentry or similar)
- [ ] **User analytics** (privacy-respecting)
- [ ] **Performance monitoring** (Core Web Vitals)

---

## 📋 BACKLOG (Future Sprints)

### Advanced Features
- [ ] **Community features**
  - User comments on scans
  - Species discussions
  - Leaderboards (most scans, rarest finds)
- [ ] **Conservation actions**
  - Donate to organizations
  - Report poaching/illegal trade
  - Volunteer opportunities
- [ ] **Educational content**
  - Species quizzes
  - Conservation courses
  - Interactive maps

### Platform Expansion
- [ ] **Native mobile apps** (React Native / Flutter)
- [ ] **API for third-party integrations**
- [ ] **Webhook system** for real-time updates

### Infrastructure
- [ ] **Multi-region deployment** (Azure Front Door)
- [ ] **Auto-scaling** for backend
- [ ] **CDN** for static assets (Azure CDN / Cloudflare)
- [ ] **Database read replicas**

---

## 🐛 KNOWN ISSUES / TECH DEBT

### Frontend
- [ ] `scan.js` is very large (~2200 lines) - consider splitting into modules
- [ ] Some inline styles in JS - move to CSS
- [ ] `speciesDB` embedded in scan.js - move to separate JSON (partially done with wildlife-data.json)

### Backend
- [ ] In-memory rate limiting (not distributed) - use Redis in production
- [ ] Background stats updater runs per-process - use scheduled job in production
- [ ] SocketIO uses threading mode - consider eventlet/gevent for production

### Security
- [x] **Content Security Policy (CSP) headers** - added via Flask `after_request` (backend)
- [x] **Subresource Integrity (SRI) for external scripts** (FontAwesome) - all HTML pages
- [ ] Regular dependency updates (Dependabot)

---

## ✅ DEFINITION OF DONE

For each task:
- [ ] Code implemented and reviewed
- [ ] Tests written and passing
- [ ] Linting passes (`npm run lint`, `ruff check`, `mypy` / `pyright`)
- [ ] Type checking passes (`tsc --noEmit` / `pyright`)
- [ ] Documentation updated
- [ ] Deployed to staging and verified
- [ ] No console errors in browser
- [ ] Accessibility audit passed (axe-core)

---

## 📅 MILESTONES

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Security Hardening Complete | Aug 2026 | ✅ Done |
| AI Honesty Fixes Complete | Aug 2026 | ✅ Done |
| JWT Refresh Tokens + Session Rotation | Aug 2026 | ✅ Done |
| PostgreSQL-Ready Backend + Migrations | Aug 2026 | ✅ Done |
| CI/CD Pipeline (GitHub Actions) | Aug 2026 | ✅ Done |
| Backend Tests (94) + Frontend Tests (Vitest) | Aug 2026 | ✅ Done |
| Admin Dashboard (moderation, queue, settings) | Aug 2026 | ✅ Done |
| WCAG 2.1 Core Accessibility Pass | Aug 2026 | ✅ Done |
| Backend Deployed to Azure | Sep 2026 | 🔄 Planned |
| Frontend on GitHub Pages | Sep 2026 | 🔄 Planned |
| Full User Features | Oct 2026 | 📋 Backlog |
| PWA + Offline Support | Nov 2026 | 📋 Backlog |
| v1.0 Release | Dec 2026 | 📋 Planned |

---

## 🔗 RELATED FILES

- `AGENTS.md` - System architecture documentation
- `app.py` - Flask backend
- `js/auth.js` - Authentication (hardened)
- `js/scan.js` - Wildlife scanning (AI honesty fixes)
- `js/ai-trainer.js` - On-device transfer learning
- `js/scan-integration.js` - Admin approval + library rendering
- `requirements.txt` - Python dependencies
- `package.json` - Node dependencies (if any)

---

*Generated by WildGuard Society development team*