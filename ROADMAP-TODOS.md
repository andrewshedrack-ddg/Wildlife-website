# WildGuard Society - Project Roadmap & TODO List

> Last Updated: August 9, 2026
> Status: Core security hardening & AI honesty fixes complete

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
- [ ] **Migrate from localStorage to PostgreSQL** (Azure Database for PostgreSQL)
  - Users, scans, favorites, messages, activity logs
  - Admin notifications, email queue
- [ ] **Implement proper session management** (JWT + refresh tokens)
  - HttpOnly Secure cookies
  - Token rotation
- [ ] **Add database migrations** (Flask-Migrate already configured)

### Admin Features
- [ ] **Complete admin dashboard** (admin/Dashboard.html)
  - User management (list, ban, promote)
  - Species CRUD (already has API)
  - Scan approval queue (pending → approved/rejected)
  - Broadcast messaging to users
  - Site settings management
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
- [ ] **WCAG 2.1 AA compliance**
  - Focus management
  - ARIA labels
  - Color contrast
  - Keyboard navigation
- [ ] **Complete i18n translations** (en, es, fr, sw)
  - All UI strings externalized
  - RTL support for Arabic (future)

### Testing & Quality
- [ ] **Unit tests** (pytest for backend, Jest for frontend)
- [ ] **Integration tests** (API endpoints)
- [ ] **E2E tests** (Playwright/Cypress)
- [ ] **CI/CD Pipeline** (GitHub Actions)
  - Lint, typecheck, test on PR
  - Auto-deploy to staging/production

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
| Backend Deployed to Azure | Sep 2026 | 🔄 Planned |
| Frontend on GitHub Pages | Sep 2026 | 🔄 Planned |
| Full User Features | Oct 2026 | 📋 Backlog |
| Admin Dashboard Complete | Oct 2026 | 📋 Backlog |
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