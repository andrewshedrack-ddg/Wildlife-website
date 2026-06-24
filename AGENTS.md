# WildGuard Society - System Architecture

## 1. Overview

WildGuard Society is a wildlife conservation website built with:
- **Frontend**: HTML5, CSS3Factory Pattern
- **Backend**: Flask (Python) + Node.js/Express API (hybrid setup)
- **Deployment**: GitHub Pages (frontend), Azure (backend)
- **Design System**: Custom CSS with glassmorphism, consistent across all pages

## 2. Project Structure

```
Wildlife-website/
├── index.html              # Home page (hero, wildlife cards, parks, conservation)
├── about.html              # Mission, vision, impact
├── contact.html            # Contact form and field team info
├── scan.html               # Real-time wildlife scan simulation
├── login.html              # User login
├── register.html           # User registration
├── admin-login.html        # Admin authentication
├── admin.html              # Admin dashboard
├── css/
│   └── style.css           # Main unified stylesheet
├── js/
│   ├── main.js             # Shared JS (slideshow, mobile menu, animations)
│   ├── auth.js             # Authentication logic
│   └── scan.js             # Scan page functionality
├── library/
│   └── library.html        # Wildlife library by category
├── user/
│   ├── Profile.html
│   ├── History.html
│   └── Favourite.html
├── admin/
│   ├── Dashboard.html
│   ├── manage-animals.html
│   └── upload.html
├── assets/
│   └── images/             # Wildlife photos, backgrounds, logo
└── AGENTS.md               # Agent documentation
```

## 3. Design System

### Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#1b5e40` | Brand color, links |
| Primary Dark | `#143d2a` | Header background |
| Accent | `#c9a227` | CTAs, highlights, footer links hover |
| Dark | `#0f1f17` | Body background |
| White | `#ffffff` | Text on dark backgrounds |

### Typography
- **Body**: `Inter`, sans-serif (weights 300-700)
- **Headings**: `Playfair Display` (weights 400-700)

### Layout
- **Max width**: 1200px
- **Header height**: 72px (fixed)
- **Section padding**: 5rem top/bottom
- **Border radius**: 8px (buttons), 16px (cards)

## 4. Component Architecture

### Header (`site-header`)
- Fixed top, glassmorphism effect
- Logo (left) + Navigation (center) + Auth actions (right)
- Mobile: hamburger menu slides in from right
- Active page state via `.active` class on nav link

### Background Slideshow (`page-slideshow`)
- Full-viewport fixed background with 5 slides
- CSS transitions (2.5s) with JavaScript interval cycling
- Gradient overlay for text readability

### Cards (`card` / `feature-card`)
- Glassmorphism background (4% white opacity)
- Subtle border, hover lift effect
- Intersection Observer animation on scroll

### Footer (`site-footer`)
- 4-column grid: Brand + 2x Links + Contact
- Social icons hover with accent color
- Consistent across all pages

## 5. JavaScript Architecture

### `main.js`
```
DOMContentLoaded
├── Update footer year
├── Header scroll effect (adds .scrolled class)
├── Mobile menu toggle (click + outside click)
├── User menu dropdown toggle
├── Slideshow auto-cycle (5s interval, if slides > 1)
└── Intersection Observer for card animations
```

### `auth.js`
- Authentication state management (login/logout)
- JWT token handling (if connected to backend)
- User menu visibility toggle based on login state

### `scan.js`
- Camera access (getUserMedia API)
- Simulated AI detection overlay
- Real-time feedback loop

## 6. Page-Specific Notes

| Page | Features |
|------|----------|
| index.html | Hero section, wildlife cards (expandable), parks grid, conservation feature cards, get-involved CTA |
| about.html | Page banner, mission/vision/impact sections |
| contact.html | Page banner, contact form (mailto), contact details |
| scan.html | Page banner, simulated AI scan interface |
| library.html | Tabbed categories, search, biome filter, expandable cards |

## 7. Deployment Pipeline

```
Local Development
       |
       v
GitHub Pages (frontend) ──> Azure Static Web Apps (production)
       |
       v
Flask/Express API (Azure App Service or Container Instances)
```

## 8. Future Architecture Considerations

1. **Component System**: Currently copy-paste HTML components. Migrate to a templating system (Jinja2 for Flask, or a static site generator like 11ty/Hugo).
2. **CSS Architecture**: Consider migrating to a utility-first framework (Tailwind CSS) or CSS-in-JS for larger scale.
3. **State Management**: As user-facing features grow (favorites, history), consider a lightweight state library or reactive framework (Alpine.js, Vue, or Svelte).
4. **API Integration**: The frontend is currently a static demo. Connect to the Flask/Express backend for dynamic data (species database, user auth, scan logs).
5. **Accessibility**: Add ARIA labels, focus management, and color contrast testing.
6. **Performance**: Optimize images (WebP, lazy loading), minify assets, and implement service workers for offline capability.

## 9. Design Principles

1. **Consistency**: Every page uses the same header, footer, and CSS variables.
2. **Readability**: High contrast text on dark backgrounds, clear hierarchy.
3. **Performance**: Minimal JavaScript, CSS optimized, deferred scripts.
4. **Mobile-First**: Responsive grid, touch-friendly targets (min 44px), hamburger menu.
5. **Accessibility**: Semantic HTML, alt text for images, keyboard navigation support.

---

*Last updated: June 24, 2025*
