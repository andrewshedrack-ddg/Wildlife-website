# WildGuard Society - Comprehensive Project Plan

## Executive Summary

WildGuard Society is a wildlife conservation website with a hybrid frontend/architecture:
- **Frontend**: Static HTML/CSS/JS (732 lines CSS, 15+ JS modules)
- **Backend**: Flask (Python) primary API + Node.js/Express skeleton
- **Deployment**: GitHub Pages (frontend) + Azure (backend target)
- **Current State**: Functional demo with mock data, significant technical debt, security issues

---

## 1. Critical Security Issues (P0 - Fix Immediately)

| Issue | Location | Risk | Action | Status |
|-------|----------|------|--------|--------|
| Plaintext admin credentials in `admin_credentials.txt` | Root | Critical - anyone can access admin | Delete file, rotate passwords, use env vars | ✅ **DONE** |
| Hardcoded admin credentials in `js/auth.js:384` | Client-side JS | Critical - visible in browser | Remove fallback, use backend auth only | ✅ **DONE** |
| Hardcoded DB credentials in `backend/db/config.js` | Node backend | High | Remove, use environment variables | ✅ **DONE** (removed `backend/`) |
| `.env` file with real secrets committed | Root | High | Add to .gitignore, rotate all keys | ⚠️ **PENDING** |
| `admin@wildguardsociety.org` / `admin123` in multiple places | Auth system | High | Implement proper admin role assignment | ✅ **DONE** (removed hardcoded emails) |

---

## 2. Architecture & Technical Debt (P1)

### 2.1 Backend Consolidation
**Problem**: Two backends (Flask + Express) serving overlapping purposes
- Flask (`app.py`): 629 lines, full REST API, Socket.IO, SQLAlchemy models
- Express (`backend/api/server.js`): 9 lines, single endpoint, unused

**Plan**: 
- [ ] Deprecate Express backend entirely
- [ ] Complete Flask API implementation (all endpoints functional)
- [ ] Add proper API versioning (`/api/v1/`)
- [ ] Add OpenAPI/Swagger documentation
- [ ] Implement rate limiting, CORS, request validation

### 2.2 Frontend Architecture
**Problem**: Copy-paste HTML components, no templating, 8+ pages with duplicated header/footer
- Each page repeats header, footer, slideshow, nav structure
- No component system - changes require editing 10+ files

**Plan**:
- [ ] Migrate to Jinja2 templates (Flask) or 11ty/Hugo static site generator
- [ ] Extract shared components: `header.html`, `footer.html`, `slideshow.html`, `nav.html`
- [ ] Create base layout template with blocks for page-specific content
- [ ] Implement build step for production (minification, hashing)

### 2.3 CSS Architecture
**Problem**: 732-line monolithic `style.css` with issues:
- Unused variables (`--primary-light`, `--light`)
- Duplicate footer classes (new + legacy)
- Duplicate page banner classes
- Single breakpoint only (768px)
- No focus-visible, reduced-motion, high-contrast support
- Magic numbers/hardcoded colors throughout

**Plan**:
- [ ] Split into: `variables.css`, `reset.css`, `layout.css`, `components.css`, `pages/`
- [ ] Add missing breakpoints: 480px, 768px, 1024px, 1440px
- [ ] Add accessibility media queries
- [ ] Remove duplicate/legacy classes
- [ ] Audit and use CSS variables consistently
- [ ] Consider migrating to Tailwind CSS for maintainability

### 2.4 JavaScript Architecture
**Problem**: 15+ JS files with duplication and inconsistent patterns:
- `main.js` + `auth.js` both handle mobile menu + user dropdown
- No module system (all global IIFEs)
- `auth.js` is 764 lines doing too many things (auth, notifications, email, activity, UI)
- `scan.js` depends on global `mobilenet` from CDN
- No TypeScript, no bundler, no testing

**Plan**:
- [ ] Consolidate `main.js` + `auth.js` shared UI logic
- [ ] Split `auth.js` into: `auth-core.js`, `auth-ui.js`, `notifications.js`, `activity.js`, `email.js`
- [ ] Add ES modules + bundler (Vite/esbuild)
- [ ] Add TypeScript for type safety
- [ ] Make TensorFlow.js a proper npm dependency
- [ ] Add unit tests (Vitest/Jest)

### 2.5 Data Layer
**Problem**: 
- `js/wildlife-data.json` - 1060+ keys, ~50KB, partially generated
- `gen_complete.py` generates 500+ species but not integrated
- Flask models exist but frontend uses localStorage/mock data
- No database migrations, no seeding strategy for production

**Plan**:
- [ ] Connect frontend to Flask API for all data (species, scans, favorites)
- [ ] Implement proper database migrations (Alembic/Flask-Migrate)
- [ ] Create production seeding script with real conservation data
- [ ] Add GBIF/iNaturalist API integration for live species data
- [ ] Implement caching strategy (Redis)

---

## 3. Feature Roadmap

### Phase 1: Foundation & Security (Weeks 1-3)
| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Fix all P0 security issues | P0 | 2 days | ✅ **DONE** |
| Remove Express backend | P1 | 1 day | ✅ **DONE** |
| Add .gitignore for all secrets | P0 | 30 min | ⚠️ Verify |
| Set up Alembic migrations | P1 | 2 days | ⬜ |
| Implement proper JWT auth with refresh tokens | P1 | 3 days | ⬜ |
| Add rate limiting + CORS to Flask | P1 | 1 day | ⬜ |
| Create .env.example template | P1 | 30 min | ✅ **DONE** |
| Add pre-commit hooks (lint, format) | P1 | 1 day | ⬜ |

### Phase 2: Frontend Modernization (Weeks 3-6)
| Task | Priority | Effort |
|------|----------|--------|
| Migrate to Jinja2 templates | P1 | 1 week |
| Split CSS into modular files | P1 | 3 days |
| Add responsive breakpoints | P1 | 2 days |
| Add accessibility improvements | P1 | 3 days |
| Consolidate JS modules | P2 | 1 week |
| Add Vite + TypeScript | P2 | 2 days |
| Set up component library | P2 | 1 week |

### Phase 3: API Completion (Weeks 5-8)
| Task | Priority | Effort |
|------|----------|--------|
| Complete all Flask API endpoints | P1 | 1 week |
| Add OpenAPI/Swagger docs | P2 | 2 days |
| Connect frontend to real API | P1 | 1 week |
| Implement scan persistence | P1 | 3 days |
| Add favorites/bookmarks API | P1 | 2 days |
| Add user profile/history API | P1 | 3 days |
| Admin dashboard real data | P1 | 1 week |

### Phase 4: Advanced Features (Weeks 8-14)
| Task | Priority | Effort |
|------|----------|--------|
| Real AI scan (TensorFlow.js + custom model) | P2 | 2 weeks |
| Multi-language content (i18n) | P2 | 1 week |
| Push notifications (Web Push + VAPID) | P2 | 1 week |
| Offline PWA support | P2 | 1 week |
| Admin analytics dashboard | P3 | 1 week |
| Email campaigns (SendGrid/SES) | P3 | 3 days |
| Donation/Adoption integration | P3 | 2 weeks |

### Phase 5: Production Hardening (Weeks 12-16)
| Task | Priority | Effort |
|------|----------|--------|
| Azure deployment (Container Apps + PostgreSQL) | P1 | 1 week |
| CI/CD pipeline (GitHub Actions) | P1 | 3 days |
| Monitoring (App Insights + alerts) | P1 | 2 days |
| Load testing + optimization | P2 | 1 week |
| Security audit (OWASP) | P1 | 1 week |
| Backup/DR strategy | P2 | 2 days |
| Documentation completion | P2 | 1 week |

---

## 4. Deployment Architecture (Target)

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Frontend     │  │  Backend      │  │  Database     │
│  (Static)     │  │  (Container)  │  │  (PostgreSQL) │
│  Azure Static │  │  Azure        │  │  Azure        │
│  Web Apps     │  │  Container    │  │  Database for │
│  or CDN       │  │  Apps         │  │  PostgreSQL   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
              ┌───────────────────────┐
              │  Azure Front Door /   │
              │  Application Gateway  │
              │  (WAF, SSL, Routing)  │
              └───────────────────────┘
```

**Services**:
- **Frontend**: Azure Static Web Apps (free tier) or Azure CDN + Storage
- **Backend**: Azure Container Apps (Flask + Gunicorn + eventlet)
- **Database**: Azure Database for PostgreSQL (Flexible Server)
- **Cache**: Azure Cache for Redis
- **Monitoring**: Azure Application Insights + Log Analytics
- **Secrets**: Azure Key Vault
- **CI/CD**: GitHub Actions with Azure login

---

## 5. Data Model (Flask SQLAlchemy)

```python
# Current models in app.py - needs migration to Alembic
User          # id, email, password_hash, role, created_at, last_seen, is_online
Message       # id, name, email, subject, message, created_at, is_read
Setting       # id, key, value
Scan          # id, user_id, species_id, image_data, confidence, location, created_at
Favourite     # id, user_id, species_id, created_at
Species       # id, common_name, scientific_name, category, conservation_status, 
              # description, habitat, diet, behavior, image_url, gbif_id
ActivityLog   # id, user_id, action, details, ip_address, created_at
```

**Needed additions**:
- `EmailCampaign` - subject, body, sent_at, recipient_count
- `Notification` - user_id, type, title, message, read, created_at
- `ScanReview` - scan_id, admin_id, status, notes, reviewed_at
- `Donation` - user_id, amount, currency, status, stripe_id, created_at

---

## 6. API Contract (Target)

### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email
```

### Species (Public)
```
GET    /api/v1/species              # List with filters (category, status, search)
GET    /api/v1/species/:id          # Single species detail
GET    /api/v1/species/categories   # List categories
GET    /api/v1/species/conservation-statuses
```

### User (Authenticated)
```
GET    /api/v1/user/profile
PUT    /api/v1/user/profile
GET    /api/v1/user/scans
POST   /api/v1/user/scans
GET    /api/v1/user/favourites
POST   /api/v1/user/favourites
DELETE /api/v1/user/favourites/:id
GET    /api/v1/user/history
GET    /api/v1/user/notifications
PUT    /api/v1/user/notifications/:id/read
```

### Admin (Admin role required)
```
GET    /api/v1/admin/stats
GET    /api/v1/admin/users
GET    /api/v1/admin/species
POST   /api/v1/admin/species
PUT    /api/v1/admin/species/:id
DELETE /api/v1/admin/species/:id
GET    /api/v1/admin/scans/pending
PUT    /api/v1/admin/scans/:id/review
GET    /api/v1/admin/messages
DELETE /api/v1/admin/messages/:id
GET    /api/v1/admin/activity
POST   /api/v1/admin/email-campaigns
GET    /api/v1/admin/email-campaigns
```

---

## 7. Environment Variables (Required)

```bash
# Flask
FLASK_ENV=production
SECRET_KEY=<64-char-random>
JWT_SECRET_KEY=<64-char-random>
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=604800

# Database
DATABASE_URL=postgresql://user:pass@host:5432/wildguard

# Redis
REDIS_URL=redis://:pass@host:6379/0

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@wildguard.org
SENDGRID_FROM_NAME=WildGuard Society

# Azure
AZURE_CLIENT_ID=xxx
AZURE_TENANT_ID=xxx
AZURE_SUBSCRIPTION_ID=xxx
AZURE_RESOURCE_GROUP=wildguard-rg

# AI/ML
TFJS_MODEL_URL=https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet
GBIF_API_URL=https://api.gbif.org/v1
INATURALIST_API_URL=https://api.inaturalist.org/v1

# Push Notifications
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:admin@wildguard.org

# Frontend
NEXT_PUBLIC_API_URL=https://api.wildguard.org/api/v1
```

---

## 8. Testing Strategy

| Layer | Tool | Target |
|-------|------|--------|
| Unit (Python) | pytest + pytest-cov | 80% coverage |
| Unit (JS) | Vitest | 70% coverage |
| Integration | pytest + Flask test client | All API endpoints |
| E2E | Playwright | Critical user flows |
| Accessibility | axe-core + Lighthouse | WCAG 2.1 AA |
| Security | bandit, safety, npm audit | Zero high/critical |

---

## 9. Code Quality Gates (Pre-commit + CI)

```yaml
# .pre-commit-config.yaml
- ruff (lint + format Python)
- black (format Python)
- mypy (type check Python)
- eslint (lint JS/TS)
- prettier (format JS/TS/CSS/HTML)
- pytest (unit tests)
- bandit (security)
- trivy (container scan)
```

---

## 10. Immediate Action Items (This Week)

1. **Day 1**: Delete `admin_credentials.txt`, rotate all passwords, remove hardcoded creds from `auth.js` and `backend/db/config.js`
2. **Day 2**: Add proper `.gitignore`, create `.env.example`, move secrets to Azure Key Vault / GitHub Secrets
3. **Day 3**: Set up Alembic, create initial migration, verify Flask models
4. **Day 4**: Remove Express backend files (`backend/` directory)
5. **Day 5**: Create Jinja2 base template, extract header/footer/slideshow components
6. **Day 6-7**: Begin CSS modularization, add missing breakpoints

---

## 11. Team & Ownership

| Area | Owner | Notes |
|------|-------|-------|
| Backend (Flask) | Backend Lead | API, DB, Auth, Real-time |
| Frontend (Templates/JS) | Frontend Lead | Templates, Components, State |
| DevOps/Infra | Platform Engineer | Azure, CI/CD, Monitoring |
| Design/UX | Designer | CSS, Accessibility, Components |
| Data/ML | ML Engineer | Species data, AI scan model |

---

## 12. Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Zero critical security findings | 0 | Week 1 |
| API response time (p95) | <200ms | Week 8 |
| Frontend Lighthouse score | >90 | Week 6 |
| Test coverage (backend) | >80% | Week 8 |
| Test coverage (frontend) | >70% | Week 8 |
| Deployment frequency | Daily | Week 12 |
| MTTR (mean time to recovery) | <30 min | Week 16 |
| Uptime | 99.9% | Ongoing |

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Azure costs exceed budget | Medium | High | Set budgets/alerts, use dev/test pricing |
| AI model performance poor | Medium | Medium | Prototype early, have fallback |
| Data migration complexity | High | High | Plan migrations early, test thoroughly |
| Scope creep | High | Medium | Strict prioritization, phased delivery |
| Team knowledge gaps | Medium | Medium | Pair programming, documentation |

---

*Last Updated: July 31, 2026*
*Version: 1.0*